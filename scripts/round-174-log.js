'use strict';
// r174 UPGRADE_LOG.md 顶部追加（幂等）
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'UPGRADE_LOG.md');
const VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();

const body = `# 第 174 轮报告（v${VERSION} — 第172维度 reverse_causation 因果倒置上线 — 2026-10-31）

## 一、方向与来源
- 方向（任务书轮换池，切到**因果与反事实推理**一线——r169/r170/r171/r172/r173 连续五轮均为新判别维度 selection_bias / survivorship_bias / base_rate_neglect / whole_part_transfer / clustering_illusion，本轮按轮换纪律换线）：**因果倒置（reverse causation / 反向因果）**——把**对后果的应对行为**当成**后果本身的原因**。人之所以采取某个行为，恰恰是因为不利后果已经存在或风险已经很高；于是「做这件事的人/地方，后果更严重」是**选择效应**（后果筛出了行为人），不是该行为制造了后果。
- 缺口实证（侦察阶段 /tmp/hf-probe-r174.js + /tmp/hf-probe-r174b.js，直调 src/gate.js 实测）：第一轮候选池扫描（区群谬误/反向因果/不可证伪双赢/伪精确/情态升级/基准缺失/代理指标/事后聪明/排除法/分布忽视/因果倒置-降温/精确错觉）中，**反向因果族 10 条攻击样本 7 条穿过硬闸门且零维度命中**（仅「报警越多…」「被约谈的官员…」「看医生越频繁…」3 条被 pseudo_causal / fallacies 兜住），良性 10 条零误判——是候选池中唯一整族真零覆盖的方向。post_hoc / pseudo_causal 只管「A 在 B 前所以 A 导致 B」的**时序**连接（且抓「越…越…」相关框），本族管**方向搞反**：被指为原因的行为是对后果的应对，后果在前、行为在后，因果链被整体倒置。conditional_proposition（第160维）管「如果A真就B」假设条件句当既成论据，与本族不同构。
- 外部来源（真实，未编造）：HN Algolia "counterfactual reasoning" 命中 KDD Tutorial on Causal Inference and Counterfactual Reasoning（objectID 23266032）与 "What If It Goes Wrong?: The Hidden Dangers of Counterfactual Reasoning in AI"（43754084）；"causal inference" 命中 "Causal inference as a blind spot of data scientists"（37890685，225 分）与 "Seven basic rules for causal inference"（41263928）——确认因果推断是数据科学与常识推理的公认盲区；GitHub fallacy-detection 仓库群 tmakesense/logical-fallacy ★20 / SeanFlannery/Logical.ly ★4 / EPITA-SCIA/Fallacy-Detection-LLM ★2 / IMJONEZZ/Fallacy-Detection ★1 全部 LLM-based，与纯规则引擎不同构，仅作概念背景；Semantic Scholar 关键词检索返回 HTTP 429（Too Many Requests），如实记录。**本族判据为心虫自有纯规则实现**。侦察落盘 /tmp/hf-scout-r174.txt。
- 心虫裁决：philosophy_decision type=**accelerate** / confidence 0.7 / priority 40 / trigger optimal_conditions / goalReviewed true；cognitiveLoad 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书；accelerate 依据是缺口实测（7/10 真零命中）与既有维度射程归因。

## 二、实现内容
- **src/reverse-causation.js（新增，约 285 行）**：第 172 维度检测器。18 个可注入常量 + 双腿①路线 + 腿② nearFrom 判定。
  - 腿① RESPONSE_CORR 反应型行为 × 相关/选择框，两形任一：
    - R-a 选择差异框：反应型行为名词（住院/就医/看病/吃药/服药/打针/做手术/化疗/透析/吃安眠药/看心理医生/心理咨询/心理治疗/报警/报案/投诉/维权/申诉/起诉/补习/补课/复读/约谈/诫勉/隔离/封控/戴口罩/头盔/装监控/装防盗窗/买保险/体检/裁员/封号/禁言/下架/整顿/检修/止损/割肉…裸名词形态；EN hospitali[sz]ed / therapy / police reports / tutoring / wearing masks / cameras / insurance / layoffs）+ 群体名词（人/患者/病患/孩子/学生/社区/地区/公司/官员/干部/家庭/用户/员工/骑手/居民/账号/账户…；EN patients / people / those who / areas / children / drivers）落在 6 字（EN 30 字符）窗内、前后双向，**且**句中存在差异/相关标记（更/多/高/严重/差/容易/越/集中/往往/大都/明显/显著/频繁；EN more / higher / worse / more often / likely / tend）；
    - R-b 递增相关框：反应型行为 + 「越」（12 字窗）且全文「越」出现 ≥2 次（EN the more X … the worse Y，比较词同族化）。
  - 腿② CAUSE 因果归因：因果动词（导致/造成/引发/引起/带来/招来/引来/吸引/催生/制造/滋生/助长/加剧/加重/诱发/促成/酿成/加大了/增加了/提高了/提升了/推向/是…的原因/根源在于/罪魁祸首/让/令/使得；EN causes / leads to / results in / increases / worsens / is responsible for / contributes to / makes / attracts / draws） × 负面结果名词（死亡/事故/犯罪/小偷/复发/恶化/失眠/抑郁/自杀/落马/倒闭/亏损/被骗/被盗/感染/感冒/更差/退步/风险/问题；EN death / mortality / accidents / crime / relapse / suicide / addiction / infections / losses / worse）落在 18 字（EN 45 字符）窗内。
  - 五类豁免全部可负例注入置空：概念/教学转述、实验/证据语境、推理否定/反向承认、对冲、疑问句。
- **src/index.js 九处接线**（require / 计算点 _applyPedagogyRelaxation / dimMap / allDims / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / module.exports），由带断言的接线脚本一次接齐（同 r171/r172/r173 先例，scripts/round-174-wire.js）。
- **r174 实现教训（三条，已固化进测试与源码注释）**：① 群体名词的「的」在名词两侧都可能出现——「住院**患者的**死亡率」是「名词+的」，「住院**的**患者」是「的+名词」，首版只收「的+名词」导致「住院患者的死亡率明显更高」整句漏判（改为双侧收）；不收无「的」的裸名词邻近（否则「裁员之后公司效益好转」式巧合邻近会误配）。② 腿② 目标窗若从因果动词匹配的**终点**起算，「是公司衰败的原因」这类动词模式会把结果名词整个吞进自己匹配里，窗内只剩句号，结果腿永远找不到负面结果——改为从**起点**起算（nearFrom）。③ 英文侧缺 attracts / draws / makes / worse 词形与 the more X … the worse Y 比较词同族化，整条英文族漏判。
- **test/round-174-reverse-causation.js（新增，约 245 行）**：正向（攻击 12 中文 + 4 英文 / 良性 14）+ 13 项常量负例注入承重（RESP/GROUP_DE/DIFF/YUE/CAUSE/RESULT × ZH/EN，R-b 单形用无「的+群体名词」的专用样本做隔离）+ 4 类豁免陷阱翻转 + 疑问句豁免 + gate 层变体矩阵 + 登记断言×3。
- 文档：AGENTS.md / README.md / SKILL.md 三处数字（维度 171→172、VERIFY 130→131、What it catches 127→128 request verify、规格表口径戳 6.8.100→6.8.102、维度列举补 reverse_causation）+ README version-history 追加 6.8.102 行 + CHANGELOG.md 6.8.102 条目；VERSION 6.8.101→6.8.102（sync-version.js 同步 package.json / SKILL.md / heartflow.js BUILD_DATE）。

## 三、验证数据（五门禁全绿）
- round-174 轮测：**24/24**（攻击 16/16 命中含中英/裸名词「头盔」「封号」/带修饰/倒装结论先行/长句/越字相关框；良性 14/14 零误判含「战争是多因共同造成的」边缘良性、正确方向陈述、选择效应被承认、推理否定、随机对照试验证据、正向效果、对冲、疑问、概念教学、非应对型动作「止痛药会损伤肝肾」；13 项常量负例注入承重；4 类豁免陷阱翻转；登记断言×3）
- gate 层变体矩阵：攻击 **7/7 非 pass**（verify/rewrite）且 findings 全含 reverse_causation；良性 **7/7 pass** 且零 reverse_causation 命中（161 轮强制项，真实 gate() 复量）
- 双向门禁：召回 **52/52**，误拦 **302/326 不升**（92.6%，与基线完全一致——本维度未新增任何误拦）
- bin/verify.js **16/16**；guard-abilities.js **20/20**（维度登记 172 键）；doc-numbers-accuracy.test.js **22/22**
- 运行态：MCP 重启后 status 返回 version 6.8.102（见下）

## 四、已知边界 / 下次可继续
- 反应型行为名词表只收「由不利后果/高风险处境触发」的应对/补救/防护/处置动作；**不含**预防性、治疗性或方向中性的动作（止痛药的肝损伤是直接药理效应，不属本族；加息/降息方向在现实争论中双向都被主张，未收录）。「住院导致院内感染」这类真实因果主张若带选择差异框会被判 verify（规则引擎无法独立证实方向，verify 的含义正是「先过方向判据」）。
- 群体名词必须与「的」相邻；「报警频繁的地区犯罪率更高」这类无「的」的修饰形暂不接 R-a（可走 R-b 或下轮扩 GROUP 允许「频繁的」式形容词中介）。
- 只覆盖「反应型行为被倒置为原因」这一子族；一般性反向因果（如「卖冰淇淋的日子溺水多，所以吃冰淇淋导致溺水」——共同原因「热天」形）需领域知识，规则引擎不判，留待后续轮次以共同原因族立项。
- 两条良性样本在 gate 层非 pass（「装监控之后盗窃下降了」被既有 pseudo_causal 判 verify、「裁员之后公司效益明显好转」被既有 post_hoc 判 rewrite）——均为**上一轮即存在的既有行为**（r174 改动前实测一致），本维度对二者零命中，未新增误拦。
- 未跑 test/run-all.js（20+ 分钟/4GB，按任务书纪律不跑）；新测试文件由下次全量 run-all 收编。

`;

let s = fs.readFileSync(FILE, 'utf8');
if (s.indexOf('# 第 174 轮报告') >= 0) { console.log('ALREADY PRESENT'); process.exit(0); }
fs.writeFileSync(FILE, body + s);
console.log('APPENDED round-174 report');
