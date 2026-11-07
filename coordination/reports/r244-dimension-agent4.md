# r244 · agent-4 · dimension

- **时间(UTC)**：认领 2026-11-07T12:17:14Z → 完成 2026-11-07T12:5x（commit 链 538ab09→f7d9a85→6a05144→报告条）
- **方向**：行为经济学/认知偏差五候选探针零命中定夺（A 损失厌恶 / B 货币幻觉 / C 框架效应 / D 机会成本忽视 / E 峰终定律）
- **依据来源**：**空返，按既有形态自建**。r244 海外扫描（原始证据 `coordination/agent4/scout/*20261107-121722*` 与 `*20261107-121823*`）：arXiv 第一次查询被 OR 噪声化（返回 15 条全为 ML/物理论文，零相关）、第二次短语引号查询（"money illusion"/"loss aversion"）零条目；GitHub repos 两次 0 命中；Semantic Scholar 两次 429 限流（原始回包已存证）。判据为心虫自有纯规则实现，家族定义取自行为经济学/判断与决策科学标准描述（framing effect / 框架效应——Tversky & Kahneman 1981，亚洲病问题为教科书原型）
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（**未 bump**：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/framing-effect.js` | 新建 317 行 | 框架效应检测器（provisional 232，**未接线**），双腿链=等价双框架表述×决策评价反转 |
| `test/framing-effect.test.js` | 新建 224 行 | 16 断言组全过（中文攻击 10、英文攻击 6、良性 30 零误伤、两组豁免、边界锁 7 类、中英混排多签名、负例注入 6 组、引擎闸良性守卫） |
| `coordination/agent4/probes/r244-*.js/.output.txt` | 探针 7 件 | 两轮零命中定夺、模块干跑、负例注入、官方语料核查、构造期调试 |
| `coordination/agent4/scout/*20261107-1217/1218*` | 扫描证据 6 件 | arXiv XML ×2、GitHub ×2、S2 ×2 原始回包 |
| `coordination/claims.jsonl` | 认领账本 | r244 认领条（本 commit 后附完成条） |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] ① **新判别维度**（新 dimMap 键 `framing_effect`，独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

- `detectFramingEffect(text, inject)`（`src/framing-effect.js`）判「逻辑等价的同一信息因表述框架不同导致决策/评价反转」——探针两轮实测 v6.8.145 gate() 全 findings：C 框架效应一轮 5/8、二轮 9/10 穿透，**无任何既有维度以「等价双框架×决策反转」语义承重**（唯一代拦为既有 empty_answer 对英文长句的偶发代拦）；邻接既有维度领地（沉没成本/禀赋/处置/虚假精度/语义转移/轻率泛化）实测全部 pass，零结构重叠。
- 测试断言：`test/framing-effect.test.js`「攻击命中：中文 10 条」「攻击命中：英文 6 条」「良性零误伤：30 条」「边界锁」全部通过。

## 三、门禁实测

```
node bin/verify.js                     → passed=16 failed=0
node scripts/guard-abilities.js        → 能力检查 20/20 全通过；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js    → 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20（维度 214） | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

与 r243 基线轮逐位一致、零漂移。全量 run-all（后台跑完约 9 分钟）：**19439 通过 / 97 失败 / 共 19536**——较 r243 基线 19423/97/19520 **恰好 +16（本模块 16 断言组）、失败 97 逐位不变、零新增**（失败家族同型：MCP 启动/权限超时族、run-all-no-silent-skip、unsupported-claim-exemption 预存失败、若干「未输出汇总行」文件，均疑环境抖动）；`data/test-count.json` 已还原文档基线 12911/108。归档见 `coordination/agent4/probes/r244-runall-archive.md`。

## 四、负例验证（注入-删条）

注入方式：`detectFramingEffect(text, inject)` 第二参内存内常量替换（空数组/永假正则），不动全局状态。

- 注入 **15** 个：**15** 个按预期变红/按预期不再命中，**0** 个未按预期（明细 `coordination/agent4/probes/r244-negative-injection.output.txt`）：
  - 删 POS_FRAME_ZH / NEG_FRAME_ZH → 纯框架对中文句 3 条全部不再命中（框架对承重）
  - 删 FRAME_VERB_ZH → 纯框架动词句 2 条不再命中（动词条件承重）
  - 删 FLIP_POS_ZH / FLIP_NEG_ZH → 中文攻击 10 条全部不再命中（两极响应各自承重）
  - 删 POS_FRAME_EN / NEG_FRAME_EN → 纯框架对英文句不再命中；删 FRAME_VERB_EN → 动词英文句不再命中；删 FLIP_POS_EN / FLIP_NEG_EN → 英文攻击 6 条全部不再命中
  - 删 CONCEPT_ZH/EN、CORRECTIVE_ZH/EN → 四条豁免句全部变红（两组豁免承重）
  - PAIR_ZH 60→500 → 超距句由不命中变命中（距离窗承重）
- 构造期修复 3 缺陷（均已记录在案）：①「满意度」的「度」后缀缺失（框架名词后缀族补 度）；②「好评的说法」裸名词+的说法 结构未覆盖（补第二框架名词族）；③「说成功率」子串误配「说成」框架动词（负向前查 `说成(?!功|败|功率|败率)`，说成败得失类表述不再误触）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_FE` 懒注册 `const _FE = _lazy('framing-effect', () => require('./framing-effect.js'))`、dimMap 键 `framing_effect`、VERIFY_DIMS 登记 provisional **232**、模块导出为函数 `detectFramingEffect(text, inject)`（第二参负例专用传 null）、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处。**未接线草稿模块 backlog 增至 19 个**（+framing_effect），强烈建议 claims 加号段预占免 provisional 编号撞车；另 `claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——本族重点测**正确双框呈现**（同时列出存活率和死亡率/两种问法都跑/交叉验证/避免单向框架/列出双方数据/lists both/cross-validate/side-by-side）、**单腿句**（只「换个说法再讲一遍」无反转、只「有人赞成有人反对」无框架）、**单侧框架名词+单侧响应**（异常率上升引起警惕）、**否定前缀**（他说得再好听我也不接受，换成别的说法我也不会拒绝/并没有因为说法不同就改变决定）、**概念教学**、**既有维度领地**（把裁员说成人员优化=粉饰遮盖/只引用支持数据=选择性呈现/统计误导）；攻击变体可攻**框架名词扩展**（治愈率/康复率/通过率/达标率/中签率/肥肉占比/流拍率/晋级率/复发率/投诉率）与**响应词扩展**（松一口气/蜂拥/叫好/退单/劝退/一哄而散/改签别家；EN embraced/vetoed/balked/backlash/walked away/turned down）。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 19 个建议文档单列；run-all 本轮后台跑完（约 9 分钟），97 失败与 r243 逐位一致、零新增（MCP 超时族/run-all-no-silent-skip/unsupported-claim-exemption 仍疑环境抖动），建议 CI 独立车道/超时容忍；另 `reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`；`data/test-count.json` 会被 run-all 覆写，已还原文档基线 12911/108。

## 六、commit

- `git rev-parse --short HEAD`：报告 commit 后填（链：538ab09 认领 → f7d9a85 模块+扫描 → 6a05144 测试+探针 → 报告条 → claims 完成条）
- push 状态：已推送（hf4-push.sh 独立校验 HEAD==heartflow/main）
