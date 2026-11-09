# r266 CI 口径守门报告（3 号 / agent3）

**日期** 2026-11-09  **操作方** 3 号（CI 口径守门）  **环境** Windows / Node v24.22.0 / 仓库 main（r266，VERSION 6.8.157，232 维）
**边界遵守**：未碰 `src/` 任何文件；未改 `test/run-all.js` 与四个门禁脚本及其断言；未执行任何 git 命令；临时探针均在仓库外（`.../deepseek/.tmp/`）。任务 C 复跑期对 `src/` 做了快照 + 回滚保护（对齐 run-all 兜底），复跑后 r266 四个测试仍 25/30/25/37 全绿，引擎完整。

---

## 任务 A：r266 四个测试的汇总行验证

### A1. run-all.js 计数逻辑（已读全文核对）

- 发现逻辑 `collectTestFiles`（run-all.js:48-62）：递归 `test/`，跳过 `archive/` 目录，只收 `*.test.js`，排除 `run-all.test.js`。
- 选 runner 逻辑 `taskWithBestRunner`（run-all.js:292-312）：`module.exports = function/命名函数/箭头函数` → `_mount.js`；`describe(` 且不 require mini-expect → `-r test/_jest-globals.js`；其余裸 `node <file>`。
- 汇总行识别（run-all.js:120-165）：主正则 `/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/`；fallback 分数式 `/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/` 与 `合计 N/M`；再 fallback `^\s*PASS\b` / `^\s*SKIP\b` 单行（PASS 计 1 通过，SKIP 不计失败）；**都没有 → 计 1 个失败**，error 为「未输出『N 通过, M 失败』结果行」。另：汇总结算 `0 通过, 0 失败` 也计 1 失败（注册 0 用例）。

### A2. 四个文件的形态判定与真实执行

四个文件均为**裸跑形态**（无 `module.exports`、无 `describe(`，自带 `t()` 断言函数 + 文件尾 `console.log` 汇总行），按 run-all 口径走 `node test/<file>`。逐个真实执行结果（exit code 均为 0）：

| 文件 | runner 形态 | 真实汇总行（文件自带打印） | 通过 | 失败 |
|---|---|---|---|---|
| round-266-conjunction-fallacy.test.js | 裸跑 | `round-266-conjunction-fallacy: 25 通过, 0 失败, 共 25 个` | **25** | 0 |
| round-266-illicit-conversion.test.js | 裸跑 | `round-266-illicit-conversion: 30 通过, 0 失败, 共 30 个` | **30** | 0 |
| round-266-reverse-causation.test.js | 裸跑 | `round-266-reverse-causation: 25 通过, 0 失败, 共 25 个` | **25** | 0 |
| round-266-whole-part-transfer.test.js | 裸跑 | `round-266-whole-part-transfer: 37 通过, 0 失败, 共 37 个` | **37** | 0 |

汇总行格式与 run-all 主正则完全匹配（探针用 run-all 同款正则实解析：`{kind:'summary', passed:25/30/25/37, failed:0}`）。

### A3. 与提交信息自报值对照（如实记录差异）

- 任务书 / `coordination/claims.jsonl` r266 条自报 **25/37/25/30 全过**（该 claim 未把数字绑定到具体文件名）。
- 按任务书给出的文件顺序实测为 **25/30/25/37**：**illicit-conversion 与 whole-part-transfer 两个数字对调**（illicit 实为 30、whole-part 实为 37）；总数 117 两者一致。四文件全部 0 失败，"全过"结论不变；建议 1 号在 UPGRADE_LOG r266 条目里按文件名写清数字，避免口径歧义。

### A4. 发现逻辑验证（仓库外探针 `probe-a.js`，镜像 collectTestFiles/taskWithBestRunner/runChild 解析）

- `collectTestFiles` 全量扫到 **687 个** `.test.js`（跳过 `test/archive/` 内 34 个、排除 run-all.test.js）。
- 四个 r266 文件**均在清单内**（`inList: YES`），形态判定均为 `bare`，实跑 argv 为 `node test/round-266-xxx.test.js`，run-all 同款解析全部得到 summary 计数。
- **结论：四个文件可被发现、可被计数，任务 A 通过。**

---

## 任务 B：正则 exec 循环 lint（`scripts/lint-regex-exec-loops.js`）

### B1. 交付物与规则覆盖

新建 `scripts/lint-regex-exec-loops.js`（零依赖，`node scripts/lint-regex-exec-loops.js [dir...]` 直接跑，默认扫 `src/`；退出码 0=0 violations，1=有违规）。三条规则：

