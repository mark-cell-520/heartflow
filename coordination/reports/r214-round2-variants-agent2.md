# r214 红队复测报告（agent-2 第二轮）

> 基线：**r214（2ffe000）**，VERSION 6.8.142，维度 collider_bias（209）/ mediator_confusion（210）
> 前置报告：`r213-variants-agent2.md`（已推送，536b189）
> 本轮性质：**r214 修复验证 + 第一轮仍开启项深化 + 修复补丁注入实证**（只读探针，未碰 src/）

## §0 基线

四门禁在当前 main（r214）复测，全部通过，与 1 号基线一致：

| 门禁 | 期望 | 实测 |
|---|---|---|
| bin/verify.js | 16 passed / 0 failed | 16 / 0 ✅ |
| scripts/guard-abilities.js | 20/20，210 键 | 20/20（210 键）✅ |
| test/doc-numbers-accuracy.test.js | 24/24 | 24/24 ✅ |
| scripts/bidirectional-guard.js | 召回 52/52、误拦 302/326 | 召回 52/52、误拦 302/326（92.6%）✅ |

口径说明：本轮注入实证的良性安全面用 test/ 下三个 benchmark 的良性类子集（224 条：ZH 197 + EN 27），与双向门禁 326 条完整口径不同源但同库；结论以模块层新增命中计，非门禁层误拦。

## §1 方法与样本

- 38 条新样本：R 组 12 条（专打 r214 新代码：RHETORICAL/NULL 双向配对/新 EN 腿）、F 组 16 条（深化第一轮仍开启项）、G 组 9 条（良性回归）+ A4 复测
- 判定口径与第一轮一致：目标维度声称覆盖的攻击族，变体必须 `action != pass` 且 trace 中该维度直接承重
- 补丁实证方式：`checkMediatorConfusion(text, inject)` / `checkColliderBias(text, inject)` 的 `inject` 参数覆盖常量表（findNullLeg 读 `R.NULL_ZH || NULL_ZH`，NULL 腿可注入），在**不改引擎**的前提下验证报告 §5 建议补丁

## §2 r214 修复验证（生效项）

| 样本 | 攻击形 | r213 基线 | r214 实测 | 判定 |
|---|---|---|---|---|
| R7 | NULL 前置+远距（疼痛与骨折从此再无任何关系，只要控制了止痛药…） | 漏 | verify 0.76，mediator_confusion 承重 | ✅ 双向配对修复生效 |
| R9 | EN never causal 形 | 漏 | verify 0.76，mediator_confusion 承重 | ✅ 新 EN 腿生效 |
| R10 | r214 新腿正对照（烟消云散） | 漏 | verify 0.76，mediator_confusion 承重 | ✅ |
| R11 | D4 加大间隔变体（association between…completely disappears） | — | verify 0.76，mediator_confusion 承重 | ✅ 但由 r213 explain-away 腿抓住（见 §3.3 根因） |
| R2 | 「难道…吗？」+结论分离长句 | 漏 | verify 0.62，mediator_confusion 承重 | ✅ RHETORICAL_ZH 部分生效 |
| R4 | 句号结尾伪装疑问（这不是明摆着的吗。） | 漏 | verify 0.76，mediator_confusion 承重 | ✅ |
| F8/F9/F10 | 否定对冲换词（不足以证明/推不出/不能证明） | A7 形漏 | verify 1，reasoning_coherence 承重 | ✅ 同族变体已被兜住（A7 仅剩「不能说明」特定词形，降级为低危） |
| F13/F14 | 因果词扫描（拖垮/拉低） | — | verify 0.76，collider_bias 承重 | ✅ 已在 CAUSAL_ZH |

## §3 仍开启漏判（附补丁实证）

### 3.1 统计族豁免洗白（P0，第一轮 P0-1 升级）

**第一轮修复建议（换词不换逻辑）经本轮实测不成立。** 修正后数据：

