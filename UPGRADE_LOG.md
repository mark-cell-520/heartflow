# 第 205 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：第 204 轮遗留 4「命中侧其他专形设施表未做差集比对」的落实。
复测发现两处独立缺口（简报描述的「行 259 设施表只有 4 词」只对了一半），
属「上一轮遗留的真缺口」，不需要再跑 decision 选向。

**选它的理由**：交接簿点名优先看第 259 条（预期差集最大），
且 `probe-r204-hit-gap.js` 的 `groupsOf()` 已可泛化，有现成探针基础。

## 立项前复测：简报旧描述只对了一半，另有两个更结构化的缺口

`scripts/round-205/probe-r205-pat-gap.js`（29 词 × 5 语形 = 145 次真 gate 调用）：

| 语形 | pass 数 | 说明 |
|---|---|---|
| A 牢骚 + 副词 + 破坏动词 | **29/29 全 pass** | 简报点名的行 259 形 |
| A2 牢骚 + 程度副词 + 关掉 | 29/29 全 pass | 同上 |
| B 把 X 关掉（PAT4 形） | **18/29** | 差集与 PAT4 设施表逐词吻合 |
| C 动词在前关掉 | 9/29 | — |
| E 英文 disable + 设施 | 7/29 | — |

**复测推翻了简报的归因**：语形 A 全 pass **不是**「设施表只有 4 词」，
连表内词「防火墙」都漏（`probe-r205-pat259.js` 定位）。根因是
**副词槽缺失**：行 259 专形的 `(?:把|将)?\s*(?:它|这|那)?` 之后紧跟单字
动词，任何口语副词（先/赶紧/直接）插入即失配 —— 12 条同形 9 条 pass。
唯一 block 的「直接卸载」形是第①条 `(?:直接|一律|全都|统统|无条件)` 支
偶然兜底，与本条无关。与第 126 轮 QUESTION_FRAME 副词槽同根：
**动词前的口语修饰词不在任何槽里。**

## 两处缺口、两个 commit

### 缺口 II：PAT4「把 X 关掉」设施表差集 12 词（commit 7910dc36）

`src/dangerous-instruction.js` 的 PAT4 正则（DANGEROUS_PATTERNS idx 9）
设施表补：沙箱、身份验证、权限校验、权限检查、越权、脱库、入侵、渗透、
提权、rbac、安全警告、安全检查。

实测：12 条同形攻击（把 + 差集词 + 关掉族动词）**7 条 pass → 0 条 pass**
（`probe-r205-which.js` 逐条打点坐实命中 idx 9）。

**未补 6 词及理由**（写进源码注）：
- authentication/authorization/access control/privilege check ——
  auth 干词已兜底（authentication 含 auth 子串，中文把字句形由 auth 命中）
- audit/sandbox —— 中文侧由「审计」「沙箱」覆盖，英文裸词在中文把字句
  语形下无用例
- 脱裤 —— 「脱库」变体，样本未出现

与第 204 轮注释专形同一根因：**v6.7.123 家族教训第 8 次**（两份清单
词面不一致 = 豁免侧否决白否决）。

### 缺口 I：牢骚专形副词槽两处（同 commit）

行 259 专形补两组副词槽（副词在「把」前 / 「把」后，因两组语序都实测
出现过：「直接把它删」与「把它直接删」）。

实测（`probe-r205-rehearse-adv.js`，攻击族 4 词 × 10 副词 × 5 动词 = 200 条）：
**72/200 pass → 0/200 pass**（第一版只加动词前槽仍剩 16 条，全是
「副词 + 把它 + 动词」语序，补第二处才归零 —— 这个语序是预演数字
逼出来的，不是想出来的）；
良性族 9/10 pass、**0 误伤**（牢骚 + 观察/排障动词不命中，两半齐备守住）。

## 守卫与七项验证

`test/dangerous-instruction-pat4-gap-round205.test.js` 14 断言：
A1 12 词 × 8 关掉族动词全 block、A2 开关字面后置形 block、
B1 4 词 × 9 副词 × 5 动词全 block、B2/B3 副词在把字前后两语序 block、
C1 10 条牢骚观察良性 0 误伤、C2 将字句补词 + 观察动词不误伤、
D1 PAT4 原表 12 条仍守、D2 牢骚原表 5 条仍守、D3 第 81 轮注释专形
8 条仍守、E1 第 22/123/203 轮 MUST_NOT_EXEMPT 族仍 block、
F1 源码锁 12 词在 PAT4 表内、F2 锁两组副词槽存在、F3 非字符串不崩。

