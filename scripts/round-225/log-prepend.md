
# 第 225 轮（v6.7.128 工作面，unattended 自主升级）

**方向**：`checkContradiction` 英文侧**反义评价对并置**漏判 —— 新增
`CONTRADICTION_PAIRS` 第 19 条（decision 引擎真调裁决 B1，composite 0.80）。

**为什么选它（照纪律先复测，不信简报旧描述）**：

1. 队列待办为空（仅 1 条已 done），落到「上一轮遗留的真缺口」+ 心虫自选。
2. **第一个 decision 调用返回 `chosen: null` + `confidence: 0`**
   （`scripts/round-225/decide-r225.js`，四候选全部 0.74 分不出高下）——
   照纪律补判据（缺口规模 / 改动代价 / 修复确定性）后重跑
   `decide-r225-v2.js`，B1 以 0.80 胜出（A 0.74 / C 0.74 / D 0.74）。
3. 横向扫描坐实缺口是**族不是点**（`probe-r225-branch-scan.js`）：
   `src/` 共 **165 个** `hasChinese` 门控点，其中 4 个 early-return、
   89 个 `hasChinese ? zh : en` 三元、6 个 `if/else` 二分支 ——
   224 轮修的只是 confidence 一个维度的 if/else 形态。
4. 转测 gate 层端到端（`probe-r225-mixed-gap.js`）：19 条混排样本
   **只命中 6 条**，同批纯英文对照也只 9/19 —— 中英两侧都有缺口。
5. 精准定位到 contradiction（`probe-r225-contra-families.js`）：
   英文矛盾族 22 条样本**命中 0/22**。读码确认原因：现有 18 条 pair 的
   positive 全部要求 ① 绝对化词 + but/however 转折，或 ② 立场动词 +
   怀疑/否定；而 LLM 最高频的自相矛盾是 `safe ... dangerous` /
   `reliable ... unreliable` / `fast ... slow` 这类**同句反义评价对
   并置**，无绝对化词、用 and / at the same time 连接，全从缝隙漏过。

**变更（3 个 commit）**：

| # | 文件 | 内容 |
|---|---|---|
| 1 | `src/index.js` | `CONTRADICTION_PAIRS` 新增第 19 条（+89 -2）；前置声明 `EN_CONTRADICTION_ANTONYMS`（12 组词对）/ `EN_CONTRADICTION_DESIGN_CONTEXT` / `EN_CONTRADICTION_TRADEOFF` / `EN_CONTRADICTION_CONDITION_SPLIT`；`checkContradiction` 支持数组形态 positive + 三重豁免 |
| 2 | `test/contradiction-antonym-en-r225.test.js` | **40 断言**（正向 12 + 反向 16 + 遗留回归 3 + 样本池自检 4 + 异常输入 5） |
| 3 | `scripts/negative-test-contradiction-antonym-en-r225.js` | **6 源码变异 + 1 测试变异 + 1 对照，7/7 真红、零无效变异** |

**判据形状与边界**：

```
第 19 条 pair（与前 18 条形态完全不同，互不侵占）：
positive = EN_CONTRADICTION_ANTONYMS      # 12 组 [a, b] 词对，非正则
negative = /\b(and|but|yet|while|though|although|whilst|however|
            at the same time|simultaneously|yet still)\b/i
判定 = 任一对两词都在文本里 && 有连接词 && 非三重豁免
```

三重豁免（都是轮初实测出来的，不是拍脑袋）：
① `EN_CONTRADICTION_DESIGN_CONTEXT` —— 全文任意位置出现
   `in the common case` / `under load` / `by default` 等设计性短语
② `EN_CONTRADICTION_TRADEOFF` —— 含 `trade-off` / `workaround` / `by design`
③ `EN_CONTRADICTION_CONDITION_SPLIT` —— **只看两个反义词之间的跨度**，
   出现 `in X mode` / `when X` / `for X` / `afterwards` 等分条件标记

**刻意保守的三条边界**：
① 比较级/最高级不覆盖 —— `\bslow\b` 不吃 slower/fastest，
   「fast in general case, slower under load」是合法分级表述，天然不触发
② 形态差异大的词对不收 —— `cheap/costly`、`affordable/expensive` 不入表
③ 无连接词不判 —— 两个词都在但没有 and/but/yet 串起来，不判矛盾

**零新增误伤的证明方式**（这一轮的方法论核心）：
`probe-r225-orig-baseline.js` 把 `git show HEAD:src/index.js` 写成
`src/__r225_orig_index.js` 再 require（保持相对 require 可用），
同一批样本跑改动前后两版：
- 3 条「看似误伤」的中性样本：**改动前 3/3 已误伤，改动后仍 3/3**
  → 全部来自前 18 条 pair（`never/always/cannot + but` 形状）的**历史基线**，
    与第 19 条无关（`probe-r225-fp-attr.js` 归因到具体 pair 确认）
