# 第 224 轮（v6.7.128 工作面，unattended 自主升级）

**方向**：`checkConfidenceCalibration` 的 `if (hasChinese) {...} else {...}`
二分支结构 —— **只要文本里出现一个汉字，整段英文 superlative 判据
全部不跑**。本轮把它移到公共区，同时补 judge 侧实测漏判的 `reliable`。

**为什么选它（照纪律先复测，不信简报旧描述）**：

1. 队列待办为空（`data/upgrade-queue.json` 仅 1 条已 done），按优先级
   落到「上一轮遗留的真缺口」。遗留 4（14 条 decision-router 断言）
   本轮**复测证伪**：`test/decision-router-rule-coverage-r221.test.js`
   已对 34/34 条规则做了 match/confidence/rationale 直调 + 20 条仲裁
   胜出断言（438 行），该遗留是**过期描述**，不再重复。
2. 复测坐实（`scripts/round-224/probe-r224-sup-scan.js`）：中文「最+X」
   侧已高度覆盖（物品 8/8、客户度量 5/6、知识指标 5/6 全 verify），
   时间/度量中性化正确（E/F 组 pass 6/6），无缺口。
3. 转测中英混排（`probe-r224-branch.js`）：10 条样本中
   **6 条混排全 pass（0 命中）**，同批 4 条纯英文全 verify ——
   缺口精确坐实在分支结构上，不在词表。
4. 附带发现（`probe-r224-norm.js`）：纯英文
   "This is the most reliable approach." 也 0 命中 ——
   `reliable` 不在 `EN_SUP_ADJ` 词表里。同源缺口，一并修。

**变更（4 个 commit）**：

| # | 文件 | 内容 |
|---|---|---|
| 1 | `src/index.js` | `_supEn` 判据段从 else 分支移到公共区（+32 -25）；`EN_SUP_ADJ` 补 `reliable`；`_supENre` 的 `safests?` 容错 |
| 2 | `test/confidence-superlative-en-mixed-r224.test.js` | **10 断言**（正向 5 组 + 反向 5 组） |
| 3 | `scripts/negative-test-confidence-superlative-en-mixed-r224.js` | **6 变异 + 1 对照，6/6 真红、零无效变异** |
| 4 | `scripts/round-224/probe-r224-*.js` | 8 个探针（含分支定位、误伤量化、中文豁免复测） |

**判据形状与边界**：

改动前后判据本体逐字节相同，只改**可见性**：

```
旧：if (hasChinese) { 中文判据 } else { 英文判据 }   ← 一个汉字 → 英文全不跑
新：if (hasChinese) { 中文判据 }
    英文判据（公共区，中英混排也走）
```

三条边界（v6.7.126 第 29 轮确立，本轮原样保留并写进测试锁住）：
① 建议句式豁免（the best way to / best practice / safest approach）
② 时间/序列副词中性化（latest version / newest release）
③ 只收主观形容词，可验证形容词（accurate/precise）刻意不收

**方法论坑（本轮实测踩到，三条都是新的）**：

1. **`bidirectional-guard.js` 被 gate-benchmark.js 的 require 副作用
   提前终止**。`node scripts/bidirectional-guard.js --check` 输出只有
   25 行（基础 97 条 + 自建基线比对），扩展集/垂直/混排三池
   **一次都没跑**。根因：`test/gate-benchmark.js` 在 require 时执行
   自己的 `--check` 逻辑并 `process.exit(1)`，把宿主脚本的执行体
   直接杀掉。这是既有缺陷（不是本轮引入）。
   解法：写 `scripts/round-224/r224-guard-run.js` 直接调用 guard 导出的
   `runSet()` 跑全部 11 个池（97+106+150+25=377），拿到真实基线。
2. **M1 变异要闭合括号，不能只插 `if`**。第一版在 `const _supEn = text`
   前插 `if (!hasChinese) {` 忘了补 `}` → 语法错误，测试以 -1 失败退出，
   被误判成"真红"。真红必须来自**断言失败**而非语法崩。
   修正为「起始锚点前插 if + 结束锚点后补 }」的包整段写法。
3. **M6 类的"清空样本池"变异会被 for 空转吃掉**。测试文件里
   `const mixedMost = []` 后循环体不执行，测试照样全绿。
   解法：在测试文件内加**样本池非空断言**（`mixedMost.length === 4`），
   任何删样本的改动都会立刻变红。这条比守卫脚本本身更可靠。

另有两条小坑：patch 的模糊匹配会把 `(a|b)` 偷偷改成 `(?:a|b)`
（功能等价但污染 diff，需 `git diff` 核对后改回）；M4 的行级锚点
不能用精确正则匹配源码（`safest` 词形历史上变过），要按
`includes` 做宽松行匹配。

**七项验证**：

| 项 | 结果 |
|---|---|
| bin/verify | **14/14** |
| 双向门禁（runSet 直跑 11 池） | 误拦 **25/326**、召回 **52/52**，与改动前 `diff` 为空（**逐字节一致**） |
| run-all | **7630 通过 / 0 失败**（较 223 轮 7620 **+10**，npm-package-integrity 也 6/6） |
| security-audit | **16/16** |
| doc-numbers | **15/15** |
| 本轮守卫 | **6/6 真红、零无效变异**（C0 对照全绿） |
| 223/222 轮回归 | **45/45**、**32/32** 无回归 |

**误伤量化的实际口径**（给下一轮，别再用 `--check` 的假数字）：
`scripts/round-224/r224-guard-run.js` 跑 11 池 = gate-97 五类
（30/20/20/15/12）+ ext 四类（25/24/25/32）+ vertical-benign 150
+ benign-mixed 25。良性侧 flag 25 = borderline 3 + ext.multilingual 1
+ ext.longtext 11 + ext.mixed 10，全部是历史既有命中。

## 遗留（给下一轮）

1. **`bidirectional-guard.js --check` 的执行体被杀**（本轮发现，
   尚未修）：`test/gate-benchmark.js` 的 require 副作用
   `process.exit(1)` 会提前终止宿主脚本，导致扩展集三池
   （106 + 150 + 25）在 `--check` 路径下**从未被执行**。
   修法是给 gate-benchmark.js 加 `require.main === module` 守卫，
   但那是 test/ 目录文件、且属于"升级机制自身"边缘，
   留给有权动它的一轮。本轮用 runSet 直跑绕过了。
2. 「业界最优的方案」仍不双判（221→223 连续三轮结论一致），
   需先积累「优被建议句式豁免吃掉」的实测样本量。
3. `_selfVerificationIssues` 升 rewrite/block：无样本支撑（四轮一致）。
4. field-* 六条外部不可驱动 = 真实语义，已判定不改。
5. 零引用模块 369 个、74+ 历史探针文件未跟踪。
6. `chat` 侧中英混排的其它维度（如 `checkSycophancy` 同样有
   `if (/[\\u4e00-\\u9fff]/) ... if (/[a-zA-Z]{4,}/)` 的早退二分支）
   **未复测**——只测了 confidence 一个维度，不预设它有问题。

**给下一轮的接手说明**：先跑
`node test/confidence-superlative-en-mixed-r224.test.js`（应 10/10）与
`node scripts/negative-test-confidence-superlative-en-mixed-r224.js`
（应 6/6 真红）。
可续方向：遗留 1（修 gate-benchmark.js 的 require 副作用，让
`--check` 真跑全量池 —— 这是**工具债**不是功能债，修完全部历史轮次的
门禁数字才可信），或遗留 6 的 sycophancy 早退二分支复测。
