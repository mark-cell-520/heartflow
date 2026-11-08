/**
 * src/money-illusion.js — 「货币错觉 / 名义-实际混用」检测器
 * （provisional 第 242 个判别维度，r254 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r254-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r253：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/
 * inverse_gamblers_fallacy/count_rate_conflation/significance_effect_size/
 * loss_aversion/selection_on_dependent_variable/self_selection_bias
 * 二十八个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * [r254 立项] 零命中探针 coordination/agent4/probes/r254-probe-round1.js
 * ~round2.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选两轮定夺：
 *   · A 过度控制偏差：攻击穿透仅 1/8——7/8 已被既有维度
 *     mediator_confusion 拦截（「控制了中介后效应消失」正是该维度的
 *     判据），不满足新维度零命中的前提，**淘汰**；
 *   · B 货币错觉：round1 穿透 5/8 → round2 扩样穿透 14/18，疑难良性
 *     维度级误伤 0（5/10 被 hold 的良性全部来自既有维度 perfect_error /
 *     unsupported_claim / monocausal_attribution，非本族判据），邻接
 *     领地（false_precision / statistical_misleading / 正确口径批评）
 *     全部穿透零重叠，**胜出**；
 *   · C 诉诸定义：穿透 8/18，且「按定义，通货膨胀就是货币贬值」式
 *     句子与 reasoning_coherence / absolute_claim 领地交叉过多；
 *   · D 相对-绝对风险混用：穿透 3/8，最弱（r249 已评估过同族）；
 *   · E 多重比较谬误：穿透 12/17 居次，但与既有维度
 *     researcher_degrees_of_freedom 领地重叠（探针中「试了各种切分
 *     方式」一条即被该维正确代拦），连续第三轮留 backlog。
 *
 * 外部来源：arXiv 三次查询（含引号精确查询「"money illusion"」命中
 * 2 篇真实文献：Optimal life insurance and annuity decision under
 * money illusion、Sensitivity analysis of an integrated climate-
 * economic model——均为经济学建模样板，非纯规则文本检测实现）；
 * 「"overcontrol bias"」「"appeal to definition"」arXiv 空返（0 条）；
 * GitHub repos total_count=0；Semantic Scholar 429 限流。**零纯规则
 * 文本检测实现**，按既有形态自建，判据为心虫自有纯规则实现，家族定义
 * 取自货币错觉的标准表述（money illusion, Fisher；Shafir/Diamond/
 * Tversky 1997 的实验心理学传统）：经济主体把**名义价值**（货币面额、
 * 现价数字）的变化误当成**实际价值**（购买力、实际福利）的变化，
 * 在物价同步变动时仍然按名义口径下福利结论。
 *
 * 辨别的族：货币错觉 / 名义-实际混用（money illusion / nominal-real
 * conflation）——文本先**陈述名义价值的变动**（工资/退休金/名义GDP/
 * 面值/利率数字的涨、升、创新高），再据此**导出实际福利结论**（更
 * 富裕、日子更好、待遇改善、实力增强），全程不做价格水平调整：
 *   工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了。
 *   名义GDP连年增长，这说明老百姓的日子越过越好了。
 *   存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏。
 *   老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了。
 *   Wages rose 5% while prices rose 8%, but people have more cash in
 *   hand, so they are better off.
 *   Nominal GDP keeps growing, which shows living standards are
 *   improving.
 *   The interest rate is 3% and inflation is 5%, but the interest
 *   payment is real money in the bank.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：价格水平是
 * 一把公共刻度——同一张百元钞在物价翻倍后只值半个原来的购买力。
 * 名义口径的变动与实际福利之间隔着一个除法，货币错觉就是跳过这个
 * 除法直接下结论。它比虚报数字更隐蔽：数字可以分文不假（工资确实
 * 涨了5%），结论可以完全错误（实际购买力在降）。现实危害很直接：
 * 工资谈判接受名义涨幅低于通胀的「胜利」；退休人员按名义额上调
 * 推算养老待遇改善；企业按现价营收扩张判定真实经营规模扩大；存户
 * 看到正利率数字忽略负实际利率而持续存款缩水。与正当推理的界线
 * 很清楚：一旦给出价格水平调整（扣除通胀/扣除价格因素/不变价/
 * 平减/adjusted for inflation）、明确指出这是货币错觉、或把结论
 * 限定在名义口径本身，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r254 归因，探针邻接领地实测穿透零重叠）：
 *   · false_precision（VERIFY 族）管**数字精度虚假**（「增长了
 *     15.37%，精确到小数点后两位」）；本族不涉精度——「工资涨了
 *     5%」的数字可以完全真实（邻接句实测穿透、归其家族）。
 *   · statistical_misleading 管**统计呈现手法**（口径平均制造
 *     平滑印象）；本族判据是名义变动 × 福利结论的双腿，不依赖呈现
 *     手法（邻接句实测穿透）。
 *   · pseudo_causal / perfect_error / unsupported_claim 管**伪
 *     因果、绝对化措辞、无依据断言**；本族判据是两条具体口径腿 +
 *     邻近共现，不依赖语气（探针中部分攻击句先被这些维度代拦，判
 *     定为代拦非漏判）。
 *   · percentage_overflow 管**百分比堆叠**；本族判据不要求百分比
 *     （「退休金从三千涨到四百」「face value doubled」均无百分比）。
 *   · base_rate_neglect 管**忽视先验基础比率**；本族判据是名义/
 *     实际口径混用，与先验概率无关。
 *
 * 判据（双腿链 + 邻近窗 + 两组豁免，缺一不判）：
 *   ① 腿① NOMINAL 名义价值变动陈述——四族任一（详见下方常量）：
 *     货币名词+涨变动词、从X涨到Y数字量级、名义/现价/面值/账面/
 *     数字+增长口径、利率-通胀数字对照；EN 对应四族；
 *   ② 腿② WELFARE 实际福利结论——五族任一（详见下方常量）：更
 *     富裕族、日子/生活改善族、福利名词+正向变动族、实力/规模扩张
 *     族、实打实到账/不亏族；EN 对应族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），**方向不限**——
 *     「工资涨了……大家更富裕了」与「大家更富裕了，因为工资涨了」
 *     都收；推断标记（所以/因此/可见/说明/证明/意味着；EN so/
 *     therefore/which shows）落在两腿之间则加权而非必要；
 *   ④ 腿②须带来新内容（左伸或右伸至少 2 字）——「收入提高」不能
 *     既当名义变动腿又当福利结论腿（防自证）；
 *   ⑤ 腿②带限幅守卫（提高有限/下降/反而/没那么好看/打折 → 失配）；
 *   ⑥ 两腿均查否定前缀（「这不能说明更富裕」→ 失配）；
 *   ⑦ 豁免 A 概念教学（货币错觉/价格因素/不变价/平减/实际口径/
 *     money illusion/adjusted for inflation/constant dollars——
 *     讨论这个概念本身是正确判别）；
 *   ⑧ 豁免 B 正确价格口径（扣除通胀/扣除价格因素/对照物价涨幅/
 *     折算/CPI；EN adjusted for inflation/inflation-adjusted/
 *     net of inflation/deflated/constant dollars——把名义换算成
 *     实际是正当做法）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次名义变动（「工资涨了
 * 5%」是事实陈述），也可能是在引用经济学案例。verify 的语义是「这
 * 段话用名义变动推出了实际福利结论，先按不变价口径重新框定，再
 * 决定是否采信它的结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（货币错觉告诉我们名义不等于实际/money illusion
 *     means nominal is not real）；
 *   · 正确价格口径（工资涨了5%，物价涨了8%，扣除通胀实际工资下降/
 *     adjusted for inflation the real gain was flat）；
 *   · 单腿句（只有名义变动无福利结论、只有「日子更踏实」无名义
 *     变动腿）；
 *   · 限幅对冲（实际购买力提高有限/real wages fell）；
 *   · false_precision / statistical_misleading / pseudo_causal /
 *     percentage_overflow / base_rate_neglect 领地。
 * 已知缺口（有意不收）：无显式福利结论的纯名义陈述（「债券按名义
 *     本金计息，票息固定到账」——缺腿②，与债券条款说明同形）；
 *     以及福利结论被包裹在反讽/引语中的句子。前者缺结论导出、后者
 *     需要语用判断，纯规则无法在不误伤的前提下收窄，宁缺勿滥。
 */