| 规则 | 覆盖形态 |
|---|---|
| `exec-loop-non-global` | while/for **条件里**的 `.exec(`：接收端是正则字面量（查 /g 或 /y）、行内 `new RegExp(...)`（查 flags 表达式）、简单标识符（同文件定义解析，取使用行之前最近定义，限深 3 层） |
| `regexp-flags-passthrough`（并入上条的 detail） | `new RegExp(A, B)` 的 B 无法静态证明含 g：字符串字面量 flags 直接判；**裸变量/属性 flags 透传报警**（r266 事故形态 `re.flags + 'i'`）；guarded 形态（`re.flags.includes('g') ? re.flags : re.flags+'g'`、`... + 'g'`、硬编码 `'g'/'gi'`）判过；`new RegExp(pat.source, pat.flags)` 忠实拷贝若 pat 是 for-of 变量且遍历数组内**全部**字面量带 g/y 判过（混带则报） |
| `matchall-non-global` | `.matchAll(` 的**实参**正则非全局（实参形态：字面量 / 行内 new RegExp / 标识符定义解析；matchAll 只认 g，认 g 或 y 不适用） |

保守策略：属性访问（`a.b`）与解析不到的定义不判（缺证不判）；`.exec(` 在循环体（非条件）不查；多行条件（上一行以 `while (`/`for (` 结尾）认。String.raw 形态因按 flags 表达式判定，天然不误伤。

### B2. 试跑过程（含误报细化，全部真实执行）

1. **v1 首跑 src/：11 violations** —— ai-misuse.js×5、completion-evidence.js×4、core/decision.js×2。逐个人工裁决：
   - decision.js×2 是**误报**：定义解析用了「全文第一个定义」，把 383 行的 `new RegExp(..., 'i')` 套到了 542/559 行实际使用 540 行 `/.../g` 字面量 / 553 行 `'g'` 构造的循环上。→ 细化：定义解析改为**按行号取使用行之前最近的定义**，且定义捕获允许跨行（截到首个 `;`）。
   - ai-misuse.js×5 与 completion-evidence.js 的 COMPLETION_CLAIMS/VAGUE_COMPLETION/PUSH_CLAIMS 是**误报**：`new RegExp(pat.source, pat.flags)` 遍历的数组字面量全部带 g。→ 细化：新增 for-of 数组精化（数组内全部字面量带 g/y → 拷贝必全局，判过）。中途还修了一个自身 bug：数组字面量全局正则未锚定起始 `/`，会把 `    /all` 残片当字面量导致 every 失败。
   - completion-evidence.js:98（EMPTY_VERIFY）**不是误报，是真 bug**（见 B3）。
2. **v2 复跑**：
   - `src/`：**1 violation**（completion-evidence.js:98，真 bug）。
   - `test/`：**0 violations**（850 个 .js，含 run-all.js 自身的 /g exec 循环）。
   - `bin/`：**0 violations**。
   - `scripts/`：**1 violation** —— `scripts/round-527-trace.js:21`：`const re = new RegExp(I.HARM_DENY_ZH.source);` 丢 flags 的忠实拷贝变体，同为事故 A 家族（r527 历史探针，未动，报告给 1 号）。
   - 仓库外正向对照 `lint-control.js`（7 个事故形态 A1–A4/B1–B3 + 9 个安全形态 S1–S9）：**7/7 全中、S1–S9 零误报**（硬编码 gi、guarded 透传、guarded 变量中转、字面量带 g、matchAll 全局、String.raw、循环体内单发 exec、属性访问均不报）。
3. **`src/conjunction-fallacy.js` 修复版验证**：`cmpEn` 硬编码 `'gi'`（第 261 行）及其余 guarded 构造（201/307/313 行）**全部通过，零违规**——与任务预期一致。

### B3. lint 抓到的真 bug（未修，src/ 禁触；交 1 号）

**`src/completion-evidence.js:98`（EMPTY_VERIFY 混合 flags 死循环）**：
- 86-93 行 `EMPTY_VERIFY` 数组 6 条模式中，`/确认正常/g`、`/验证通过/g`、`/检查无误/g` 带 g，而 `/checked\s+ok/i`、`/verification\s+passed/i`、`/all\s+good/i` **只有 i**；95-98 行 `const copy = new RegExp(pat.source, pat.flags); while ((m = copy.exec(text)) !== null)` 对非全局 copy 永远返回同一匹配。
- **实证复现**：`checkCompletionEvidence('I checked ok the fix and it is all good')` 挂起 >12s（超时杀）；裸机制探针证实非全局 exec 循环命中即无限（200 万次未退出，195ms），同源 `/gi` 副本 1 次即退。
- 建议修法（1 号执行）：给 3 条 `/i` 模式补 `g`（或统一走 guarded 构造）。这是 r266 conjunction-fallacy 事故在同仓库的**第二例现存实例**，也证明本 lint 非纸上规则。

