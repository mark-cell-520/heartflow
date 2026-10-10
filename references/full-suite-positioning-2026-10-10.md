# 全量回归的定位纠偏：从「提交门禁」降级为「每日记账任务」

**触发事故（2026-10-10，同一天连发两次会话中断）**

用户只要求「升级心虫 + 审计问题」。我跑了三轮全量回归（11:32 / 12:14 / 12:51），
**三轮零有效产出**：一轮被打断、一轮被自己的单例锁拦下、一轮被 `Killed`。
根因不是某一次失误，是**纪律本身不适配当前规模**：

- `guard-abilities.js` 第 6 项内联 `execSync('node test/run-all.js', {timeout: 420000})`
- 测试规模已从技能编写时的 ~500 涨到 **18262 个用例 / 137 个文件 / 扫描 29 万个文件**
- 单轮在 4GB 容器里跑 20+ 分钟；guard 因此从 ~2 分钟变成 ~7 分钟
- agent 对话中断 → 测试进程不停、后台继续跑 → 下一轮对话又起一轮 →
  **两轮叠加撑爆容器 4GB** → gateway OOM-kill / shutdown_watchdog 自杀 → 会话中断
- 中断后重启清零，同样的用法下一轮又复现

## 用户的三条诊断（原话）

> 1. 启动新一轮全量回归前，先让 agent 执行 `ps aux | grep run-all` 确认没有残留进程
> 2. 日常迭代只跑相关的单个测试文件或按目录分批跑，全量回归控制在每天 1-2 次
> 3. 让 agent 给测试运行器加约 20 行的单例锁，同一时间只允许一个全量回归

用户后续追问「为什么要跑全量，有什么作用和意义，我只是升级心虫和审计问题」——
这一句点破了实质：**全量对「升级 + 审计」类任务没有不可替代的验证作用。**

## 全量唯一不可替代的作用：记账

`data/test-count.json` 只有全量会更新，而 `doc-numbers-accuracy` 守卫读它校验
README 的「N passing tests」宣称。这是**记账**，一天一次足够，不是代码验证。

## 已落地的三项修复（r645/r646）

### 1. `test/run-all.js` 单例锁（`acquireSingleton()`，约 70 行）

启动时先扫其它活 runner，发现就 `exit 2` 并报出 PID + 处置命令：

```js
const others = _listRunnerPids();   // ps -eo pid=,comm=,args= + 双判据过滤
if (others.length > 0 && !FORCE) { /* 拒绝启动 */ process.exit(2); }
```

- **双判据**：`comm` 匹配 `/^node(-MainThread|js)?$/` **且** args 含 `run-all.js`。
  第一版只写 `node` 在 Node 26 上静默失效——`ps comm` 是 `node-MainThread`
  （线程名），不是 `node`。**是负例测试抓到它的**，只跑正向「能启动」会一直绿灯。
- 逃生门：`HF_RUN_ALL_FORCE=1`（锁文件残留但进程确实已死时）
- 锁文件 `data/.run-all.lock`，退出时清理

### 2. `guard-abilities.js` 第 6 项改为读缓存

不再内联跑全量，改为读 `data/test-count.json`：

| 缓存状态 | 守卫判定 |
|---|---|
| 无缓存 / 无 `at` | skip（提示手动跑，不判红） |
| 超过 7 天 | skip（提示刷新记账） |
| `failed > 0` | ❌ 红（与 doc-numbers 自锁同一根因，给恢复命令） |
| `failed = 0` | ✅ 绿，detail 注明「缓存值，非本轮实测」 |

实测 **guard 从 ~7 分钟降到 9.7 秒**。

### 3. 定向测试成为默认验证集

| 层次 | 命令 | 覆盖 |
|---|---|---|
| 单文件 | `node test/<file>.test.js` | 本轮改动的专属断言 |
| 文档口径 | `node test/doc-numbers-accuracy.test.js` | 维度数/模块数/路由数/changelog |
| 判别回归 | `node scripts/bidirectional-guard.js` | 326 良性 + 52 恶意 |
| 能力守护 | `node scripts/guard-abilities.js` | 入口/样本/主链路/可检索/双向/登记 |

全量（`node test/run-all.js`）= 每日记账，一天 1-2 次。

## 方法论沉淀：定向测试比全量更能发现问题

同一天的实证对比：

- 三轮全量：零产出（被打断 / 被拦 / 被 Killed）
- 一轮定向（2 分钟）：**挖出 10 个文档口径漂移**——模块 158→161、
  路由 1288→1314、维度 92→95、verify 52→54、7 个历史漏写维度、changelog 缺 6.8.1

原因：全量的 105 个已知失败会把新信号**埋掉**；定向跑的目标文件 + 文档守卫
不会。**大规模缺口/噪声里，新问题不可见。**

## 纪律（写进 prompt 与自检）

1. **提交前默认验证集 = 定向 + 双向 + guard + doc-numbers**，不跑全量
2. 要跑全量前，先 `ps aux | grep run-all` 确认无残留（现在是代码强制，不靠自觉）
3. 全量一天 ≤2 次，且只在需要刷新记账缓存时跑
4. 任何「提交前必跑 X」的纪律，在测试规模涨 30 倍后要重新评估——
   **纪律写定时的事实（500 测试）不等于现在的事实（18262 测试）**

## 相关

- 单例锁负例测试：`scripts/round-645-singleton-negtest.js`
  （能拦下 / 报对 PID / 杀后能放行 三项全过）
- `guard-abilities.js` 的 `checkTests()` 注释里有完整事故复盘
- 清理记录：负例测试第一版泄漏了一个孤儿假 runner（`bash -c 'exec node'`
  的 exec 替换让 node 脱离原 pid），把真正的回归全拦在外面；修法是
  `detached: true` + `kill(-pid)` 杀整个进程组