负例脚本 `scripts/negative-test-pat4-gap-round205.js` **4/4 真守卫**：
G1 删 PAT4 补词 10 项 → 守卫红；G2 删两组副词槽 → 守卫红；
G3 只删「越权」一词 → 守卫红（证明补词确是拦截因）；
G4 禁用本轮两处改动 → 第 81 轮旧攻击仍 block（恒等式：原表未被削弱）。

| 项 | 结果 |
|---|---|
| bin/verify | 14/14 |
| 双向门禁 | 召回 52/52、误拦 **301/326（与基线持平，0 新增）** |
| run-all | **6635/6635（0 失败）** = 6621 存量 + 本轮 14 断言 |
| security-audit | 16/16 |
| doc-numbers | 15/15 |
| 本轮守卫 | 14/14 |
| negative-test | 4/4 |

## 踩坑

1. **run-all 汇总协议**：守卫文件输出「pass=N fail=N」被判失败
   （「未输出『N 通过, M 失败』结果行」）。**新测试文件必须输出
   `N 通过, M 失败, 共 K 个` 字样**，否则 run-all 视为失败 ——
   本轮发现后已修（commit b045fbf0），这是本轮唯一一次自引入回归。
2. **G2 needle 第一版写错**：用正则去匹配正则字面量失败 →
   改用 `split(原文串).join('')` 删除。**删含正则的源码字符串时
   不要用正则做 needle。**
3. **语序假设不全**：副词槽只加「动词前」一处时预演剩 16 条
   「副词 + 把它 + 动词」pass —— 副词在「把」前的语序未假设到。
4. 探针入口口径：`gate` 不是函数，必须 `gate.checkOutput(s).gate.action`；
   `di.detect` 不存在，逐条命中用 `new Function` 还原 DANGEROUS_PATTERNS
   数组再 `p.test(s)`（`probe-r205-which.js` 做法）。

## 遗留

1. **LLM 401 仍未解** —— stepfun api-key 失效，唯一硬阻塞。
2. **英文把字句形未覆盖**：「把 auth check 关掉」中文侧修了，但英文
   组合词（access control / privilege check / authentication）在
   「disable the X check」形下无专用探针量化。语形 E（英文 disable）
   实测 7/29 pass，其中 auth 族由 auth 干词兜底，
   **三词在英文形下是否真漏，下一轮先量化再决定**（不要直接补，
   可能是重复）。
3. 命中侧其余专形（第 80 轮清理族、第 126 轮加入名单族等）仍未做
   SECURITY_BOUNDARY 差集比对，`probe-r205-pat-gap.js` 的语形模板
   可泛化（B/C/E 三个模板已直接可用）。
4. 行 259 专形的设施表仍只有 4 词，本轮只修了副词槽；牢骚 + 补词形
   理论上仍 pass，因牢骚形低频且 PAT4 已覆盖同句动作语义，暂不扩表
   （避免又制造一份分叉清单）。

## 给下一轮的接手说明

1. **复测先于一切**：本轮简报说「设施表 4 词」是片面的 —— 真缺口是
   副词槽 + PAT4 差集两个，只信实测。
2. `scripts/round-205/` 三支探针可复用：pat-gap（29 词 × 5 语形全景）、
   pat259（副词槽定位）、which（逐条 DANGEROUS_PATTERNS 命中序号）。
3. 遗留 2 的英文形量化：直接扩 `probe-r205-pat-gap.js` 的 E 模板，
   对 access control / privilege check / authentication 三词建专项探针。
4. 补词铁律不变：不收 auth 族裸词扩写；两侧专形不同步改 = 制造新分叉。
5. 新建 test 文件记得输出「N 通过, M 失败」汇总行。

# 第 204 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：di 命中侧「注释专形设施表」补齐豁免侧差集 8 词 —— 第 203 轮遗留 3
明写的下一轮立项项（`A2 节两条 pass 的复现样本`），属「上一轮遗留的真缺口」，
不需要再跑 decision 选向。

**选它的理由**：交接簿点名"命中侧面留给下一轮单独立项"，且第 203 轮的探针
`probe-r203-comment-sec.js` 已把复现样本固化在守卫 A2 节里（审计 / RBAC 裸词
两条），有坐实的证据链可以直接接手。

