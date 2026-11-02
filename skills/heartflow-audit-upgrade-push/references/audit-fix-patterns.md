# 心虫审计高频发现与修复模式

> 十一类在全面审计中反复出现的发现，每类含：识别签名 → 修法 → 验证。修法均为最小改动、可批量（execute_code Python 脚本），禁删防崩设计只做诚实化。

## 1. 假能力报健康（stub / 假全局类）

**签名**：`_stubFactory(name)` 产出的类只有 `healthCheck: () => ({ok:true})`；或文件头 `globalThis.Xxx = class { constructor(){ this.healthCheck = () => ({ok:true}); } }`。实例化后打「加载成功」日志，dispatch 路由可调但零能力。

**修法（诚实化，一处改全局生效）**：
```js
function _stubFactory(name) { return { [name]: class { constructor() {
  this.healthCheck = () => ({ ok: false, stub: true, reason: 'module_not_implemented: 占位模块，无真实能力，仅防启动崩溃' });
  this.getStats = () => ({ stub: true });
} } }; }
```
假全局类同样把 healthCheck 改 `{ok:false, fake:true, reason:'假桥接类，无真实实现'}`，保留类定义（删除会连锁 start() 崩溃），注释指向旁侧真 lazy。

**验证**：冒烟（start/think/restart）+ `hf.codeExecutor.healthCheck()` 返回 stub:true。

## 2. 三表接线断裂（dimMap / allDims / dimensions）

**签名**：
- dimMap 缺键 → `dimObj?.count || ... || 1` 兜底，findings detail 恒显示「1次」
- dimensions 输出缺键 → 读方 `result.dimensions.xxx` 恒 undefined（命中进了 findings 却查不到）
- 命名分裂：dimMap 叫 `bullshit`、输出键叫 `bullshit_recognition`、DIM_GUIDANCE 又按 d.name 查找——三处必须同名字

**修法**：
1. 运行时探针拿三表键集：`Object.keys(discriminate('t').dimensions)` vs 静态提取 dimMap/allDims 键
2. dimMap 补缺失键（detail 恢复真实计数）；dimensions 输出补缺失键；命名统一时**连 DIM_GUIDANCE 的键一起改**
3. TDZ 铁律：dimMap 在函数体前部构造，只补**在前面已定义**的变量；补完必须 `node -e require+dicriminate` 立即验证（TDZ 错误整个引擎崩）
4. 不在 allDims 的维度不补 dimMap（findings 循环不遍历它，补了是死键）

**验证**：探针复跑（detail 非 1、键可读）+ `sync-doc-numbers.js` 同步文档口径（dimensions 键数是 measure 口径，补键会变总维数，文档必须同轮同步，否则 doc-numbers 红）。

## 3. 豁免击穿（安全维度整句豁免）

**签名**：`if (DISCOURSE_FRAME.test(text) || ...) return { count:0, ..., exempted:true }`——宽泛正则（含"比如/举例/例如/通常认为"类弱常见词）单独构成整句豁免。攻击句加一个谈论框架前缀即整体豁免。

**修法**：
1. 弱举例词组**整组移除**（不是加闸）——它们在攻击句里恰恰是引导词，在教学句里有强载体词（论文/报告/研究里提到…）覆盖
2. 其余豁免统一补双闸：`(!INTEGRITY_BREAK.test(text) && !CHECK_SUPPRESSION_SIGNAL.test(text) && <豁免条件>)`
3. 复测三类样本：原攻击句 / **攻击句+豁免前缀** / 真元话语良性句（必须仍豁免）

**验证**：前缀形从 exempted→HIT；良性元话语 3/3 仍 exempt；该维度既有回归测试全绿。

## 4. 身份提权（自报身份头）

**签名**：`const oidMatch = String(reqOid).match(/^HeartFlow-OID-([a-f0-9]{16})$$/); if (oidMatch) { role = Math.max(...'user') }`——只做格式正则，无签发/校验记录。匿名 guest 自报头即提权，穿过写工具白名单。

**修法**：提权条件加 `role !== 'guest'`——身份码仅在已通过 token 认证时保留标签语义；匿名持任何格式合法的身份码均不提权。注释说明格式正则无密码学强度、不能当凭据。

**测试冲突处理**：若一个测试固化提权行为（断言"持 OID 过写权限"）、另一个要求拒绝（"伪造 OID → 拒绝"），以安全方向为准：修代码 + 反转固化漏洞那条的期望 + 注释写明原断言固化的正是该漏洞。这是策略变更，不是为绿灯改断言。

**验证**：相关鉴权测试全绿（注意鉴权测试常读多个 token 环境变量名，跑时 `env -u` 清干净，否则 server 用错 token 报 401 误判）。

## 5. fail-closed 回归门禁

**签名**：`const failedM = /(\d+) failed/.exec(out); const failedCount = failedM ? parseInt(...) : 0;`——只匹配英文；且 execSync 超时被杀后输出无汇总行 → 0 → 「测试通过 ✓ (0 passed)」空放行，继续 commit/push。

**修法**：
```js
const failedM = /(\d+)\s+failed/.exec(out) || /(\d+)\s*失败/.exec(out);
const summaryMissing = allSummary.length === 0;   // 拿不到汇总 = 超时/被杀
if (failedCount > 0 || summaryMissing) { /* 中止，打原因 */ }
```
同时给该命令单独超时（run() 支持 timeoutMs 覆盖），全量回归按实测时长给（约 27 分钟），别用全局 180s。