'use strict';

// ─── 腿① NOMINAL 名义价值变动陈述 ─────────────────────────────────
// N1 货币名词 + 涨变动词（工资/退休金/名义GDP/利率…涨、升、创新高）
const NOMINAL_NOUN_VERB_ZH = [
  /(?:工资|薪水|薪酬|收入|退休金|养老金|最低工资|补助|补贴|救济金|房租|租金|票息|利息|营收|税收|税额|票价|合同金额|名义额|奖金|津贴)[^。，！？；\n]{0,10}(?:涨|升|上调|增加|提高|创新高|变多|变厚)/,
  /(?:存款)?利率[^。，！？；\n]{0,10}(?:涨|升|上调|增加|提高)/,
];
// N2 从 X 涨/升到 Y 数字量级（三千→四百、一百万→一百二十万）
const NOMINAL_FROM_TO_ZH = [
  /从[一二三四五六七八九十百千万零两0-9]+[^。，！？；\n]{0,6}(?:涨|升|增|翻)到[一二三四五六七八九十百千万零两0-9]+/,
];
// N3 名义/现价/面值/账面/数字 + 增长口径
const NOMINAL_BASIS_ZH = [
  /(?:名义|现价|面值|账面|数字|按名义|以现价|按面值)[^。，！？；\n]{0,16}(?:增长|上涨|创新高|连年|上调|扩张|提高|增加|翻倍)/,
];
// N4 利率-通胀数字对照（利率3%…通胀5%）
const NOMINAL_RATE_GAP_ZH = [
  /(?:存款)?利率[^。！？；\n]{0,14}\d[^。！？；\n]{0,24}(?:通胀|通货膨胀)/,
  /(?:通胀|通货膨胀)[^。！？；\n]{0,14}\d[^。！？；\n]{0,24}(?:存款)?利率/,
];