| 样本 | base（现码） | 收紧词表后 | 删表后 |
|---|---|---|---|
| A4（只统计了） | false | **true** | true |
| F1（从统计学看，） | false | false | **true** |
| F2（用统计方法分析，） | false | false | **true** |
| F3（统计分析显示，） | false | false | **true** |
| F4（统计表明，） | false | false | **true** |
| F5（统计显示，） | false | false | **true** |
| F6（统计推断告诉我们，） | false | false | **true** |
| F7（数据统计发现，） | false | false | **true** |

根因：`EXEMPT_META_ZH` 同时含 `统计学` 和裸 `统计`，裸词以子串匹配洗白全部统计族前缀。第一轮建议的收紧词表（统计学/统计方法/统计分析/统计表明/统计显示/统计推断/统计检验/数据统计）对 A4 有效，但**对 F1-F7 无效——词表本身就包含攻击者当前缀用的那些正当词**。

**修订建议（照搬 mediator r213-evolved 模式）**：统计族词仅在 frame 标记（教材/论文/悖论/称为/概念/理论上）或 neg 标记（不能/未必/不代表/不意味着/不足以）同时出现时才豁免，否则进入判据。

安全性（V1b）：G1/G2/G5/G6 四条正当统计句在**删表后** collider 模块层仍 0 命中——收紧不会制造新的维度层误伤。

end-to-end 备注：F4/F6/F7 虽 collider 层漏，但分别被 unsupported_claim（统计表明）/hypostatization/vagueness（据统计）代拦至 verify；F1/F2/F3/F5 完全 pass。

### 3.2 collider 疑问豁免未同步（P0，第二轮坐实）

r214 只给 mediator-confusion.js 加了 RHETORICAL_ZH/EN，collider-bias.js 的 `if (/[?？]/.test(text)) return {hit:false}` 一刀切仍在：

| 样本 | 原文 | 期望 | 实测 |
|---|---|---|---|
| R5 | 在留下来的员工里，加班少的反而绩效更高，这岂不是说明高配合度会削弱队伍存活率吗？ | mediator_confusion 或 collider_bias 承重 | **pass，无命中** |
| R6 | 同 R5，「又何尝不…呢？」 | 同上 | **pass，无命中** |
| R12 | Once you control for income, doesn't education have no effect on health? | collider_bias 承重 | **pass，无命中** |

建议：collider 复用 mediator 的 RHETORICAL 检测（反问标记命中则过判据，真疑问仍豁免）。

### 3.3 NULL_EN 名词-动词相邻缺口（P1，根因坐实+补丁验证）

r214 新腿为 `/\b(?:effect|association|relationship|correlation|link|impact|influence)\s+(?:vanishes|disappears|...)/i`——名词与动词必须相邻。D4 与 R11 的对比证明缺口精确形状：

- D4 `The effect of exercise on health disappears once you account for sleep.` → **base false**（"effect of" 不相邻；r213 explain-away 腿要求 between...and，"effect of...on" 不匹配）
- R11 `The association between exercise and health completely disappears once you control for sleep.` → base true，但由 **r213 explain-away 腿**（`association between X and Y`）抓住，非 r214 新腿

补丁实证（注入验证，EN 良性 27 条 0 新增误伤）：

```js
NULL_EN_PATCH = [
  /\b(?:effect|association|relationship|correlation|link|impact|influence)\b[^.]{0,40}?\b(?:disappears?|vanishes|fades|evaporates?|dissipates?|collapses?|is\s+gone|goes\s+away)\b/i,
  /\b(?:never|no\s+longer)\s+(?:causal|a\s+cause|predictive)\b/i,
];
// D4: base false → patched true ✓
```

### 3.4 NULL_ZH 缺词（P1，补丁验证）

现码 NULL_ZH 无「化为乌有/互不相关/再也观测不到」族，且漏「消失了」（第一轮已报）。

补丁实证（注入验证，ZH 良性 197 条 0 新增误伤）：

```js
NULL_ZH_PATCH = [/消失/, /不见了/, /化为乌有/, /不见踪影/, /互不相关/, /再也观测不到/, /再也看不到/];
// C5（关系就消失了）/F16（互不相关）/R8（化为乌有）/C6（互不相关）/C7（再也观测不到）：base false → patched true，5/5 全覆盖 ✓
```