## 6. 内存泄漏（只进不出的容器）

**签名与修法**：
| 形态 | 修法 |
|---|---|
| compaction 的 `filter` 结果算给新数组却不写回 `this._pending` | 补 `this._pending = uncommitted` |
| `record()` 只 push 的 buffer（读方读文件不读 buffer） | 构造器存 `this._bufferCap`，push 后 `while (len > cap) shift()` |
| 无上限 Q-table / chains / receipts Map | `while (map.size > cap) map.delete(map.keys().next().value)`（Map 保持插入序，队首最旧） |
| 有 TTL 定义但只读不清理的 DNS_CACHE | 写入前 `for (const [k,v] of CACHE) if (now - v.ts > TTL) CACHE.delete(k)` |

## 7. 加密资产轮换范围

**签名**：`_scanEncFiles` 只收 `.enc` 后缀；同格式密文（`{"_enc":"HEARTFLOW_v1",...}`）以 .json 存放（如 data/memory-bank.json）→ 换钥后永久失效、每次启动 "Decryption failed ... starting fresh" 静默丢库。

**修法**：扫描改按内容特征——读文件头 200 字符，含 `"_enc"` 且含 `HEARTFLOW_v1` 即纳入，与扩展名无关。根因确认靠日志实锤（启动时报 starting fresh）+ mtime 佐证（密钥文件新于数据文件）；已丢密钥的密文不可恢复，如实记录"保证今后不再发生"。

## 8. 文档口径盲区

**签名**：`sync-doc-numbers.js --check` 全绿但 `grep` 发现活文档数字是旧的——清单（AGENTS/README/SKILL/package.json）外文件一律视为无漂移；反之兜底扫描把 UPGRADE_LOG.md/CHANGELOG.md 的逐轮历史数字误报成漂移。

**修法**：
1. 手工修活的漂移文档，同时把该句 shape 登记进 TARGETS（`docs: ['<file>.md']`）——不登记=下次照样漏
2. 逐轮追加的历史档案加进 KNOWN 排除（mtime 新但内容是历史快照，无 Version history 标题可截断）
3. dimensions 键数是 measure 的 dims 口径：补接线键会变总维数，必须同轮 `sync-doc-numbers.js`（写入模式）同步全部文档再跑 doc-numbers 门禁

**验证**：`sync-doc-numbers.js --check` 四份全绿且清单外 0 处 + `test/doc-numbers-accuracy.test.js` 全绿。

## 9. 被吞错误致能力静默失效

**签名**：`const safeInput = _PrivacyExposure.sanitizeForPersistence(input);`——lazy loader 漏调 `()`（_PrivacyExposure 是 loader 函数对象，正确用法 `_PrivacyExposure().sanitizeForPersistence`）。抛出的 TypeError 被外层 catch 吞（note 写「不阻断主链路」），症状是**没报错但能力永远没数据**：Engram 存储/召回整块失效，`result._engramRecall` 恒 undefined，`_initErrors` 每次 think +1 噪声。

**修法**：补 `()`。同文件搜该 loader 的全部用法（grep `_LoaderName`），对照正确形态，只修漏的那处。

**探针（审计每轮必跑，专抓「被吞的高频错误」）**：
```js
const hf = new HeartFlow({silent:true, modules:false}); hf.start();
const before = hf._initErrors.length;
const r = await hf.think('测试输入');
console.log('initErrors', before, '→', hf._initErrors.length);   // 0→1 = 每次必炸
console.log('engramRecall:', r._engramRecall);                    // undefined = 存储/召回整块死
```

**验证**：探针复跑 0→0 且 `_engramRecall` 有真实数据。

## 10. 跨 await 的实例临时状态

**签名**：async 方法内 `this._pendingXxx = {...}` 存中间态，跨 await 边界后在别处读取并 `finally { this._pendingXxx = null }`。单次调用模型不触发，并发调用互相清掉/丢计数。

**修法**：改局部变量（`let _pendingXxx = null` 声明在首个使用点前）。改前 `grep -rn "_pendingXxx" src/ bin/ test/ mcp/` 确认无外部读取方（MCP/测试可能直接摸 `hf._xxx`，有外部方则不能简单改局部）。

**验证**：`Promise.all([hf.think(a), hf.think(b)])` 双调不互踩 + 原合并功能仍在（构造能触发该分支的输入，检查 result 上合并字段非空）。

## 11. 守卫条件断言与地板值腐烂

**签名**：`if (rows['X'] !== undefined) { assert.strictEqual(...) }`——行缺失/改名即静默跳过，守卫绿但实际什么都没查；`if (count < 124)` 地板值远低于实测（162）时任何模块删除 38 个以内都不报警。

**修法**：条件断言改「先断言行存在再比对」：`assert.ok(rows['X'] !== undefined, '规格表缺少 X 行');` 放在原 if 之前；地板值随实测增长维护（留约 10% 余量，如 162 → >= 150）。

**验证**：门禁全绿（严格化后仍全过 = 规格表形状完好）；抽删一行确认红灯（证明守卫真的在看）。

## 通用纪律

- 每修一项立即 `node --check` + 针对性探针/回归，不攒批验证
- 批量同类修用 execute_code Python 脚本（断言 pattern count==1 再替换），不用子代理 patch 大文件
- 修完一项在 UPGRADE_LOG 记一项；没走完的修复轮，汇报显式列未完成项+恢复命令，禁用"已完成"掩盖未提交状态