const NOMINAL_NOUN_VERB_EN = [
  /\b(?:wages?|salaries|salary|pay|paycheck|income|pension|retirement|revenue|taxes?|ticket\s+prices?|rent|prices?)(?:\s+numbers?|\s+figures?|\s+levels?)?\s+(?:rose|risen|increased|climbed|grew|jumped|doubled|went\s+up|is\s+up|are\s+up|hit\s+record\w*)/i,
  /\b(?:interest\s+)?rates?\s+(?:rose|risen|increased|climbed|went\s+up)/i,
];
const NOMINAL_FROM_TO_EN = [
  /\bfrom\s+[\d,]+\s+to\s+[\d,]+\s+(?:dollars?|yuan|euros?|pounds?|yuan\s+a\s+month|per\s+(?:month|year))\b/i,
];
const NOMINAL_BASIS_EN = [
  /\b(?:nominal|face[-\s]value|in\s+nominal\s+terms|in\s+current\s+dollars?|on\s+paper)\b[^.]{0,30}\b(?:grow\w*|increas\w+|up|doubled|higher|risen|rose|record|climb\w*)/i,
  /\b(?:paycheck|salary|wages|income|pay|cash)\s+in\s+(?:dollars?|cash|nominal\s+terms|current\s+dollars?)\b/i,
];
const NOMINAL_RATE_GAP_EN = [
  /\b(?:interest\s+)?(?:rate|yield)\s+(?:is\s+|of\s+|at\s+)?\d+(?:\.\d+)?\s*%?[^.]{0,40}\binflation\b/i,
  /\binflation\s+(?:is\s+|of\s+|at\s+)?\d+(?:\.\d+)?\s*%?[^.]{0,40}\b(?:interest\s+)?(?:rate|yield)\b/i,
];