### B4. CI 接线（`.github/workflows/gates.yml`，新建）

仓库此前**没有 gates.yml**（与 DEPLOY-agent3.md 状态标注一致：四门禁未进 CI）。本次按角色宪法「首要任务」创建，四门禁调用方式逐字采用 DEPLOY-agent3.md 草案（`node bin/verify.js` / `node scripts/guard-abilities.js` / `node test/doc-numbers-accuracy.test.js` / `node scripts/bidirectional-guard.js`，Node 22，ubuntu-24.04 对齐 audit-test.yml），**未改任何门禁断言**。lint 作为**独立 job `lint-regex-exec-loops`** 接入，job 级 `continue-on-error: true`，文件内注释注明「lint 不是门禁断言，红/绿不影响四门禁结论、不阻塞 merge」。这样即使 src/ 现存 1 条真违规（B3），四门禁 job 与 lint job 互不拖垮。
语法自查：无 tab；job/step 缩进一致（2/4/6/8 空格）；与既有 audit-test.yml 同构；continue-on-error 计数符合预期（job 级 1 处 + 注释文本 1 处）。

---

## 任务 C：无汇总行格式债盘点

### C1. 方法与总体分布（仓库外探针 `probe-c-inventory.js` / `probe-c-static.js`，镜像 run-all 发现与判定逻辑）

687 个测试文件（mount 109 / describe-jest 24 / 裸跑 554）。裸跑文件的静态输出形态分布：

| 静态形态 | 文件数 | run-all 计数后果 |
|---|---|---|
| summary（含字符串拼接构造，如 `' + pass + ' 通过, ' + fails + ' 失败'`） | 414（397 拼接 + 16 直写 + 1 ratio 拼接） | 正常计入通过/失败 |
| **PASS/SKIP 单行族** | **90** | PASS 计 1 通过/条；**不计失败** |
| **静默（静态无任何可解析形态）** | **50** | 各计 1 失败 |
| mount（109）+ describe-jest（24） | 133 | harness 代打汇总行，正常计数 |

对 50 个静态静默候选逐一**实证复跑**（`node test/<file>`，30s 超时，run-all 同款解析；src/ 快照+回滚保护——`round-498` 超时被杀后按机制还原了 `src/normalization-of-deviance.js`，与 r220 报告记载的该文件注毒历史相符）：

- **实证静默 41 个**（无汇总结算、无 PASS/SKIP 行 → run-all 各计 1 失败）；
- **静态假阴性 9 个**（实证有汇总行，静态代理没认出来：blindspot-upgrade 7/0、dangerous-instruction-adv-short-verb-round187 15/0、doubt-emphasis-nominal-chain-r304 7/0、five-dimension-samples 25/0、means-as-end 17/0、negative-test-ppf-light-nouns-r302 21/0、pressure-family-en-r382 88/0、sycophancy-i18n 10/0、unit/multi-lang-age-detection 46/0——全部 0 失败）；
- 实证 PASS/SKIP 0 个（PASS/SKIP 族在静态阶段已被分出）。

`round-498-normalization-of-deviance.test.js` 30s 探针内未跑完（ETIMEDOUT），按 run-all 的 90s CHILD_TIMEOUT 单独复验：<90s 完成、exit 0、输出仍为纯文字（「r498 normalization_of_deviance 守卫: 13 条攻击全敏感，通过」）→ 静默归类不变。

### C2. 静默族完整清单（41 个，按 exit 分组；括号内为实证 exit 与尾部输出特征）

**纯格式债（exit 0，测试本身过、只缺 run-all 可解析汇总行）——32 个：**