- 5 条正向样本：**改动前 0/5，改动后 5/5**

**方法论坑（本轮实测踩到）**：

1. **`const` 有 TDZ，常量必须在数组字面量之前声明**。第一版把
   `EN_CONTRADICTION_ANTONYMS` 放在 `CONTRADICTION_PAIRS` 后面 →
   `ReferenceError: Cannot access ... before initialization`，整个模块加载失败。
   修正为前置声明 + 注释说明为什么不能后置。
2. **「豁免」写在两处会重复声明**。第一版先在数组后加常量、又在数组前加
   一份（试图绕 TDZ），`node --check` 直接报
   `Identifier 'EN_CONTRADICTION_ANTONYMS' has already been declared`。
   正确做法只有一份、放前面。
3. **全文任意位置匹配的豁免会吃掉真阳性**。v1 的 DESIGN_CONTEXT 里加了
   `in (theory|practice)`，结果把 `It is deterministic in theory;
   it is random in practice` 这条**标准矛盾样本**也豁免了 → 正向 5 → 4。
   改成「只看两词之间跨度」的 CONDITION_SPLIT 才既保真阳性又挡误伤。
4. **负例守卫的 `crashed` 必须单独计数**。224 轮教训「变异要闭合括号」的
   推广：本轮在守卫里加 `require('child_process').execFileSync('node',
   ['--check', SRC])` 自检 + `crashed` 标记，语法崩不计入真红，
   避免「崩了也算红」的假通过。
5. **负例守卫的退出条件要把测试变异算进去**。第一版
   `redCount === MUTATIONS.length`（6），但实际有 7 个变异（M1..M6 源码 +
   M7 测试样本）→ 全真红也 exit=1。改为 `MUTATIONS.length + 1`。

**七项验证**：

| 项 | 结果 |
|---|---|
| bin/verify | **14/14** |
| 双向门禁（runSet 直跑 11 池） | 误拦 **25/326**、召回 **52/52**，与 224 轮**逐字节一致** |
| run-all | **7670 通过 / 0 失败**（较 224 轮 7630 **+40**，本轮新增断言数；npm-package-integrity 预期 1 个失败未出现，全绿） |
| security-audit | **16/16** |
| doc-numbers | **15/15** |
| 本轮守卫 | **7/7 真红、零无效变异、零异常**（C0 对照全绿） |
| 224 轮回归 | superlative 混排测试 + r224 守卫脚本本轮未改动，基线不变 |

## 遗留（给下一轮）

1. **`bidirectional-guard.js --check` 的执行体仍被杀**（224 轮遗留 1，
   连续两轮未动）：`test/gate-benchmark.js` 的 require 副作用
   `process.exit(1)` 会提前终止宿主脚本，扩展集三池（106+150+25）在
   `--check` 路径下从未被执行。修法是加 `require.main === module` 守卫。
   本轮继续用 `scripts/round-224/r224-guard-run.js` 直调 runSet 绕过。
2. 同族缺口仍在（本轮只修了 contradiction 一个维度）：
   `probe-r225-mixed-gap.js` 显示 19 条混排样本只命中 6 条。
   已定位未做的：`checkAuthority`（authority 混排+纯英均 pass）、
   `checkUnsupportedClaim`、`checkHastyGeneralization`、
   `checkStereotype`、`checkTonePolicing`、`checkNoFallback`、
   `checkEmptyAnswer`、`checkFallacies`（whatabout 纯英 pass）。
3. `badFaithNarrative` 的 `if (!hasChinese) return []`（index.js:7939）——
   注释自称「英文侧留给后续轮次扩样」，是明确的待办。
4. `src/` 23 个零引用模块（19 个 >50 行，最大 `memory/triality-memory.js`
   1670 行、`workflow/task-pipeline.js` 1349 行）——`probe-r225-capability-scan.js`
   的新实测数（比 224 轮简报的「369 个零引用」小一个量级，因为本轮按
   require/from 引用判定而非 grep 文件名，数字更准）。

**给下一轮的接手说明**：先跑
`node test/contradiction-antonym-en-r225.test.js`（应 40/40）与
`node scripts/negative-test-contradiction-antonym-en-r225.js`（应 7/7 真红）。
可续方向：遗留 2 的 authority / unsupported_claim / hasty_generalization
英文侧判据（缺口形状与本周完全同构：`hasChinese ? zh : en` 三分结构），
或遗留 3 的 badFaithNarrative 英文侧 early-return。