// ─── 腿② WELFARE 实际福利结论 ─────────────────────────────────────
// W_A 更富裕族
const WELFARE_RICH_ZH = [
  /(?:更|越发|越来越)(?:富裕|有钱|宽裕|滋润|好过|阔绰)/,
];
// W_A2 日子/生活改善族
const WELFARE_LIFE_ZH = [
  /(?:日子|生活|手头|腰包|光景)[^。，！？；\n]{0,6}(?:更|越发)?(?:踏实|宽裕|好过|滋润|舒服|改善|变好|有奔头|越过越好|越过越甜|越过越红火)/,
];
// W_B 福利名词 + 正向变动族（带限幅守卫）
const WELFARE_NOUN_VERB_ZH = [
  /(?:待遇|养老|退休待遇|收入|薪水|工资|购买力|财富|身家|福利)[^。，！？；\n]{0,8}(?:明显|显著|大幅|持续|稳步)?(?:改善|提高|增加|变好|好起来)/,
];
// W_C 实力/规模扩张族
const WELFARE_STRENGTH_ZH = [
  /(?:实力|规模|经营|业务|财政|盈利|利润)[^。，！？；\n]{0,8}(?:显著|明显|大幅|在|持续|稳步)?(?:增强|扩大|扩张|壮大|提升|增长|好转)/,
  /(?:公司|企业|生意|商家|店家|厂商)[^。，！？；\n]{0,6}(?:更|越发)?(?:赚钱|好做|红火|兴旺)/,
];
// W_D 实打实到账/不亏族
const WELFARE_CASH_ZH = [
  /(?:实打实|实实在在|真金白银)[^。，！？；\n]{0,10}(?:到账|入账|改善|提高|增长|变多|变厚|不亏)/,
  /(?:到账|入账)[^。，！？；\n]{0,6}(?:不亏|划算|值了|就是好|就是实在)/,
];

const WELFARE_EN = [
  /\b(?:better\s+off|well\s+off|wealthier|richer|doing\s+better|earning\s+more|earned\s+more|make\s+more\s+money|more\s+prosperous)\b/i,
  /\bliving\s+standards?\s+(?:are\s+)?(?:improv\w+|ris\w+|up|better)\b/i,
  /\bimprov\w+\s+(?:living\s+standards?|their\s+lives|our\s+lives|people'?s\s+lives)\b/i,
  /\b(?:booming|thriving|prospering)\b/i,
  /\b(?:standards?\s+of\s+living|quality\s+of\s+life)\s+(?:are\s+)?(?:improv\w+|ris\w+|up|better)\b/i,
  /\breal\s+money\s+in\s+the\s+(?:bank|hand|pocket)\b/i,
];

// ─── 独腿签名（SOLO）——一句话内部自带「名义口径 ≡ 实际福利」的完整
// 货币错觉结构，无需另找福利结论腿（同 r251 loss_aversion 先例）。
const SOLO_ZH = [
  // S1 涨工资就是改善生活（名义工资上升 ≡ 福利改善，融合句）
  /(?:涨|加|升)[^。，！？；\n]{0,4}(?:工资|薪水|薪酬|收入)[^。，！？；\n]{0,8}(?:就是|等于|意味着|说明)[^。，！？；\n]{0,6}(?:改善|提高|变好|富裕|进步)/,
  // S2 名义增长就是发展/富裕
  /(?:名义|账面|数字)[^。，！？；\n]{0,6}(?:增长|上涨|创新高|连年)[^。，！？；\n]{0,10}(?:就是|等于)[^。，！？；\n]{0,6}(?:富裕|富有|更有钱|发展|进步|成功|改善)/,
  // S3 工资数字涨了就是收入提高
  /(?:工资|收入)的?(?:数字|数额|面值)[^。，！？；\n]{0,8}(?:涨|升|增)[^。，！？；\n]{0,6}(?:就是|说明)[^。，！？；\n]{0,6}(?:收入|财富|富裕)[^。，！？；\n]{0,4}(?:提高|增加|增长|变多)/,
];
const SOLO_EN = [
  // E1 a nominal raise is a real improvement
  /\b(?:a\s+)?(?:nominal|face[-\s]value)\s+(?:raise|rise|increase|growth|gain)\s+(?:is|means|equals)\s+(?:a\s+)?real\s+(?:improvement|gain|raise|raise)\b/i,
  // E2 more dollars in hand means better off
  /\bmore\s+(?:dollars?|cash|money)\s+in\s+(?:hand|my\s+pocket|the\s+bank)\s+(?:means|is|equals)\s+(?:better\s+off|wealthier|richer|more\s+prosperous)\b/i,
];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|这就是说|足见|充分说明|充分证明|足以表明|足以证明|表明)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|which\s+shows|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 160;

