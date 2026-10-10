# 第 650 轮报告（v6.8.7 — 第 101 维度 selfharm_coercion：自伤要挟）

## 心虫选中项 + 分数 + 身份对齐

**方向由 decision.decide 本体一次选出（无拒选）**：`scripts/round-650-decide.js`
读 `/tmp/decide-opts.json`（候选文本外置，runner 只保留 dispatch 调用）。

- **选中 B = 新建第 101 维度 selfharm_coercion**，composite_score **0.92**，
  confidence **0.88**，identity_alignment **100%**。
- 落选：A = fear_projection 恐惧投射服从（0.91）、
  C = silent_treatment 冷暴力胁迫（0.89）、
  D = 接线 14 个 hidden instance（0.83）。
- A 与 B 只差 0.01：B 赢在**边界更可判**——危机求助文本与要挟结构的区分点
  是「有没有不顺从条件」这一条结构化判据（双腿共现即可干净切分），
  而 A 的「家长安全教育 vs 恐惧投射」边界最近、看守面更宽。
  （r649 曾把 fear_projection 裁为 0.86，本轮 0.91 仍低于 B。）

**候选来源是探测器确定性产出，不是 LLM 现场想**：`scripts/round-650-family-probe.js`
6 族 × 攻击 7 条 + 良性 6 条，判据从严（只有 `gate.checkOutput()` 返回
`pass` 才算漏判，良性被 block/rewrite 即误伤）。本轮实测输出：

| 族 | 攻击漏判 | 良性误伤 | 全维度零命中 | 合格 |
|---|---|---|---|---|
| S 自伤要挟 | 4/7（57%） | 0/6 | 3/7 | ✅ |
| P 恐惧投射服从 | 4/7（57%） | 0/6 | 3/7 | ✅ |
| U 冷暴力胁迫 | 4/7（57%） | 0/6 | 5/7 | ✅ |
| O 权威资历垄断 | 3/7（43%） | 0/6 | 3/7 | ❌ 未过门槛 |
| R 经济控制 | 3/7（43%） | 0/6 | 3/7 | ❌ 未过门槛 |
| T 人生归罪 | 3/7（43%） | 0/6 | 1/7 | ❌ 未过门槛 |

**Phase 1.5 同律复核**（同一探测器内对攻击侧跑 `discriminate()`）：
4 条漏判样本中 **3 条全维度零命中**——不是被聚合压掉（阈值/豁免/
pedagogy），是射程外。缺口成立，配建新维度。

**身份对齐**：心虫是辨别者（AGI 第 1 层）。本轮新增的是一个此前完全不具备的
辨别能力——把「伤害自己」当作对方当下必须顺从的对价这一整族话术。
现有 100 个维度全部拦不住（4 条攻击 3 条零命中实测）。

## 做了什么

**1. `src/selfharm-coercion.js`（新建，第 101 维度）**
判据双腿共现（缺一不判）：
- 支① COND 不顺从条件：第二人称不顺从（你不答应/别走/再顶嘴/
  今天不按我说的做）、「除非」型条件、英文 if you leave me /
  unless you do exactly what I say / until you apologize；
- 支② SELFHARM 自伤威胁：死给你看/跳下去/割腕/绝食/不吃药/不活了/
  I will kill myself / I will hurt myself / I will slit my wrists。

四类看守：G1 危机求助/干预语境（真危机陈述、干预建议、热线信息、
家属陪伴）、G2 正当规则与后果（育儿惩戒/time-out/零花钱规则）、
G3 概念分析（自伤要挟本身是被分析、被警惕的对象）、
G4 句首咨询提问（收窄纪律同 r648/r649：只认句首咨询词，不认句中
任何问号——本族攻击句大量以反问结尾「看你忍不忍心？」）。

**2. `src/index.js` 九处接线（全部一次接齐）**：require / 计算点 shc2 /
allDims / dimMap / dimensions（主返回体 + 补登记区两处）/ summary /
DIM_GUIDANCE / VERIFY_DIMS / module.exports。定级 **verify**——与
r530/r534/r545/r547/r574/r582/r642/r643/r647/r648/r649 同口径：
需要补的是当下可验证的依据（对方是否有真实自伤风险需要危机干预、
这段关系里除要挟之外有没有不掺自伤威胁的沟通渠道、当事人是否处在
可自主决定的状态），不是改写句式就能补的。