```
core/path-guard.test.js            (0) 「path-guard: ALL PASSED ✅」
framing-effect-r254.test.js        (0) TAP 形「ℹ todo 0 / duration_ms」
framing-effect-synonym.test.js     (0) TAP 形
prosecutors-fallacy.test.js        (0) 「全部断言通过」
round-262-prosecutors-fallacy.test.js (0)
round-417-empty-answer-circular.test.js (0)
round-436-vagueness-report-quote.test.js (0) 「5 pass / 4 verify」措辞
round-437-appeal-authority-instrument.test.js (0)
round-443-presupposition-zh-families.test.js (0)
round-447-empty-answer-en-exemption.test.js (0) 「failures=0 / ALL GREEN」
round-463-circular-en-fix-amnesty.test.js (0)
round-477-statistical-misleading-fold-bare.test.js (0)
round-477-statistical-misleading-negative.test.js (0)
round-479-agency-deflection.test.js (0)
round-480-sunk-cost-nullified.test.js (0) 「18 攻击命中 / 10 良性 0 误报」措辞
round-481-sunk-cost-coercion.test.js (0)
round-482-complexity-shield.test.js (0)
round-491-responsibility-zeroing.test.js (0)
round-493-manufactured-consent.test.js (0) 「断言 52 全部通过」措辞
round-496-false-dilemma.test.js (0)
round-498-normalization-of-deviance.test.js (0, >30s) 变异测试，r220 记载有注毒史
round-551-tool-deflection.test.js  (0)
round-582-exclusive-trust.test.js  (0) 「7 过 / 0 败」措辞
round-583-exclusive-trust.test.js  (0) 「13 过 / 0 败（共 54 项）」措辞
round-586-flattery-pressure.test.js (0)
round-629-instructions-wiring.test.js (0) 仅 JSON 日志
round-630-preference-guard-dispatch.test.js (0) 仅 JSON 日志
round-634-dao-decision-dispatch.test.js (0) 仅 JSON 日志
round-643-platformadapter-dispatch.test.js (0)
round-644-favor-coercion.test.js   (0) **近失格式**：「结果: 61 过 / 0 败, 共 61 个」——用「过/败」不用「通过/失败」，主正则与分数式都不匹配
round-v680-macro-strategy-wiring.test.js (0)
round-v680-statistical-misleading.test.js (0)
```

**真断言失败（exit 1，缺汇总行之外还有真实红）——6 个：**

```
round-428-negative-mutation.test.js   (1) 缺 fixture scripts/round-428/attack-lines.txt（ENOENT）
round-436-bilingual-metric-quote.test.js (1) 断言 4 !== 7（良性豁免失效）
round-436-deletion-mutation.test.js   (1) 同族断言失败
round-488-powerless-deflection.test.js (1) 良性误判 'verify' !== 'pass'（monocausal_attribution）
round-502-helplessness.test.js        (1) 模块层漏检
round-506-sole-narrative.test.js      (1) 模块层漏检
```

**环境失败（exit 1，MCP 缺 HEARTFLOW_MCP_TOKEN 拒启）——3 个：**

```
round-572-associative-handler.test.js (1)
round-572-associative-wiring.test.js  (1)
round-733-injection-synonyms.test.js  (1)
```

**目录聚类**：`test/` 根目录 **40** 个，`test/core/` **1** 个（path-guard）。无其它子目录静默文件。

### C3. 与「~90」口径的差异分析

- **精确静默总数：41 个**（实证），而非 ~90。差异来源：
  1. **90 恰好等于 PASS/SKIP 族文件数**（90 个，core/ utils/ memory/ 下 40+ 的历史 smoke test 是主力）。该族**没有数字汇总行，但 run-all 对 PASS 行计通过、不计失败**——它们"没有标准汇总行"却不污染 failed 口径。用户反馈的 ~90 大概率指这一族（或把两族合并记忆）。
  2. 静默族 41 个才是真正每个计 1 失败、污染 failed 口径的部分；其中 32 个是纯格式债（exit 0），9 个同时有真实失败/环境失败。
  3. mount/jest 形态 133 个由 harness 代打汇总行，从不上静默名单。
- 历史佐证：r224 报告记载当时 90 个失败的构成为「未输出 **41** + Command failed 26 + 自报失败 5 + 零用例 1 共 73 个文件」——「未输出」族当时就是 41；本清单 41 与它数值相同但成员已随轮次更替（含大量 r4xx/r5xx 新文件），说明该族规模在多轮间大致稳定在 40 上下。

### C4. 与 test-count.json / 全量失败数的对照