// ─── 豁免 A：概念教学（点名货币错觉/价格口径这个概念本身）─────────
const CONCEPT_ZH = /(?:货币错觉|名义幻觉|价格幻觉|价格因素|价格水平|通货膨胀指数|通胀指数|不变价|平减|实际利率|实际收益|实际工资|实际增长|实际购买力|实际收入|实际价值|实际货币|购买力平价|通胀调整|费雪|实际与名义)/;
const CONCEPT_EN = /\b(?:money\s+illusion|nominal\s+vs\.?\s+real|real\s+vs\.?\s+nominal|inflation[-\s]adjusted|adjusted\s+for\s+inflation|after\s+adjusting\s+for\s+inflation|controlling\s+for\s+inflation|net\s+of\s+inflation|constant\s+dollars|constant\s+prices|real\s+wages?\s+fell|real\s+gain\s+was\s+flat|real\s+pay\s+was\s+flat|purchasing\s+power\s+(?:fell|dropped|declined|is\s+flat|shrank))\b/i;

// ─── 豁免 B：正确价格口径（把名义换算成实际是正当做法）─────────────
const CORRECTIVE_ZH = /(?:扣除通胀|扣除价格因素|扣除物价|按不变价|以不变价|折算|平减|对照物价|物价涨幅|CPI涨得|通胀调整|计入通胀|考虑通胀|按实际|以实际|价格因素|环比|同比实际|实际算下来|实打实算)/;
const CORRECTIVE_EN = /\b(?:adjusted\s+for\s+inflation|inflation[-\s]adjusted|after\s+adjusting\s+for\s+inflation|controlling\s+for\s+inflation|net\s+of\s+inflation|deflat\w+|constant\s+dollars?|purchasing\s+power\s+(?:fell|dropped|declined|is\s+flat|shrank)|in\s+real\s+terms\s+the\s+(?:gain|growth|increase)\s+was\s+(?:flat|zero|negative))\b/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非|不说明|不表明|并不能说明|并未说明|很难说|不见得)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上|不说明|不表明)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

// 腿②限幅守卫：正向变动后紧跟限幅/否定词 → 不是福利结论
const LIMIT_AFTER_ZH = /^(?:有限|下降|降低|减少|打折|没那么|几乎|反而|持平|没动|不多|受挫|堪忧|有限得很|幅度有限|空间有限|并不明显|得不明显|尚未|有待)/;

function matchAlive(text, x, useNeg, skipInside) {
  if (!useNeg) return true;
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 同跨度去重（跨族重叠留给配对循环的「防自证」判据处理）
function dedupeExact(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.idx + ':' + x.end;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, false)) m.push(x);
  }
  return dedupeExact(m);
}