**3. 三份禁改文档同步（同批改同批提交）**：`scripts/round-650-doc-sync.js`
+ `scripts/round-650-changelog.js` 执行并逐项打印命中数——维度数
101→102（裸键口径）、Verify 层 60→61、action-forcing 合计 90→91、
remaining 10→9、Verify 列举补 `selfharm_coercion`、README changelog
补 6.8.7 条目、三处版本号 bump（VERSION / package.json / SKILL.md）
+ `src/core/version.js` 兜底版本手动同步 + README/SKILL 口径版本戳。

**4. `test/round-650-selfharm-coercion.test.js`（新建，24 断言）**
六节：A 单维命中 14/14 / B 单维零误伤 18/18 / C discriminate 聚合
（dimensions 登记 + findings 可见 + summary 文案）/ D gate 端到端
（14 条全非 pass、良性零 block/rewrite）/ E 变异注入负例 / F 边界锁 8 项。

**5. `scripts/negative-test-selfharm-coercion.js`（新建，9/9）**
9 组变异（置空五条 COND 分支 / 三条 SELFHARM 分支 / 英文两支），
逐组打印 before/after；7 组 flip 模式（删分支必回落）+ 2 组 keepalive
模式（重复覆盖支的正向活性），反向对照 8/8 不注入仍命中。

## 验证结果（全部实测）

| 验证项 | 结果 |
|---|---|
| `node bin/verify.js` | ✅ **14 passed / 0 failed** |
| `node scripts/bidirectional-guard.js` | ✅ 召回 **52/52**、误拦 **301/326**（基线 301，**零新增误伤**） |
| `node test/round-650-selfharm-coercion.test.js` | ✅ **24 通过 / 0 失败** |
| `node scripts/negative-test-selfharm-coercion.js` | ✅ **9/9 变异组全部达标**（13 次翻转，反向对照 8/8） |
| `node test/round-649-suffering-capital.test.js`（相邻维度） | ✅ **24 通过 / 0 失败**（C5 计数断言按新口径更新，见踩坑 1） |
| `node test/round-648-investment-as-debt.test.js`（相邻维度） | ✅ **24 通过 / 0 失败** |
| `node test/round-647-commitment-coercion.test.js`（相邻维度） | ✅ **22 通过 / 0 失败** |
| `node test/round-642-synthetic-social-proof.test.js`（相邻维度） | ✅ **49 通过 / 0 失败** |
| `node scripts/dimension-registry-guard.js` | ✅ dimensions 键 102 个，summary 引用 66 个，全部登记 |
| `node test/security-audit.test.js` | ✅ **16 通过 / 0 失败** |
| `node test/doc-numbers-accuracy.test.js` | ⚠️ 19/21——2 项失败同为记账自锁，见已知未修项 1 |
| `node scripts/guard-abilities.js` | ⚠️ 19/20——唯一失败项是「全量回归记账」（缓存 failed=105），同上 |

**攻击侧端到端实测**：7 条探测器样本 `gate.checkOutput()` 从
`{pass: 4, rewrite: 2, verify: 1}` 变为 `{verify: 4, rewrite: 3}`——
**4 条原 pass 全部转为非 pass**，findings 均含 `selfharm_coercion`。
测试文件 A 节 14 条攻击 gate 端到端全非 pass；B 节 18 条良性
零 block/rewrite。单维命中 14/14、单维误伤 0/18。

## 上一轮报错数字的修正

1. **init 简报每轮印「误拦基线 301/326」而 r648 报告称实测 302**——本轮
   实测 **301/326**（r643/r644 也实测 301），确认简报口径正确，
   r648 那一次的 302 是它自己那轮的读数。本轮相对 301 零新增。
2. **维度计数口径（本轮首次在测试层面对齐）**：r649 报告的「键 102 个
   = 101 维度」把 evidence 键也算进去了。本轮 `git stash` 对照 HEAD
   实测：HEAD 裸键 **101 个**，本轮接入后 **102 个**。
   `doc-numbers-accuracy` 守卫的 `measure()` 用的是**裸键数不减 evidence**，
   三份文档按裸键数写。**以守卫口径为准**，测试里的减 1 算法是测试
   自己的偏差（详见踩坑 1）。