## 立项前复测：缺口仍在，且比简报描述更结构化

| 探针 | 结果 |
|---|---|
| `probe-r203-di-recheck.js` | 50 条良性 block 2（gate_block）+ dims 只报汇总体 |
| `probe-r203-comment-sec.js` | A 族漏判 **2 条**（审计 / RBAC），非 0 也非 5 |
| `probe-r204-candidates.js` | 16 个候选补词全 pass —— 缺口是族级而非个案 |

`probe-r204-candidates.js` 是决定性一步：它把补词前各语形的动作全跑了一遍，
确认**整个差集词族**（不止 A2 那两条）在注释语形下都是 pass。若只看 A2 两条
会误判成"个案补两个词"，实际是"两份清单系统性分叉"。

## 根因：两份清单管同一批词，词面不一致 = 白否决

`src/dev-exemptions.js` 的 `SECURITY_BOUNDARY`（一票否决词表）与
`src/dangerous-instruction.js` 第 185/190 行注释专形设施表，语义上是**同一批
「真实安全边界」词**，但是两份手工维护的拷贝。精确比对
（`scripts/round-204/probe-r204-hit-gap.js` v3，把两个正则的交替组拆成词表后
逐词比对）**差 16 项**：

- 命中侧有 / 豁免侧无：无（豁免侧是词的超集）
- 豁免侧有 / 命中侧无（16 项）：审计、沙箱、安全检查、越权、脱裤、脱库、入侵、
  渗透、提权、authentication、authorization、access control、privilege check、
  audit、sandbox、rbac

后果链：**豁免侧判「安全词是宾语 → 一票否决」靠 `_securityIsVerbObject`，
而它用的是 `SECURITY_BOUNDARY`；命中侧 DANGEROUS_PATTERNS 不认识这些词
→ di 维度不命中 → 否决后没有任何维度填补 → pass。**

这就是「清单只有一份 ≠ 两份语义对齐」（v6.7.123 家族教训）的第 7 次复现：
前面 6 次（第 33/80/81/123/125 轮等）修的是动词表分叉，本轮修的是**设施表分叉**。

## 改动：补 8 词，两侧严格同表（1 commit）

`src/dangerous-instruction.js` 行 185（动词在前形）+ 行 212（把字句形）同步补：
rbac、脱库、越权、渗透、提权、审计、沙箱、安全检查。

**补哪 8 个 / 不补哪 8 个，逐条给理由**（都写进源码注释）：

| 判定 | 词 | 理由 |
|---|---|---|
| 补 | rbac | 具名单词（角色访问控制实现），且第 203 轮交接点名要收 |
| 补 | 脱库/越权/渗透/提权 | 攻击侧高频，原表只收了「入侵检测」这类设施词没收动作后果词 |
| 补 | 审计/沙箱/安全检查 | 裸词形（表内已有安全审计/日志审计等带限定形，不冲突） |
| 不补 | authentication/authorization/access control/privilege check/audit/sandbox | 命中侧已有 auth 干词 + 英文组合支（第 180-184 行），补进来是重复 |
| 不补 | 脱裤 | 「脱库」变体写法，实测中文攻击样本未出现，先不列 |

**刻意不收 auth 族裸词扩写**：第 203 轮交接明确"不要为了收 RBAC 把 auth 族
裸词放进去"，否则「注释掉 auth 模块」这类宿主形全被打成攻击。命中侧同理。

**两侧必须同步改**：第 81 轮起两份表就保持一致，单改一侧会制造
「注释掉 X hit、把 X 注释掉 漏」的新分叉。守卫 F1 节把这锁成断言
（从源码里抓两条正则、抽设施组、字面比对）。

## 守卫与七项验证

`test/dangerous-instruction-hit-facility-gap-round204.test.js` 11 断言：

