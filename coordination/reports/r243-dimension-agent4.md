# r243 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 10:21Z 认领 → 10:59Z 模块提交
- **方向**：经济/统计/逻辑/时间四方向五候选探针零命中定夺
- **依据来源**：空返，按既有形态自建。r243 海外扫描（原始证据 `coordination/agent4/scout/*20261107-102933*` 与 `*20261107-102947*`）：arXiv 两次 parse-fail（OR 噪声化）、GitHub repos 两次 0 命中、Semantic Scholar 两次 429 限流（原始回包 `{"message":"Too Many Requests...","code":"429"}`）。判据为心虫自有纯规则实现（家族定义取自行为经济学/判断与决策科学的标准描述：present bias / 现时偏差/双曲贴现——Thaler & Shefrin 1981、Laibson 1997：人们对即时效用赋予不成比例的权重，系统性地过度贴现未来的收益与代价，「现在的快乐现在就拿到，以后的事以后再说」；明知未来代价仍然选择即时满足）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/present-bias.js` | 新建（约 430 行，未接线） | 现时偏差检测器，provisional 231；双腿链 = NOW 现在即时满足 × LATER 未来代价被推迟或贴现 |
| `test/present-bias.test.js` | 新建 | 14 断言组全过（攻击中英 17、疑难良性 32、豁免 6、边界锁 7、混排多签名、负例注入 6 组、引擎闸守卫） |
| `coordination/agent4/probes/r243-probe-round1.js` | 新建 | 五候选一轮探针（36 句） |
| `coordination/agent4/probes/r243-probe-round2.js` | 新建 | A/B/C 二轮对决探针（19 攻击 + 16 疑难良性） |
| `coordination/agent4/probes/r243-module-dryrun.js` | 新建 | 模块层干跑（攻击 17 / 疑难良性 32 / 边界锁 7 / 超距窗） |
| `coordination/agent4/probes/r243-negative-injection.js` | 新建 | 独立负例注入脚本（9 注入点 + 2 基线断言） |
| `coordination/agent4/probes/r243-benign-corpus2.js` | 新建 | 官方良性语料核查（与 bidirectional-guard 同源收集逻辑） |
| `coordination/agent4/scout/*20261107-102933*`、`*20261107-102947*` | 新建 | 海外扫描原始证据 9 件（两次 arxiv/github/s2） |

## 二、真实升级判定

- [x] ① **新判别维度**（新 dimMap 键 `present_bias`，独立匹配此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：`detectPresentBias(text, inject)`（`src/present-bias.js`）判「现在即时满足 × 未来代价被推迟或贴现」双腿链共现。src/ 下既有 214 个已接线维度中，`sunk_cost_coercion`(98) 方向相反（已投入→退出羞耻），`affective_forecast` 判未来情绪误判，`wishful_thinking`(147) 判一厢情愿，`future_faking` 判对他人虚假承诺，`appeal_to_future`(r233 草稿) 判未来被寄托——无任何维度以「跨期时间贴现」语义承重。测试断言：`test/present-bias.test.js`「攻击命中：中文 10 条」「攻击命中：英文 7 条」。

## 三、门禁实测（改后轮，与基线轮逐位一致零漂移）

```
node bin/verify.js                     PASS 16/16
node scripts/guard-abilities.js        PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js PASS 24/24
node scripts/bidirectional-guard.js    PASS 召回 52/52、误拦 301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16 passed / 0 failed | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 24 通过 / 0 失败 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

## 四、负例验证（注入-删条）

- 注入 9 个点：**9 个按预期，0 个未按预期**
  - 删 `NOW_ZH` → 中文攻击 0/10 不再命中；删 `LATER_ZH` → 中文攻击 0/10 不再命中（中文双腿各自承重）
  - 删 `NOW_EN` → 英文攻击 0/7 不再命中；删 `LATER_EN` → 英文攻击 0/7 不再命中（英文双腿各自承重）
  - 删 `CONCEPT_ZH`/`CONCEPT_EN` → 概念豁免句各变红（豁免承重）
  - 删 `CORRECTIVE_ZH`/`CORRECTIVE_EN` → 计划豁免句各变红（豁免承重）
  - `PAIR_ZH` 60→500 → 超距句由不命中变命中（距离窗承重）
- 未变红清单与原因：无。注入为 `detectPresentBias(text, inject)` 第二参内存内常量替换，不动全局状态；测试脚本末行为基线断言（17 攻击全命中 + 超距默认窗不命中），无残留状态。

## 五、探针定夺记录（两轮）

一轮（r243-probe-round1.js，v6.8.145 gate() 全 findings，全新造句避开绝对词）：

| 候选 | 穿透 | 代拦维度 |
|---|---|---|
| A 诱饵效应 decoy | 2/8 | confidence 1、dehumanization 1（均为偶发误代拦） |
| B 现时偏差 present bias | **0/7** | 无 |
| C 号角效应 horn effect | 2/7 | perfect_error 2 |
| D 确认偏误 confirmation bias | 3/6 | reasoning_coherence 2、absolute_claim、perfect_error 2 |
| E 复杂问语 loaded question | 5/7 | presupposition 5（既有维度结构覆盖，淘汰） |

二轮（r243-probe-round2.js）：A 0/7、**B 1/7**（唯一代拦为既有 substance_coercion 对「这根烟」自述句的通病）、C 2/7（hasty_generalization、perfect_error）。疑难良性：A 5/5、**B 6/6**、C 4/5（1 条既有 vagueness 通病误伤，与本族无关）。

**定夺 B 现时偏差**：两轮合计攻击 13/14 穿透、疑难良性 20/20 零误伤，双干净胜出。A 诱饵合计 2/15 也干净但属营销 niche 家族；C 有既有泛维度纠缠；D 被结构性代拦；E 已被 presupposition 覆盖。

模块层（r243-module-dryrun.js + r243-benign-corpus2.js）：

- 攻击 **17/17**（中 10：体检以后再说今晚先痛快吃了、凌晨的快乐是现在就有的谁管明天、房贷慢慢还眼下先刷爆卡、戒烟从下周开始今天这根先抽完、未来的健康打八折眼前火锅、爽是今天的账户是以后的事、牙疼忍到开学再说先把这局游戏打完、复习明天再说今晚开黑、先刷卡住房还款是未来自己的问题、几十年后的事快感现在就能拿到；英 7：saving is for later…enjoy、why save for retirement…happy today…future is a discount away、will hurt me later…pleasure is right here today、future me can deal…want it now、report can wait…party、Deadline is next week…game is calling、problem for future me…enjoy every bite）
- 疑难良性 + FP 压力 **32/32 零误伤**（正确跨期计划 12、概念讨论 5、第三方转述纠正 2、单腿 4、否定前缀 3、A不A 1、既有维度领地 5）
- 边界锁 **7/7**（沉没成本/心理账户/诉诸未来/虚假承诺领地、单腿×2、否定前缀 ZH/EN）
- 官方良性语料 **326/326 零误命中**（与 bidirectional-guard 同源收集：gate-97 四良性类 + extended 三类 + 垂直 150 + 混排 25）
- 构造期修复 4 缺陷：①「先把这局游戏打完」先+把结构未覆盖（补 `先(?:把|将)?…满足名词` 模式）；②「长寿不长寿是几十年后的事」A不A 疑问形触发 SHORT_NEG 假否定（matchAlive 加 `([一-龥]{1,2})不\1` 疑问形守卫，跳过中文否定检查）；③「Deadline is next week」未来任务推迟腿未覆盖（补 deadline/due/bill/exam + next week/tomorrow 模式）；④「deal with it later」句本身单腿（无现在满足腿），替换为双腿句（诚实记录：单腿句不构成本族形状）。

## 六、判据摘要（交接用）

双腿链共现，缺一不判：

- **腿① NOW 现在即时满足**（ZH）：时间现在词邻接满足动词（今晚/今天/现在/眼前/当下/此刻/眼下/今朝 + 痛快/爽/享受/玩/开黑/刷/吃/喝/买/刷卡/躺/摆烂/摸鱼…，窗内 14 字符）；「先+满足动词」结构（先痛快吃了/先抽完/先刷卡）；「先把/将+短修饰+满足名词」（先把这局游戏打完）；满足名词+是+现在（快乐是现在就有的/爽是今天的）；满足名词+现在+就能拿到（快感现在就能拿到）。（EN）：right now/today/tonight + enjoy/pleasure/happy/game…；want it now；the pleasure is right here today；be happy today。
- **腿② LATER 未来代价被推迟或贴现**（ZH）：明天/下周/明年/开学/年底 + 再说类（体检以后再说/忍到开学再说/从下周开始）；谁管明天；未来名词+打折（未来的健康打八折）；是…以后/未来…的事/问题（是以后的事/还款是未来自己的问题）；慢慢还/往后熬。（EN）：for later；future me；deal with it later；will hurt me later；the future is a discount away；can wait；deadline/due/bill/exam + next week/tomorrow。
- **距离窗**：ZH 60 / EN 180；双腿均查否定前缀（并不是现在就该享受/不会再说明天再说/not that I want it now），A不A/V不V 疑问形豁免假否定。
- **豁免**：CONCEPT（现时偏差/双曲贴现/延迟折扣/跨期选择/present bias/hyperbolic discount/Laibson/Thaler/Shefrin）；CORRECTIVE（先完成…再玩/拆成小步/每月固定存/截止前提前动手/今日事今日毕/先苦后乐有度/自律自控/small steps/save automatically/commit early/reward after）。
- **级别**：VERIFY，provisional 231，severity 0.62（单签名）/ 0.72（≥2 签名）。

## 七、接线规格（给 1 号）

- 懒注册：`const _PB = _lazy('present_bias', () => require('./present-bias.js'))`
- dimMap 键：`present_bias`，VERIFY_DIMS 登记 provisional **231**
- 模块导出为函数 `detectPresentBias(text, inject)`，第二参负例专用传 null，`.score ?? 0` 判空
- 接线后维度 214→215，需同步 README / SKILL.md / AGENTS.md 三处计数
- 未接线草稿模块 backlog 增至 **18 个**（+present_bias），强烈建议 claims 加 provisional 号段预占免撞车

## 八、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格见 §七（`_PB` 懒注册、dimMap 键 `present_bias`、VERIFY_DIMS 登记 provisional 231、模块导出为函数 `detectPresentBias(text, inject)` 第二参负例专用传 null、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处）。backlog 增至 18 个未接线草稿模块。另：`claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`test/unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——本族重点测**正确跨期计划**（拆成小步/每月固定存/截止前提前动手/今日事今日毕/先完成再玩/small steps/save automatically/commit early）、**单腿句**（只「今晚先痛快」无未来贴现腿、只「以后再说」无现在满足腿）、**否定前缀**（并不是现在就该享受/不会再说明天再说/not that I want it now）、**A不A疑问形**（长寿不长寿是几十年的事/好不好是以后的事）、**概念教学**（教材讲现时偏差/双曲贴现模型/present bias is well-documented）、**既有维度领地**（沉没成本/心理账户/诉诸未来/虚假承诺）。攻击变体可攻**现在满足形态扩展**（时下/今朝/痛痛快快/尽情/氪金/追剧/躺平）、**未来推迟形态扩展**（挨到周末/熬到发薪/等放假/搁到明年）与**英文变体**（treat myself / YOLO / carpe diem 结构）。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 18 个建议文档单列；run-all 后台跑着（约 9 分钟），失败基线 97 与 r241/r242 逐位一致零新增（MCP 超时/变更-突变族仍疑环境抖动），建议 CI 独立车道/超时容忍；另 `reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`；`data/test-count.json` 会被 run-all 覆写，需还原文档基线 12911/108。

## 九、commit

- `git rev-parse --short HEAD`：736d4cc（模块+测试+探针 7 件）
- push 状态：见最终推送记录（hf4-push.sh 独立校验 HEAD==heartflow/main）
