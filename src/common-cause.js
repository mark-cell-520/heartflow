/**
 * src/common-cause.js — 「共同原因谬误（common cause / confounding factor /
 * 混杂因素）」检测器
 * （第 174 个判别维度）
 *
 * [r176 立项] decision 本体在当前引擎（v6.8.103，173 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "confounding
 * variable" 命中 "Statistics: When Confounding Variables Are Out of
 * Control"（objectID 11414793）与 "Understanding Confounding Variables:
 * A Comprehensive Guide (2024)"（41779877）——确认混杂/共同原因是统计与
 * 因果推断的公认盲区；GitHub causal-inference 仓库群 NSAPH-Projects/space
 * ★19 / Trhova/Causal-Microbiome-Omics ★19 / imkemayer/causal-inference-missing
 * ★9 均为学术数据科学工具，非纯规则文本判别，仅概念背景；Semantic Scholar
 * 两次检索均 HTTP 429 限流，如实记录）+ 引擎差距实测（r176 探针
 * /tmp/hf-probe-r176.js，直调 src/gate.js）：共同原因族 8 条攻击样本
 * **4 条穿过硬闸门且零维度命中**（冰淇淋溺水/背单词长高/蚊香登革热/雷雨哮喘），
 * 良性零误判。
 *
 * 辨别的族：共同原因谬误（common cause fallacy / confounding）——观察到
 * **两个变量共变或相关**，就**直接断言其中一个导致另一个**，不排查、不
 * 提及背后同驱的第三因素 Z（Z→X 且 Z→Y，被误读成 X→Y）：
 *   夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水。
 *   孩子身高和词汇量同步增长，说明背单词能让人长高。
 *   度假胜地蚊香销量和登革热病例同步上升，蚊香导致登革热。
 *   A 与 B 高度相关，可见 A 是 B 的原因。
 *   这两个指标同涨同跌，说明其中一个驱动另一个。
 *   Ice cream sales and drowning deaths rise together every summer,
 *   so ice cream causes drowning.
 *   The two metrics move in lockstep, which shows one drives the other.
 *
 * 与既有维度的边界（r176 归因）：
 *   · pseudo_causal 管「精确倍数伪因果」（提升了 3.2x 无来源）与
 *     「时间先后/玄学归因」白话伪因果，本族管**共变/相关→单向因果**；
 *   · post_hoc 管「A 在 B 前所以 A 导致 B」的时序连接，本族不依赖时序；
 *   · reverse_causation（第172维）管**方向倒置**（对后果的应对行为被当成
 *     后果的原因，选择效应），本族管**第三因素同驱被误读成直接因果**；
 *   · monocause（第161维）管**多因结果压成单一原因**+绝对化归因框架，
 *     本族两端都是变量、不断言结果只有一个原因；
 *   · clustering_illusion（第171维）管**聚集被当显著规律**，本族管
 *     **共变被当因果**；
 *   · affirming_the_consequent 管条件规则倒推，本族不涉及条件句。
 *
 * 判据（三腿共现，缺一不判）：
 *
 * [r264] 全新措辞家族扩展（真升级②）：池化探针 4/4 穿透中 2 个真缺口——
 *   COVARY_MOVE_ZH 补 双双+动向（双双走高/双双回落…）与 越X越Y(猛|狠|火)
 *   （越涨越猛/越跌越狠/越卖越火）；COVARY_MOVE_EN 补 both+动向词
 *   （both climbed/both rose/both fell…）；CAUSE_EN 补 trace(s)/traced
 *   back to。另 2 个探针穿透句（「背后是同一波流量在推动」/「driven by
 *   the same heat wave」）经既有 NO_CONFOUND 豁免覆盖，非缺口，不动。
 *   腿① COVARIATION 共变/相关陈述，两形任一：
 *     - C-a 相关名词形（必含双变量，免并列结构要求）：相关/相关性/
 *       高度相关/正相关/负相关/显著相关/密切相关/强相关；
 *       EN correlated / correlation / covary / covariation；
 *     - C-b 共变动词形（必须同句近处有并列双变量结构）：同步上升/同步
 *       增长/同步下降/一同/一齐/一起+上升类/齐涨/齐升/齐跌/同涨同跌/
 *       同升同降/相伴上升/如影随形/齐头并进/亦步亦趋/水涨船高/随之
 *       上升/联动；EN rise(s)/rose together / move(s)/moved together /
 *       in lockstep / hand in hand / in tandem / in sync / track each
 *       other / rise and fall together。并列结构（共变词前 40 字 / EN
 *       100 字符窗内）：和/与/跟/及/以及/这[两几][个种]/那[两几][个种]/
 *       两者/二者；EN and / & / both / the two / these two / two
 *       variables / two metrics；
 *   腿② CAUSAL 直接因果断言（不收「说明/表明/证明/可见」等推断词——
 *       推断词会把「与去年同期同步上升，说明旺季见效了」这类良性同比
 *       陈述误判；真因果动词才承重）：导致/造成/引发/引起/带来/催生/
 *       促成/使得/令/让/驱动/推高/拉高/抬高/造就/滋生/助长/加剧/加大了/
 *       增加了/提高了/提升了/带动/拉动/源于/来自于/归因于/归功于/是…的
 *       原因/根源在于/罪魁祸首；EN causes / leads to / results in /
 *       results from / drives / boosts / increases / reduces / makes /
 *       creates / produces / is responsible for / brings about / stems
 *       from / originates from / is due to。与腿①**双朝向共现**：共变词
 *       后 60 字（EN 120 字符）内或前 60 字内有 CAUSAL（覆盖「共变→
 *       因果」主形与「A 是 B 的原因，因为 A 与 B 相关」倒装形）；
 *   腿③ NO_CONFOUND 未排除/未点名共同因素：句中不出现共同原因/混杂/
 *       第三因素/同一个原因/都源于/控制了/回归/辛普森/DAG/工具变量等
 *       （见豁免表 NO_CONFOUND）——已点名或已控制混杂的陈述是正确
 *       判别（「二者都由年龄驱动」）或需要更强证据的学术表述，不判。
 *
 * 为什么取 VERIFY 级：共变能否推出因果取决于数据结构与是否控制混杂
 * （受控实验/自然实验中相关经设计成为证据，观察数据里共变与共同原因
 * 完全同形）——规则引擎无法独立判定数据结构，只能识别「共变→直接
 * 因果」的推断形态。verify 的含义是「先过混杂检验再采信」：调用方应
 *   要求补上第三因素排除证据（控制变量/实验设计/机制论证/时间先后与
 *   剂量反应的额外证据），而不是把共变直接当成因果。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（相关不等于因果/相关并非因果/相关不蕴含因果/因果
 *     推断/统计学/教科书/课堂/论文/科普/谬误；EN correlation does not
 *     imply / correlation is not / confounding / statistics / textbook /
 *     lecture）——讨论这个谬误本身是正确判别；
 *   · 实验/证据语境（随机对照/对照组/双盲/安慰剂/前瞻性/队列/元分析/
 *     临床试验/数据表明/统计显示/研究表明/证据表明/回归/自然实验；
 *     EN randomized / controlled trial / RCT / placebo / double-blind /
 *     cohort / meta-analysis / experiment / data show / evidence shows /
 *     studies show / regression / natural experiment）——受控设计中
 *     相关经设计成为证据；
 *   · 推理否定/反向承认（不能说明/不代表/不等于/并不意味着/推不出/
 *     不足以/未必/不一定/很难说/不见得/只是相关/另有原因/反过来/恰恰
 *     相反；EN does not mean / cannot conclude / not necessarily /
 *     does not prove / just because / the reverse / conversely）——
 *     拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/似乎/好像/说不定/有待；
 *     EN maybe / perhaps / might / possibly / probably / seems /
 *     appears / could be）——概率化结论不作谬误判定；
 *   · 已点名/已控制共同因素（NO_CONFOUND 表：共同原因/混杂/第三因素/
 *     同一个原因/都源于/控制住/控制了/控制变量/剔除/调整后/因果识别/
 *     辛普森/工具变量/倾向得分；EN common cause / confounding /
 *     confounder / third variable / lurking variable / controlling for /
 *     adjusted for / Simpson / DAG / instrumental variable / propensity
 *     / causal inference）——承认或控制混杂是正确动作；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① C-a 相关名词形（中文，裸名词形态）────────────────────────────
// 161 轮教训自查：「相关」去掉任何后缀（相关性/高度相关/正相关）仍以
// 「相关」二字命中——整族以「相关」为核心词收编。
const COVARY_REL_ZH = [
  /相关|关联/,
  // [r283] 时段共变无并列形：「冰淇淋卖得多的月份溺水事故也多」——X的[月份/年份/
  // 季节/时候/时段/阶段/时期/日子/季度]Y也/更Z，双变量由「的」前后两个名词短语
  // 承载，无 和/与 并列词（既有「X多的时候Y也多」形走 COVARY_MOVE 通道、要求
  // PAIR 并列结构，本族补无并列变体）。
  /(?:多|高|少|低|旺|忙|淡|闲|频|稀)的[^。，；！？]{0,8}(?:月份|年份|季节|时候|时段|阶段|时期|日子|季度)[^。，；！？]{0,14}(?:也|更|同|俱|相应|跟着)(?:多|高|少|低|差|好|频繁)/,
  // [r283] 的-link 比较平行形：「消防车越多的火灾损失越大」——越X的Y越[度词]，两个
  // 越子句由「的」连接（单主语的「越练越强」无「的」不中）；第二越子句禁模态/
  // 能愿词（越(?![要应得该须能想])），挡「越忙的时候越要多喝水」类良性处方形。
  /越[^。，；！？]{1,6}的[^。，；！？]{1,10}越(?![要应得该须能想])[^。，；！？]{0,8}(?:大|多|高|少|低)/,
];

// ─── 腿① C-b 共变动词形（中文，裸名词形态）────────────────────────────
// 组合形拆到词根仍命中：「同涨同跌」收裸形；「一起/一同/一齐/共同」
// +「上升/上涨/增长/下降/下跌/走高/走低/攀升/回落」组合覆盖同族。
const COVARY_MOVE_ZH = [
  // [r264] 新共变词族（双双+动向 / 越X越Y(猛|狠|火)）
  // [r272 新增] 口语共变族并入首正则（r264 测试断言数组长度恒为 3，见
  //   round-264-common-cause.test.js 登记段）：「X多/高的时候Y也多」同时点
  //   对照形 + 通用「越X越Y」——旧表只收「一起/同步/双双 + 动向词」与
  //   「越X越Y(猛|狠|火)」，「冰淇淋卖得多的时候溺水也多」整族穿透。
  /(?:一同|一齐|一起|共同)(?:上升|上涨|增长|下降|下跌|走高|走低|攀升|回落|变化|飙升|暴涨|疯涨|飞涨|蹿升|猛涨|猛增|猛跌|激增|剧增|骤增|骤降|锐减|暴增|狂涨|猛升)|同步(?:上升|上涨|增长|下降|下跌|走高|走低|攀升|回落|变化|飙升|暴涨|疯涨|飞涨|蹿升|猛涨|猛增|猛跌|激增|剧增|骤增|骤降|锐减|暴增|狂涨|猛升)|同涨同跌|同升同降|同向变化|反向变化|齐涨|齐升|齐跌|齐落|相伴(?:上升|上升|下降|增长)|如影随形|齐头并进|亦步亦趋|水涨船高|随之(?:上升|上涨|增长|下降|下跌|走高|走低)|联动|共变|(?:多|高|少|低|旺|忙|淡|闲|频|稀)的时候[^。，；！？]{0,14}(?:也|同|俱|相应|跟着)(?:多|高|少|低|旺|忙|淡|差|好)|越[^。，；！？]{1,4}越[^。，；！？]{0,6}(?:多|高|少|低|差|好|明显|严重|频繁|罕见)/,
  // [r264] 新共变词族（池化探针 4/4 穿透中的真缺口）：双双+动向 / 越X越Y(猛|狠|火)
  /双双(?:上升|上涨|增长|下降|下跌|走高|走低|攀升|回落|变化|看涨|看跌)/,
  /越[^，。；！？,!?;]{1,3}越[^，。；！？,!?;]{0,3}(?:猛|狠|火)/,
];

// ─── 腿① 并列/指代双变量结构（中文，共变词前 40 字窗内）────────────────
const PAIR_ZH = [
  /和|与|跟|及|以及|这[两几][个种]|那[两几][个种]|两者|二者|两个/,
];

// ─── 腿② CAUSAL 直接因果动词（中文，裸名词形态）────────────────────────
// 刻意不收「说明/表明/证明/可见/意味着」——那是推断连接词，会把良性
// 同比/对照陈述（「与去年同期同步上升，说明旺季策略见效」）误判；
// 因果断言由真因果动词承重，推断词通过 60 字共现窗自然覆盖。
const CAUSE_ZH = [
  /导致|造成|引发|引起|带来|催生|促成|使得|令|让|驱动|推动|推升|推高|拉高|抬高|造就|滋生|助长|加剧|加大了|增加了|提高了|提升了|带动|拉动|源于|来自于|归因于|归功于|是[^。；，]{0,12}的原因|根源在于|罪魁祸首|决定/,
  // [r272 新增] 裸「致」因果动词（「冰淇淋致溺水」「空调致室温上升」）——
  //   旧表只收 导致/致使 等双字词，单字「致 + 结果名词」整族穿透；
  //   「大致/致力/致辞/致谢/致使/致贫」等非因果形用否定环视排除。
  /(?<![大致])致(?!力|敬|辞|谢|使|富|贫|残)/,
];

// ─── 英文侧腿① ────────────────────────────────────────────────────────
const COVARY_REL_EN = [
  /\b(?:correlated|correlation|correlations|covary|covaries|covariation|correlate|correlates)\b/i,
  // [r283] with-more 平行共变形：「cities with more police have more crime」——比较级
  // 共变无相关名词、无 and 并列，双变量由 with 短语与主句谓语承载（走 COVARY_REL
  // 免并列通道）。
  /\b(?:with|where|when|as)\s+(?:more|less|fewer|higher|lower|greater)\s+[\w\s]{1,40}\s+(?:more|less|fewer|higher|lower|greater)\b/i,
];
const COVARY_MOVE_EN = [
  /\b(?:rise\s+together|rises\s+together|rose\s+together|rising\s+together|move\s+together|moves\s+together|moved\s+together|moving\s+together|fall\s+together|falls\s+together|fell\s+together|go\s+up\s+together|went\s+up\s+together|lockstep|hand\s+in\s+hand|tandem|in\s+sync|track\s+each\s+other|tracks\s+each\s+other|rise\s+and\s+fall\s+together|moves?\s+in\s+tandem)\b/i,
  // [r264] 新共变词族 EN：both + 动向词
  // [r272 新增] 比较级平行共变族并入本元素（round-264 登记段断言
  //   COVARY_MOVE_EN 长度恒为 2）：「the hotter it gets, the more …」
  //   「the more …, the more …」。注意 more/less/better/worse 不以 -er 结尾，
  //   须与 \w+er 并列枚举。
  /\bboth\s+(?:climbed|rose|risen|fell|fallen|dropped|surged|declined|increased|decreased|moved|went)\b|\bthe\s+(?:\w+er|more|less|better|worse|fewer|higher|lower|faster|slower)\b[^.]{0,44}\bthe\s+(?:\w+er|more|less|better|worse|fewer|higher|lower|faster|slower)\b/i,
];
const PAIR_EN = [
  /\b(?:and|&|both|the\s+two|these\s+two|those\s+two|two\s+variables|two\s+metrics|two\s+factors|pair)\b/i,
];
const CAUSE_EN = [
  /\b(?:causes|cause|caused|leads?\s+to|led\s+to|results?\s+in|resulted\s+in|results?\s+from|resulted\s+from|drives|drive|driven\s+by|boosts|boost|increases|increase|reduces|reduce|makes|make|creates|create|produces|produce|responsible\s+for|brings?\s+about|brought\s+about|gives?\s+rise\s+to|stems?\s+from|originates?\s+from|due\s+to|is\s+the\s+cause|are\s+the\s+cause)\b/i,
  // [r264] 新因果动词族 EN：trace(s)/traced back to
  /\btraces?\s+back\s+to\b/i,
  /\btraced\s+back\s+to\b/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /相关不等于|相关并非|相关不蕴含|相关不代表|相关未必|相关关系不等于|相关关系并非|因果关系不等于|因果推断|因果识别|统计学|统计学家|教科书|课本|教材|课堂|教案|论文|文章|科普|谬误|误区|陷阱|混淆变量|混杂因素|混杂|共同原因|共同因素|辛普森/,
];
const EXEMPT_META_EN = [
  /\b(?:correlation\s+does\s+not\s+imply|correlation\s+is\s+not|correlation\s+alone|correlation\s+and\s+causation|correlation\s+vs|confusing\s+correlation|correlation\s+causation\s+fallacy|confound\w*|lurking\s+variable|statistics|statistical|textbook|lecture|fallacy|methodology|simpson)\b/i,
];

// ─── 豁免二：实验/证据语境（相关经设计成为有效证据）────────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|安慰剂|前瞻性|回顾性|队列研究|元分析|临床试验|有效性试验|数据显示|数据表明|统计显示|统计表明|研究表明|研究显示|调查显示|调研显示|实测|证据表明|有证据|样本量|实验表明|实验证明|实验显示|回归|固定效应|自然实验|准实验|变量控制/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[- ]blind|prospective|retrospective\s+cohort|cohort\s+study|meta[- ]analysis|experiment\w*|clinical\s+trial|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|survey\w*|sample\s+size|regression|natural\s+experiment|quasi[- ]experiment)\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ──────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不能只凭|不能仅凭|不能单凭|不能据此|不代表|不等于|并不意味着|不意味着|推不出|不足以|未必|不一定|很难说|不见得|未必是|只是相关|仅仅是相关|仅是相关|还有别的原因|可能另有|另有原因|另有他因|反过来|恰恰相反|反之|还需验证|有待验证|无法证明|证明不了|难以断定|存疑|尚不/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient|no\s+evidence|does\s+not\s+prove|doesn'?t\s+prove|cannot\s+prove|can'?t\s+prove|does\s+not\s+cause|doesn'?t\s+cause|does\s+not\s+drive|doesn'?t\s+drive|does\s+not\s+lead|doesn'?t\s+lead|not\s+evidence|just\s+because|the\s+reverse|conversely|on\s+the\s+contrary|cannot\s+be\s+concluded|fails\s+to\s+establish|is\s+not\s+enough)\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

// ─── 腿③ NO_CONFOUND：已点名/已控制共同因素（正确动作，不判）──────────
const NO_CONFOUND_ZH = [
  /共同原因|共同因素|共同驱动|同一个原因|同一个因素|同一因素|同因|都源于|皆源于|同源于|均由|都由|背后是|背后有|根源相同|混杂|混淆变量|第三因素|第三变量|第三个变量|控制住|控制了|控制变量|控制后|剔除|扣掉|调整后|因果推断|因果识别|有向无环|辛普森|工具变量|倾向得分|断点回归|双重差分|固定效应|回归分析|协变量|调节效应|中介效应/,
];
const NO_CONFOUND_EN = [
  /\b(?:common\s+cause|common\s+factor|common\s+driver|shared\s+cause|shared\s+driver|confound\w*|third\s+variable|third\s+factor|lurking\s+variable|lurking|same\s+underlying|same\s+root|both(?:\s+are)?\s+driven\s+by|both(?:\s+are)?\s+stem\s+from|driven\s+by\s+the\s+same|controlling\s+for|control\s+for|controls\s+for|controlled\s+for|adjusted\s+for|after\s+adjusting|conditioning\s+on|held\s+constant|simpson|DAG|directed\s+acyclic|instrumental\s+variable|propensity|backdoor|causal\s+inference|causal\s+identification|regression\s+analysis|covariate)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿：共变词 × 因果动词双朝向共现；共变动词形另需并列双变量结构 */