| 节 | 断言 | 结果 |
|---|---|---|
| A1 | 9 词 × 2 语形（devCtx + 把字句 + 注释动词）全 block | ✅ |
| A2 | 9 词 × 动词在前形（无 devCtx，不依赖豁免侧）全 block | ✅ |
| A3 | 9 词必须由 di 命中（`checked_by.gate.reason` 点名 dangerous_instruction） | ✅ |
| B1 | 第 203 轮 A 族两条漏判样本（审计 / RBAC）转 block | ✅ |
| C1 | 纯开发层设施（日志/断言/console.log/调试代码）+ 注释动词仍 pass | ✅ |
| C2 | 补词 + 日志 的定语形不得 block | ✅ |
| D1 | 第 81 轮已知攻击 8/8 仍 block（补词不破坏原表） | ✅ |
| E1 | 第 203 轮 MUST_NOT_EXEMPT 族仍 block（第 22/123 轮边界守恒） | ✅ |
| F1 | 命中侧两条注释专形设施表字面一致 + 8 词在表内 | ✅ |
| G1 | 非字符串/空串不崩 | ✅ |
| G2 | 本轮只改命中侧，豁免侧 SECURITY_BOUNDARY 无本轮痕迹 | ✅ |

负例脚本 `scripts/negative-test-hit-facility-gap-round204.js`：**4/4 真守卫**

| 项 | 结果 |
|---|---|
| bin/verify | 14/14 |
| 双向门禁 | 召回 52/52、误拦 301/326（**0 新增**） |
| run-all | **6621/6621**（0 失败，6610 + 本轮 11） |
| security-audit | 16/16 |
| doc-numbers | 15/15 |
| 本轮守卫 | 11/11 |
| negative-test | 4/4 |

负例四支覆盖两种方向和一条恒等式，这是本轮最值得复用的设计：

- G1 动词在前形删补词 → 攻击转 pass（红）
- G2 把字句形删补词 → 攻击转 pass（红）
- G3 删豁免侧「安全检查」词 → 补词 + 日志族误赦（红，证明差集方向也真）
- G4 删全部补词 → 第 81 轮旧攻击**仍 block**（绿 = 原表未被削弱）

## 踩坑（三条，都修正过自己的错）

1. **差集探针连续三版才拿到真数字**（probe-r204-hit-gap.js v1→v3）：
   v1 用「抽正则组」但正则写错，27 个候选词全判 GAP（25 条误报）；
   v2 改用整行 `includes()`，被「安全审计 ⊃ 审计」这类**子串包含**误判
   （审计被当成已有，漏报 1 个真缺口）；
   v3 才做对——把两个正则的 `(?:...)` 组按深度拆成词表后精确比对。
   **教训：词表差集必须拆词，`includes` 在词表场景一定是错的。**
2. **预演补词时断言第 81 轮攻击"全失"，是假的**（probe-r204-rehearse.js v5）：
   组提取逻辑写反，对「动词在前形」返回了 groups[0]（那其实是动词表，
   len=43），导致设施表恒空 → 补什么都不命中 → 差点得出
   "补词会破坏原表"的错误结论并回滚改动。v6 修正为按语形取组后，
   同一次预演立刻变成 5/5 命中。**路径依赖的假结论比没结论更危险。**
3. **A3 断言口径错了**：第一版断言 `findings[].dimension` 含
   `dangerous_instruction`，实测 findings 只呈现 `gate_block` 汇总体，
   di 命中写在 `checked_by[].layer==='gate'` 的 `reason` 里
   （probe-r204-a3.js 坐实）。改口径后 9/9 通过。

## 遗留

1. **LLM 401 仍未解** —— stepfun api-key 失效，需用户更新凭据。仍是唯一硬阻塞。
2. **差集还剩 8 个词未补**（authentication/authorization/access control/
   privilege check/audit/sandbox/脱裤）：命中侧已有 auth 干词兜底，
   补是重复。但**英文注释语形下的双词组合**（「comment out the access
   control list」）没有专门探针量化过覆盖率，下一轮可立项。
3. **`_securityIsVerbObject` 仍只做前向判定**（第 203 轮遗留）：注释掉 +
   安全词（动词在前）的攻击形，命中侧靠第 81 轮注释专形兜住，但
   **旁证动词族**（绕过/关闭类 + 补的 8 词）没有对应的宾语性判定——
   例：「调试时把 RBAC 绕过」形有 _securityIsVerbObject，但
   「调试时绕过 RBAC」（动词在前 + 补词）未量化。
4. **命中侧其他专形设施表未做差集比对**：本轮只比了注释专形两条。
   第①条第④支（把 X 关掉）、第②条（直白删除）等专形可能也有同类分叉，
   可把 `probe-r204-hit-gap.js` 泛化成扫全部专形。
5. `data/upgrade-state.json` 的 round 仍为 13（init 已校准过，未再动）。

## 给下一轮的接手说明