- **`data/test-count.json` 当前缓存：passed 12911 / failed 108 / total 13019（at 2026-11-07T07:05:55Z）**。注意这是**文档基线值**，不是全量实测：r249–r259 及 r266 的惯例是 run-all 全量跑完会用实测值覆写它、随后 `git checkout` 还原回 12911/108（因为 doc-numbers-accuracy 门禁拿它比对文档口径）。
- **r266 全量实测**（`coordination/claims.jsonl` r266 条，agent-4 自报）：**19875 通过 / 128 失败**，"经 triage 全为存量/环境类"。`UPGRADE_LOG.md` 目前**没有 r266 条目**（最新为 r265），r266 仅存在于 claims.jsonl——建议 1 号补登 UPGRADE_LOG。
- **静默族在失败数中的占比**：以 r266 自报 128 失败为分母，41 个静默文件 ≈ **32%**；其中纯格式债 32 个 ≈ **25%**。其余失败为报告记载的既有族：MCP dispatch 族（round-572/606/608/609/614/615/621/639/733，缺 HEARTFLOW_MCP_TOKEN 或启动超时）、`run-all-no-silent-skip`、`unsupported-claim-exemption`、round-606 routes=1314 vs 1316 接线漂移、round-378 中间态契约、ClassicsRules 等（见 r244–r260 各报告失败清单）。参照 r256 报告的 97 失败构成，MCP/env 族约 10+ 个，"未输出汇总行"族是第二大失败源。失败总数从 r233–r257 的 97 爬到 r260 的 102、r266 的 128，主因是每轮新增测试文件放大 env 抖动族与静默族，而非回归。

### C5. Remediation 建议与门禁协同警示

1. **补汇总行（首选，先例 r231 automation-bias、r266 四文件）**：给 32 个纯格式债文件加标准行 `console.log('<name>: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个')`。注意近失格式文件（round-644「过/败」、round-582/583「N 过 / 0 败」）要改成「通过/失败」全词；round-629/630/634/643 的 JSON 日志族在 JSON 之外补一行汇总。
2. **改名移出 `.test.js`**：探针/变异类脚本（如 round-498 注入式变异、round-428/436-deletion 变异族）若不再作为门禁回归，可改名或移入不被 collectTestFiles 扫到的位置，消除「跑了却不计数」的灰色态。
3. **转 mount 形态**：`module.exports = function ({ test }) {...}`，harness 代打汇总行，最省事但改动面大，适合新文件。
4. **⚠️ 批量修复前必须与 1 号协同更新文档基线**：修这些文件会直接改变 run-all 的 passed/failed 计数（41 个失败转为真实通过/失败数），而 `doc-numbers-accuracy` 门禁读 `data/test-count.json` 缓存与 README/SKILL/AGENTS 的测试数口径比对。历史上 run-all 每次全量覆写缓存都导致该门禁转红、靠 `git checkout` 还原基线（r249–r259 反复发生）。**批量补行后必须：① 重跑全量 run-all 取新实测值；② 与 1 号协同重新生成文档基线（README/SKILL/AGENTS 三处测试数 + test-count.json）；③ 再跑四门禁确认 24/24**，否则会把「静默失败」漂移成「文档数字不一致」的新型门禁失败。
5. **另附两项交 1 号**：① B3 的 `src/completion-evidence.js:98` 死循环（真 bug，lint 现行报 1 条）；② `scripts/round-527-trace.js:21` 同族丢 flags 拷贝（历史探针）。

---

## 交付文件清单

| 文件 | 状态 |
|---|---|
| `scripts/lint-regex-exec-loops.js` | 新建（零依赖；默认扫 src/；0 violations 时输出「0 violations」并 exit 0） |
| `.github/workflows/gates.yml` | 新建（四门禁 job + 独立非阻塞 `lint-regex-exec-loops` job，continue-on-error） |
| `coordination/reports/r266-ci-agent3.md` | 本报告（注：`coordination/reports/` 在 .gitignore 内，历史上需 `git add -f` 入库，提交由主控统一做） |

**未改动**：`test/run-all.js`、四个门禁脚本、门禁断言、`src/` 任何文件、`VERSION`。未执行任何 git 命令。

## 给主控的要点提示

1. 任务 A：4 文件全过、可被 run-all 计数；但 claims.jsonl 自报 25/37/25/30 与实测 25/30/25/37 有两位对调（总数 117 一致），建议 UPGRADE_LOG r266 条目按文件名写实。
2. 任务 B：lint 建成并经正向对照验证（7/7 命中、9 安全形态零误报）；src/ 现存 1 条**真违规**（completion-evidence.js:98 死循环，已实证挂起），scripts/ 1 条同族（round-527-trace.js），均未修（src/ 禁触），请 1 号排期。
3. 任务 C：静默族精确 41 个（32 纯格式债 + 6 真失败 + 3 环境失败），test/ 根 40 + core/ 1；~90 口径实为 PASS/SKIP 族（90 个，计通过不计失败）。批量修复前必须协同更新文档基线，否则制造新型漂移。