### 3.5 CAUSAL_ZH 口语同义词缺口（P2）

F11（损耗）/F12（危及）pass；F13（拖垮）/F14（拉低）已被 collider_bias 抓住。建议 CAUSAL_ZH 补：损耗/危及/毁掉/断送/透支。

### 3.6 COND_EN「of the … still on the books」形（P2，第一轮遗留）

F15 `Of the clients still on the books, the ones with fewer complaints renewed at higher rates, which means...` → pass。COND_EN 建议补 `of the \w+ (?:still )?(?:on the books|remaining|left)` 形。

### 3.7 疑问豁免边界（观察项，建议不修）

R1（真的没有影响吗？）/R3（..., right?）为**真·无标记疑问**，与良性提问不可区分，维持豁免是正确设计权衡。仅记录，不建议修。

## §4 误拦（新增 2 项 + 复现 1 家族）

| 样本 | 原文 | 实测 | 归因 |
|---|---|---|---|
| G2 | 统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高 | verify 1，reasoning_coherence×1 | 正当统计讨论句，「统计表明+否定结论」形被跳跃推理误判。**不在 collider 层**（删表后仍 0 命中） |
| G3 | 控制年龄之后比较各组，运动仍然与更低的事件率相关 | verify 0.94，presupposition×1（仍然与更低的事件率相关）+ moral_foundations×1（控制） | 方法比较句。第一轮 E1 近亲句（控制年龄后运动降事件率）为 pass——presupposition 腿对「仍然…相关」形误伤。**与 r214 双向配对无关**（非 mediator_confusion 承重，本轮证伪该怀疑） |
| G7/G8 | 控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应（ZH） | rewrite，post_hoc×1（route1 时序连接）+ pseudo_causal | 第一轮 E5 家族复现。G9（EN 同形）pass——中英不对称 |

第一轮 E5（post-hoc.js 腿①）修复仍开启，本轮复现确认。

## §5 给 1 号的修复清单（按优先级）

1. **P0 统计族豁免加条件**（§3.1）：`EXEMPT_META_ZH` 删除裸 `统计`；统计族词改 frame/neg 双条件豁免。证据：F1-F7 删表后 5/7 恢复（F1/F2/F3/F5 end-to-end pass）+ V1b 良性 0 误伤
2. **P0 collider 疑问豁免同步**（§3.2）：复用 mediator RHETORICAL。证据：R5/R6/R12 三条 pass
3. **P1 NULL_EN 宽松腿**（§3.3）：直接用 §3.3 注入验证过的正则。证据：D4 恢复 + EN 良性 0 误伤
4. **P1 NULL_ZH 补词**（§3.4）：直接用 §3.4 注入验证过的正则（含「消失了」）。证据：5/5 恢复 + ZH 良性 0 误伤
5. **P2 CAUSAL_ZH / COND_EN 补形**（§3.5/§3.6）
6. **误拦侧**（§4）：G2 建议 reasoning_coherence 对「统计表明/显示+否定结论（不能/不足以/无法据此）」形加白；G3 建议 presupposition 腿排除「仍然…相关」方法比较形；E5 按第一轮清单继续
7. **观察项**（§3.7）：R1/R3 维持现状

## §6 复现

```bash
node coordination/reports/r214-round2-probe-agent2.js   # 归档探针（输出 r214-round2-probe.out.json）
```

探针脚本已归档至 `coordination/reports/r214-round2-probe-agent2.js`（含 38 样本 + V1/V1b/V2/V3 注入实证，只读，不改引擎）。

## §7 本轮数据诚实性声明

- 所有 gate.action / score / trace 来自本轮真实运行（r214 基线，探针输出 JSON 在 agent-2 本地留存）
- V1 节为修正后数据：初版探针脚本曾因 F 数组解构 bug（三元素条目按两元素解构，text 实为类型名字符串）产生 F1-F7 假阴性，已定位修复并全量重跑，本报告数字以重跑终态为准
- 补丁实证全部通过 inject 参数覆盖常量完成，未修改任何引擎文件

—— agent-2（红队/边界测试），r214 复测轮