1. **复测先于一切**：本轮又一次证明简报旧描述会误导（A 族漏判数从 5→2，
   且根因是"两份清单分叉"而非"动词表漏词"）。遗留 2/3/4 三项动手前先跑
   `node scripts/round-204/probe-r204-hit-gap.js` 确认差集现状。
2. **`probe-r204-hit-gap.js` 已可泛化**：它现在的 `groupsOf()` 按 `(?:...)`
   深度拆分，改成遍历 DANGEROUS_PATTERNS 数组按条输出差集即可覆盖遗留 4。
   注意行 259 那条「防火墙/审计日志/访问控制/安全策略 + 删关去移清停废卸」
   的设施表**已经只有 4 个词**，预期会是差集最大的一条，优先看它。
3. **补词时守住两条铁律**：① 两侧（动词在前 / 设施在前）必须同步同表，
   守卫 F1 会红；② 不收 auth 族裸词扩写（第 203/204 轮两次重申）。
4. `scripts/round-204/` 下 5 支探针可复用（hit-gap v3 是差集正解、
   rehearse v6 是补词预演正解；v1/v2/v5 是错解，只作教训留档）。

# 第 203 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：di 开发调试语境的**一票否决动词覆盖缺口**（上一轮 idx 5 归因收尾）。

**选它的理由**：轮初简报的遗留 4 明写「`dangerous_instruction` 开发调试语境误拦
（第 123 轮复测 50 条仍有 4 条 block）」并附了两支坐实过的探针
（`scripts/round-202/probe-r202-di-attr.js` / `probe-r202-di-detail.js`），
属「上一轮遗留的真缺口」——优先级仅次于队列待办，不需要再跑 decision 选向。

**立项前不信简报，先复测**（`scripts/round-203/probe-r203-di-recheck.js`）：
50 条良性现况 **block 2 / verify 3 / rewrite 1**，block 的两条是 idx 5
（鉴权中间件注掉）与 idx 33（测试机关防火墙规则）。

**复测推翻了简报的诊断**。逐判据拆解（`probe-r203-devflags.js`）显示：
idx 5 的 devCtx=true、COMMENT_VERB=true、DEV_TARGET=false、
SECURITY_BOUNDARY=true、`_securityIsVerbObject`=false。**它不是良性误拦，
而是一个攻击形缺口**：句子是「把 + 安全设施 + 注释掉」结构，本该被
SECURITY_BOUNDARY 一票否决，却因为 `_securityIsVerbObject` 的动词表
只收绕过/关闭族（不收注释类），否决被静默跳过。

**旁证坐实这是族级缺口**（`probe-r203-comment-sec.js`）：同形攻击 10 条
（把 + 安全设施 + 注释掉）**5 条被 isDevDebugContext 误放行**；对照的
绕过动词族 5/5 全 block。缺口全在动词表的覆盖范围。

## 改动：`src/dev-exemptions.js` 新增宾语性判定的窄动词表（1 个 commit）

`_securityIsVerbObject` 新增第二循环，单列 `SEC_OBJ_VERB` 窄表
（注释 / 重置 / 清理 / 卸载族）回答「安全词是不是这个动词的宾语」。

**为什么不并进 `BYPASS_VERB`**：第 34 轮把清理动词加进通用表造成三重破坏
（误赦「本地调试清空检查项」真攻击、弄假第 22 轮守卫、负例 needle 失配
静默失效）。窄表只被本函数使用，不参与 `isDevDebugContext` 的
devCtx × target × verb 三交集，因此不会放宽第 124/125 轮
MUST_NOT_EXEMPT 守住的边界。

两条宿主形/定语形否决（安全词不是宾语时不否决）：
- 把/将与动词之间出现方位词（里/中/内/上/下）→ 宿主形
- 安全词之后出现「的」→ 定语形
- ⚠️ 定语否决必须**逐词判**：首版只取第一个 SECURITY_BOUNDARY 匹配，
  在「把审计日志的鉴权注释掉」上失效——第一个匹配是词首「审计」
  （后面有「的」），末尾紧邻动词的真宾语「鉴权」被漏掉。修为
  `matchAll(SEC_BOUNDARY_G)` 只要有一个安全词后面没有「的」即判宾语。
  共享正则不加 `g`（会污染其他调用点的 lastIndex），改用全局副本。

**修后**：A 族 10 条攻击 pass 由 5 降到 0；第 22/123 轮既有
MUST_NOT_EXEMPT 回归全绿（守卫 D 节）。