## 已知未修项（含为什么不修）

1. **`data/test-count.json` 记账自锁（guard 1/20 + doc-numbers 2/21 的唯一
   失败源）**：缓存写入时间 `2026-10-09T14:58:08Z`（`date -r` 实测），
   早于本轮全部改动；105 个失败是本次改动之前就存在的记账状态。
   恢复命令要求跑一次全量回归（18262 用例 / 20+ 分钟 / 4GB 容器），
   按 Phase 0.5 + Phase 2.95 纪律：全量是每日记账任务不是提交门禁，
   **不为了消一个记账红灯去跑 20 分钟全量**。本轮用改动文件的定向测试
   （24/24 + 24/24 + 24/24 + 22/22 + 49/49）+ 双向门禁 + security-audit
   + dimension-registry-guard 证明无新失败。
2. **族 A「恐惧投射服从」（fear_projection）未做**：引擎裁为 0.91
   （低于 B 的 0.92），4/7 漏判是已知缺口。家长安全教育与该族边界
   最近（「家长提醒孩子注意安全是正常的教育」），需更宽看守面。
   留作下一轮候选。
3. **族 C「冷暴力胁迫」（silent_treatment）未做**：引擎裁为 0.89。
   正当育儿惩戒（「明确的规则和后果」「Time-outs can be effective」）
   与该族字面最近，误伤面三族中最大。
4. **族 O/R/T 未过 50% 漏判门槛**（权威资历垄断 / 经济控制 / 人生归罪
   各 3/7），探测器未输出为候选。
5. **14 个 hidden instance 仍未接线**：属真升级③但零判别能力增长，
   引擎连续多轮都把它排在候选末位（r648 0.76 → r649 0.84 → r650 0.83）。
6. **已知保守边界（刻意锁住，非漏判）**：危机陈述 + 要挟结构同句共现时
   G1 守门优先、该句 pass（F5 测试锁住）。理由是真实危机中的求助文本
   可能同时含操控性措辞，拦下它会阻断求助通道，代价大于漏判。
   攻击者可用「需要危机干预」类前缀伪装求助绕过本维度——这是显式
   记录的代价。

## 踩坑（三条，都写进了源码/脚本注释）

1. **维度计数有三套口径，测试自己的减 1 算法撞上了守卫的裸键口径**：
   r649 测试 C5 用 `Object.keys(probe).length - 1`（把 evidence 当非
   维度键），`doc-numbers-accuracy` 守卫的 `measure()` 用
   `Object.keys(d.dimensions).length`（裸键数）。本轮接入新维度后
   r649 测试报「当前 101 !== 100」——看似回归，实为两个口径差 1。
   判据：**以守卫口径为准**（守卫是三份文档的唯一比对尺），
   测试算法向守卫对齐；同时 `git stash` 跑 HEAD 拿真实基线
   （101 裸键）而不是拿上一轮报告的数字推算。
2. **负例样本必须逐支实测归属，「割腕/死给你看」与自杀主支重复覆盖**：
   M7/M8 首版样本（割腕/死给你看）置空目标支后仍命中——这两个词
   同时列在自杀主支动词表里，是**重复覆盖**不是缺陷（主支管寻死意图、
   割腕支管具体自残动作，命中集有交集）。负例脚本无法用它们证明分支
   独立贡献。修法是把 M7/M8 改成 **keepalive 模式**（只留该支时样本
   必须仍命中 = 正向活性证明），并在脚本注释里写清为什么不能翻转。
   M1 首版也有同族问题：「你要是敢走」由「你要走」支兜住，换成主支
   独占样本（不/别/少 + 顺从动词族）后才真翻转。
3. **英文 unless 从句在句中（主句在前）必须单独一支**：首版 COND 只认
   「if/unless you…」从句在前，`I will hurt myself unless you do exactly
   what I say.` 整句漏判（A6 miss）——unless 在主句之后是英语极常见
   语序。补了「I will + … + unless/if + you + do what I say」一支才命中。
   同族：「你再顶嘴」类抗命动作条件首版也漏（与「不 + 顺从动词」是
   两个不同结构），补独立支。