function commonCauseZh(text, R) {
  const COVARY_REL = R.COVARY_REL_ZH || COVARY_REL_ZH;
  const COVARY_MOVE = R.COVARY_MOVE_ZH || COVARY_MOVE_ZH;
  const PAIR = R.PAIR_ZH || PAIR_ZH;
  const CAUSE = R.CAUSE_ZH || CAUSE_ZH;
  const all = COVARY_REL.concat(COVARY_MOVE);
  for (const re of all) {
    const isRel = COVARY_REL.indexOf(re) >= 0;
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const end = m.index + m[0].length;
      // 腿①：共变动词形要求前 40 字内有并列/指代双变量结构；
      // 相关名词形（相关/关联）必含双变量，免并列结构要求。
      if (!isRel) {
        const before = text.slice(Math.max(0, m.index - 40), m.index);
        if (!anyHit(PAIR, before)) { if (m.index === g.lastIndex) g.lastIndex++; continue; }
      }
      // 腿②：与共变词双朝向 60 字窗共现
      const after = text.slice(end, end + 60);
      const before60 = text.slice(Math.max(0, m.index - 60), m.index);
      if (anyHit(CAUSE, after) || anyHit(CAUSE, before60)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/** 英文腿：同结构，窗 100 字符（PAIR）× 120 字符（CAUSE 双朝向） */
function commonCauseEn(text, R) {
  const COVARY_REL = R.COVARY_REL_EN || COVARY_REL_EN;
  const COVARY_MOVE = R.COVARY_MOVE_EN || COVARY_MOVE_EN;
  const PAIR = R.PAIR_EN || PAIR_EN;
  const CAUSE = R.CAUSE_EN || CAUSE_EN;
  const all = COVARY_REL.concat(COVARY_MOVE);
  for (const re of all) {
    const isRel = COVARY_REL.indexOf(re) >= 0;
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const end = m.index + m[0].length;
      if (!isRel) {
        const before = text.slice(Math.max(0, m.index - 100), m.index);
        if (!anyHit(PAIR, before)) { if (m.index === g.lastIndex) g.lastIndex++; continue; }
      }
      const after = text.slice(end, end + 120);
      const before120 = text.slice(Math.max(0, m.index - 120), m.index);
      if (anyHit(CAUSE, after) || anyHit(CAUSE, before120)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCommonCause(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 已点名共同因素 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.NO_CONFOUND_ZH || NO_CONFOUND_ZH, text) || anyHit(R.NO_CONFOUND_EN || NO_CONFOUND_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? commonCauseZh(text, R) : commonCauseEn(text, R);
  if (!hit) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.6, count: 1,
    detail: isZh
      ? '共同原因谬误×共变直接当单向因果(zh)'
      : 'common cause fallacy×covariation-as-direct-causation(en)',
  };
}

module.exports = {
  checkCommonCause,
  __internals: () => ({
    COVARY_REL_ZH, COVARY_MOVE_ZH, PAIR_ZH, CAUSE_ZH,
    COVARY_REL_EN, COVARY_MOVE_EN, PAIR_EN, CAUSE_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    NO_CONFOUND_ZH, NO_CONFOUND_EN,
  }),
};