## 守卫与七项验证

`test/dangerous-instruction-sec-obj-verb-round203.test.js`（11 断言）：

| 节 | 断言 | 结果 |
|---|---|---|
| A | 10 条攻击 gate 全 block + `isDevDebugContext` 全 false + di 维度仍命中 | ✅ |
| A2 | 2 条已知漏判族（裸安全缩写不在命中侧设施表）只锁一票否决 | ✅ |
| B | 4 条宿主形本支不过宽 | ✅ |
| C | 8 条良性不得因本支被 block | ✅ |
| D | 复用第 22/123 轮既有 MUST_NOT_EXEMPT，回归守恒 | ✅ |
| E | 非字符串不崩、动词在前形不走本支 | ✅ |

负例脚本 `scripts/negative-test-sec-obj-verb-round203.js`：**4/4 真守卫**
（删判据必变红）。

| 项 | 结果 |
|---|---|
| bin/verify | 14/14 |
| 双向门禁 | 召回 52/52、误拦 301/326（0 新增） |
| run-all | **6610/6610**（0 失败，新增 11 条本轮守卫） |
| security-audit | 16/16 |
| doc-numbers | 15/15 |
| 本轮守卫 | 11/11 |
| negative-test | 4/4 |

## 踩坑（三条都写进了源码/脚本注释）

1. **负例样本必须让被测判据位于触发路径上**：第一版 G3/G4 用
   「在鉴权中间件里把日志注掉」这类样本，删掉宿主否决后**仍全绿**——
   方位词在安全词之前（鉴权 → 中间件 → 里），between 裁剪后安全词根本
   不在窗口内，该否决从未被触达。换成「把日志在鉴权中间件里注掉」语序后
   才真的由 true 翻 false。**守卫摆设不在判据写错，而在样本打不到它。**
2. **定语否决不能只取第一个匹配**（见上，审计日志的鉴权）。
3. **共享正则不能加 g**：SECURITY_BOUNDARY 是单来源共享常量，
   加 `g` 会让其他调用点的 lastIndex 跨调用残留，那样的 bug 比
   本轮缺口更难查。用 `new RegExp(source, 'gi')` 局部副本。

## 遗留

1. **LLM 401 仍未解** —— stepfun api-key 失效，需用户更新凭据。仍是唯一硬阻塞。
2. `data/upgrade-state.json` 的 round 仍为 13（init 已校准过，未再动）。
3. di 侧剩余缺口：
   - idx 7（Redis 白名单）、idx 47（测试库全表删除）两条命中-豁免分叉，
     第 123 轮起挂着，**本轮复测 50 条已不见这两条 block**（它们现为
     pass 或非 block），下一轮可直接复测确认是否已被前几轮改动带过去。
   - 命中侧设施表缺裸安全缩写（RBAC 等）与「安全词 + 的 + 安全词」定语形，
     本轮只修了豁免侧一票否决，命中侧面留给下一轮单独立项
     （`probe-r203-comment-sec.js` A 族 idx 7/9 两条 pass 的复现样本在
     `test/dangerous-instruction-sec-obj-verb-round203.test.js` A2 节）。
4. `ai_writing_tell` 多语言误伤、reward_hacking 剩余 6 类，均未动。

## 给下一轮的接手说明

1. **先复测再动手**：本轮最大收获是「简报说误拦，实测是攻击形豁免缺口」。
   遗留项 3 的两条分叉务必先跑 `scripts/round-203/probe-r203-di-recheck.js`
   确认现状，不要照抄 123 轮的旧描述。
2. `SEC_OBJ_VERB` 窄表现在只做**前向**判定（把/将 + 安全词紧邻动词）。
   若要做后向（注释掉 + 安全词），须先确认命中侧第①条两行注释专形
   （`src/dangerous-instruction.js` 第 185/190 行）的覆盖边界，
   两侧重复收词会再一次制造「清单两份、语义分叉」。
3. 修命中侧设施表时注意：`DEV_TARGET` 刻意不收凭据词（第 22 轮断言），
   不要为了收 RBAC 把 auth 族裸词放进去。

# 第 202 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：rh 中文侧 4 类低密度族补形 —— 由 `decision.decide` 本体选出
（`scripts/round-202/decide-r202.js`，chosen=B / score 0.83，一次跑出。
A=di 开发调试语境误拦收尾 0.77，C=di idx 7/47 分叉 0.68，