// 福利结论腿专用：只查匹配点之前的否定前缀 + 限幅守卫，不查模式内部
// 否定词（腿②族自身含「不亏」等内在否定）。
function collectWelfare(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    const after = text.slice(x.end, x.end + 4);
    if (LIMIT_AFTER_ZH.test(after)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 独腿签名专用：只查前缀否定。
function collectSolo(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, true, true)) m.push(x);
  }
  return dedupeExact(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①名义变动陈述 × 腿②福利结论，两腿邻近共现
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      nominal: [
        ...(R.NOMINAL_NOUN_VERB_ZH || NOMINAL_NOUN_VERB_ZH),
        ...(R.NOMINAL_FROM_TO_ZH || NOMINAL_FROM_TO_ZH),
        ...(R.NOMINAL_BASIS_ZH || NOMINAL_BASIS_ZH),
        ...(R.NOMINAL_RATE_GAP_ZH || NOMINAL_RATE_GAP_ZH),
      ],
      welfare: [
        ...(R.WELFARE_RICH_ZH || WELFARE_RICH_ZH),
        ...(R.WELFARE_LIFE_ZH || WELFARE_LIFE_ZH),
        ...(R.WELFARE_NOUN_VERB_ZH || WELFARE_NOUN_VERB_ZH),
        ...(R.WELFARE_STRENGTH_ZH || WELFARE_STRENGTH_ZH),
        ...(R.WELFARE_CASH_ZH || WELFARE_CASH_ZH),
      ],
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      nominal: [
        ...(R.NOMINAL_NOUN_VERB_EN || NOMINAL_NOUN_VERB_EN),
        ...(R.NOMINAL_FROM_TO_EN || NOMINAL_FROM_TO_EN),
        ...(R.NOMINAL_BASIS_EN || NOMINAL_BASIS_EN),
        ...(R.NOMINAL_RATE_GAP_EN || NOMINAL_RATE_GAP_EN),
      ],
      welfare: R.WELFARE_EN || WELFARE_EN,
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：一句话内部自带完整货币错觉结构，单独成支
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN);
  for (const x of soloZh) sigs.push({ lang: 'zh', nominal: x.raw, welfare: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', nominal: x.raw, welfare: '', infer: '', solo: true });
  for (const L of langs) {
    const nominalM = collect(text, L.nominal, true);
    if (nominalM.length === 0) continue;
    const welfareM = collectWelfare(text, L.welfare);
    if (welfareM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const n of nominalM) {
      for (const v of welfareM) {
        if (dist(n, v) > L.w) continue;
        // 防自证：福利结论腿必须在名义变动腿之外**带来新内容**（左伸或
        // 右伸至少 2 字）——「收入提高」不能既当名义变动又当福利结论
        // （「数字上看我们收入提高了两成」里腿①腿②同跨度，是自证）；
        // 但「退休金从三千涨到四百……公司更赚钱了」的跨腿配对是真双腿。
        const newRight = v.end > n.end ? v.end - Math.max(v.idx, n.end) : 0;
        const newLeft = v.idx < n.idx ? Math.min(v.end, n.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= n.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= n.idx));
        sigs.push({ lang: L.lang, nominal: n.raw, welfare: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 名义腿原文 × 福利腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.nominal + '|' + s.welfare;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 货币错觉签名：名义价值变动陈述 × 实际福利结论 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectMoneyIllusion(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论货币错觉/价格口径这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确价格口径（把名义换算成实际是正当做法）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'money_illusion',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '名义变动「' + x.nominal + '」→ 福利结论「' + x.welfare + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : '')
      : 'nominal change "' + x.nominal + '" -> welfare conclusion "' + x.welfare + '"' + (x.infer ? ' (via "' + x.infer + '")' : ''))),
    details: s.lang === 'zh'
      ? '货币错觉(' + sigs.length + '处: 拿名义变动「' + s.nominal + '」直接推出实际福利「' + s.welfare + '」，缺价格水平调整口径)(zh)'
      : 'money-illusion(' + sigs.length + 'x: nominal change "' + s.nominal + '" read as real welfare "' + s.welfare + '")(en)',
    guidance: '货币错觉指把名义价值（货币面额、现价数字）的变动当成实际价值（购买力、实际福利）的变动——工资确实可以涨5%，但如果物价涨了8%，实际购买力是在下降的；名义GDP连年增长里可能含着价格水平的全部涨幅。名义口径与实际福利之间隔着一个除以价格水平的除法，跳过它直接下结论，数字再真实结论也是错的。请按不变价口径重新框定再下结论：给出扣除通胀/扣除价格因素后的实际变动、把名义额与实际购买力分列、对照CPI或平减指数折算、或明确说出这是货币错觉在起作用。若这段话只是客观陈述一次名义变动（工资涨了5%、退休金从三千涨到四千），请把结论限定在名义口径本身，不要外推到生活改善；若只是引用经济学案例或转述他人说法，核实其口径再决定是否采信。讨论货币错觉的概念、主动做价格水平调整、把名义和实际分开表述，都是正当做法。',
    tags: ['economics', 'money-illusion', 'nominal-vs-real', 'inflation', 'purchasing-power'],
  };
}

module.exports = {
  detectMoneyIllusion,
  __internals: () => ({
    NOMINAL_NOUN_VERB_ZH, NOMINAL_FROM_TO_ZH, NOMINAL_BASIS_ZH, NOMINAL_RATE_GAP_ZH,
    NOMINAL_NOUN_VERB_EN, NOMINAL_FROM_TO_EN, NOMINAL_BASIS_EN, NOMINAL_RATE_GAP_EN,
    WELFARE_RICH_ZH, WELFARE_LIFE_ZH, WELFARE_NOUN_VERB_ZH, WELFARE_STRENGTH_ZH, WELFARE_CASH_ZH,
    WELFARE_EN,
    SOLO_ZH, SOLO_EN,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
