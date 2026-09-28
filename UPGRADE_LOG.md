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
