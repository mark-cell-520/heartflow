/**
 * src/money-creation.js — 「存款创造贷款误解」检测器
 * （r376 新建：econ_reasoning_gate 聚合族第 32 子族 / 插件层第 37 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r376 立项探针（scripts/round-376/probe-r376-pool.js + probe-r376-scope.js，
 *   v6.8.190 pristine 基线）12 候选同池定拨：A lump_of_labor 穿透 3/5 但良性
 *   误伤 1/3（存量 reasoning_coherence/confidence）、B linear_tax_revenue 穿透
 *   4/8（4/8 被存量 pseudo_causal/perfect_error 代拦）、C money_creation 穿透
 *   8/10 且良性 8 条仅 1 条非 pass（存量 confidence 误伤，非本族增量）、
 *   D overdiagnosis 穿透 1/3、E attrition 0/3（存量代拦 2 + econ 已覆盖 1）、
 *   F spectrum 0/2（存量代拦 2）、G cantillon 穿透 6/8 良性 0 脏、H supply
 *   穿透 4/8（存量代拦 4）、I incorporation 1/2、J recall 1/2、K zero_risk
 *   1/2 且良性 2/2 脏、L scope 1/2 且良性脏——**money_creation 为「高穿透 ×
 *   良性边界最净 × 与既有维度射程不相邻」**，定拨落地。
 *   二段深探（probe-r376-scope.js）：攻击穿透 8/10 真零命中（存量维度零覆盖），
 *   良性经「可贷资金框架的理论讨论 + 贷款创造存款的纠正句」两组豁免后干净。
 *   海外扫描：arXiv parse-fail / GitHub repos 0 / S2 ?——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自货币银行学的标准论述：
 *   现代银行体系里，贷款并不先要有存款才能发放——放贷行为本身在借款人的
 *   账户上创造出新的存款（loan creates deposit）。银行的真实约束是资本充足
 *   率、监管要求与借款人信用，而不是既有存款的量。谬误在于把因果关系倒置：
 *   「银行放贷用的是储户的存款」「没有存款增长就没有贷款」「先把储蓄率提
 *   上去信贷自然充裕」「银行只是个中介，钱从左口袋倒到右口袋，不会变多」
 *   ——把货币创造说成货币搬移，进而推出储蓄不足就没有投资的钱、一个社会
 *   的钱就那么多这类总量固定的结论。
 *
 * 辨别的族：存款创造贷款误解（deposit-creation reversal / loans-come-from-
 *   deposits causal inversion）——文本同时给出两个信号：
 *   腿① CTX 存贷/信贷机制在场——贷款/放贷/借贷/贷出/贷到/信贷/存款/储蓄/
 *       储户/积蓄/投资；loans / lending / credit / deposits / savings；
 *   腿② SOURCE 倒置归源或约束断言在场——七种归源形与五种约束兑现形：
 *       · S1 归源形（放贷动用/用的是/来自 存款/储蓄/储户的钱）；
 *       · S2 来自形（贷款/信贷/投资的资金来自/来源于 存款/储蓄）；
 *       · S3 前提形（存款/储蓄是贷款/放贷/信贷的前提/来源/基础）；
 *       · S4 中介形（银行只是个中介/一头收存款一头放贷款）；
 *       · S5 先存形（只有先让大家多存钱，银行才有钱放贷，投资才能增长）；
 *       · S6 固定总量形（一个社会的钱就那么多/总量是固定的）；
 *       · S7 搬移形（钱从左口袋倒到右口袋/只是换了地方/左手倒右手）；
 *       · C1 无存无贷形（没有存款增长就没有贷款）；
 *       · C1B 不增不贷形（存款不增加，贷款就不可能增加）；
 *       · C2 不足形（储蓄不足经济就没有投资的钱）；
 *       · C3 取决于形（贷到多少款完全取决于存款/信贷规模由存款总量决定）；
 *       · C4 挤占形（把钱贷出去，别人能用的钱就少了）；
 *       · C5 才充裕形（把储蓄率提上去，信贷自然就充裕了）；
 *   两腿近距共现，缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 银行受资本充足率与监管约束（而非存款约束）是正确陈述——腿③归源形
 *     的间隙窗排除否定字符（「贷款并不严格受制于既有储蓄」的「并不」使
 *     C3 不匹配），「存款是银行负债而非放贷资金来源」由 CORRECT 豁免；
 *   · 可贷资金理论/贷款创造存款/货币创造的**理论讨论**（「可贷资金理论
 *     认为贷款来自储蓄，这一观点有争议」）由 CONCEPT 豁免——概念名 + 框架
 *     词共现，防前缀绕过（r368/r369/r371/r373/r375 同款教训）；
 *   · 纠正句（「放贷靠的不是储户的存款，而是贷款创造的存款」）由 CORRECT
 *     豁免；
 *   · 隔从句否定与对冲形（「这并不是说贷款来自存款」「……是一种误解」）
 *     由腿②紧前否定窗 + 对冲短语双守卫承担（r375 同款双守卫设计）。
 *
 * 与既有维度的边界（r376 归因，探针 + 边界实测）：
 *   · money_illusion（dim 234，r268 前既有）管「名义 × 实际」的个体感知
 *     错觉（存款利率 3% 通胀 5% 仍觉存钱不亏）——本族管存贷机制倒置；
 *     money_illusion 对探针攻击句实测零命中（8/10 穿透的句子无一条被
 *     money_illusion 覆盖），射程不重叠（r374 曾以「射程相邻」搁置
 *     money_creation，本轮二段深探证伪该顾虑：两族攻击集零交集）；
 *   · paradox_of_thrift（r369）管「个体节俭加总为总量向好」——本族管
 *     「存款决定贷款」的机制倒置，节俭-储蓄是腿② S3/S5 的语境而非结论；
 *   · government_household_analogy（r375）管主权财政类比家庭账本——本族
 *     管银行存贷机制，不含类比三腿形；
 *   · monocausal_attribution 在两条攻击样本（「银行只是个中介……」「企业
 *     能贷到多少款完全取决于存款」）上代拦，但 8/10 攻击真零命中证明存量
 *     维度整体零覆盖。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②双守卫，缺一不判）：
 *   ① 腿① CTX 存贷/信贷机制指称在场；
 *   ② 腿② SOURCE 倒置归源/约束断言在场（ZH 12 形 / EN 9 形，受紧前否定
 *     窗与对冲短语守卫）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 90 字 / EN 260 字符），方向不限；
 *   ④ 豁免 A 理论讨论（可贷资金/贷款创造存款/货币创造/MMT/loanable funds
 *      概念名 + 框架词共现）；
 *   ⑤ 豁免 B 纠正句（靠/用的不是存款而是创造的、贷款创造存款、结果而非）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个有争议的理论框架（「可贷
 * 资金理论认为贷款来自储蓄」——CONCEPT 豁免天然排除），命中的是把存贷因
 * 果倒置并直接兑现为约束结论的断言。verify 的语义是「这段文本把贷款说成
 * 动用存款、把信贷说成受存款约束，先把机制对齐（贷款创造存款、真实约束是
 * 资本与监管）再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 资本充足率/监管约束陈述（银行信贷受资本充足率和监管约束）；
 *   · 负债结构陈述（存款是银行负债而非放贷资金来源的约束）；
 *   · 理论讨论（可贷资金理论认为贷款来自储蓄，观点有争议）；
 *   · 纠正句（放贷靠的不是储户的存款，而是贷款创造的存款）；
 *   · 制度差异讨论（非银行融资或封闭经济模型下结论不同）；
 *   · 首付/个人储蓄陈述（只有先存够首付，才能贷款买房——腿②先存形须
 *     有银行/社会层主语，个人购房形天然排除）；
 *   · 否定/对冲形（这并不是说贷款来自存款——腿②紧前否定窗）。
 */

'use strict';

// ─── 腿① CTX 存贷/信贷机制在场 ─────────────────────────────
const CTX_ZH = /贷款|放贷|借贷|贷出|贷到|信贷|存款|储蓄|储户|积蓄|投资/;
const CTX_EN = /\b(?:loans?|lend(?:ing|s)?|lent|credit|borrow\w*|deposits?|savings?)\b/i;

// ─── 腿② SOURCE 倒置归源/约束断言在场 ─────────────────────────
// S1 归源形：放贷/贷款 + 动用/用/拿/靠 + 存款/储蓄/储户的钱。
const SOURCE_S1_ZH = /(?:放贷|贷款|贷出|借出|放出去|贷出去)(?:是)?(?:用|动用|挪用|占用|拿|靠)(?:的是|的)?[^。！？，；]{0,8}(?:存款|储蓄|储户|别人的钱|居民(?:的)?钱|大家(?:的)?钱)/;
// S2 来自形：贷款/信贷/投资的资金来自/来源于 存款/储蓄。
const SOURCE_S2_ZH = /(?:贷款|放贷|信贷|投资|借贷)(?:的)?(?:钱|资金)?(?:来自|来源于|出自|出自于|靠着|依赖)[^。！？，；]{0,6}(?:存款|储蓄|储户)/;
// S3 前提形：存款/储蓄是贷款/放贷/信贷的前提/来源/基础（结果/而非 前缀不判）。
const SOURCE_S3_ZH = /(?:存款|储蓄|积蓄|储户)(?:的)?(?:钱|资金)?(?:是|才算|才是|成为)[^。！？，；]{0,4}(?:贷款|放贷|借贷|信贷|投资)(?:的)?(?!结果|而非|基础之)(?:前提|来源|基础|条件|资金来源|保证)/;
// S4 中介形：银行只是个中介/一头收存款一头放贷款。
const SOURCE_S4_ZH = /(?:银行|金融机构|信用社|钱庄|放贷机构)(?:只)?(?:是个|是个|不过是|只是|仅仅是|无非是)[^。！？，；]{0,6}(?:中介|掮客|二传手|搬运工)|一头收(?:存款|储户)[^。！？]{0,10}一头放(?:贷款|贷)/;
// S5 先存形：只有先让大家多存钱，银行才有钱放贷（个人首付形不判）。
const SOURCE_S5_ZH = /(?:只有|唯有|先要|必须先|先得)[^。！？]{0,14}(?:存钱|储蓄|存款|攒钱|把钱存起来)[^。！？]{0,16}(?:银行|金融机构|经济|社会上|大家|居民|企业|投资人)[^。！？]{0,6}(?:才|方|就能|才能)[^。！？]{0,8}(?:放贷|贷款|投资|信贷|有钱贷)/;
// S6 固定总量形：一个社会的钱就那么多/总量是固定的（家庭层不判）。
const SOURCE_S6_ZH = /(?:一个|整个|全国|全社会)?(?:社会|国家|经济体|世界上?)(?:的)?钱(?:就)?(?:是)?那么(?:多|少)|(?:钱|货币|资金)(?:的)?总量(?:是)?(?:固定|一定|恒定)(?:的)?|(?:钞票|货币)(?:就)?那么(?:多|些)/;
// S7 搬移形：钱从左口袋倒到右口袋/只是换了地方。
const SOURCE_S7_ZH = /(?:钱|资金|货币)(?:只是|不过是|无非是)?(?:被)?(?:从)?(?:左|这个)?(?:边)?口袋(?:里)?(?:倒|挪|搬|转移)到(?:右|那个)?(?:边)?口袋|(?:钱|资金)(?:只是|不过是)?(?:换|挪|搬|转移)了(?:个)?(?:地方|位置|口袋|手)|左手(?:倒|腾|挪)右手/;
// C1 无存无贷形：没有存款增长就没有贷款。
const SOURCE_C1_ZH = /(?:没有|缺少|缺乏|若无|没|未见)[^。！？，；]{0,6}(?:存款|储蓄|积蓄)(?:的)?(?:增长|增加|流入|积累)?[^。！？，；]{0,8}(?:就)?(?:没有|无法|不能|无从|谈不上|不可能|难有)[^。！？，；]{0,8}(?:贷款|放贷|投资|信贷|钱)/;
// C1B 不增不贷形：存款不增加，贷款就不可能增加。
const SOURCE_C1B_ZH = /(?:存款|储蓄|积蓄)(?:不|未能|没能|无法)(?:增加|增长|上升|流入)[^。！？，；]{0,10}(?:贷款|放贷|信贷|投资)[^。！？，；]{0,8}(?:就)?(?:不可能|无法|不能|难以|没法)/;
// C2 不足形：储蓄不足经济就没有投资的钱。
const SOURCE_C2_ZH = /(?:储蓄|存款|积蓄)(?:不足|短缺|不够|不多|稀缺)[^。！？，；]{0,10}(?:就)?(?:没有|无法|不能|不可能|谈不上|难有)[^。！？，；]{0,6}(?:投资|贷款|放贷|信贷|钱)/;
// C3 取决于形：贷到多少款完全取决于存款/信贷规模由存款总量决定（间隙排除否定字符，
//   「贷款并不严格受制于既有储蓄」的「并不」使本形不匹配）。
const SOURCE_C3_ZH = /(?:贷款|放贷|信贷|借贷|投资|贷到|贷)[^。！？不并未难无缘无]{0,10}(?:取决于|由|受制于|受限于|要看)[^。！？不并未难无缘无]{0,10}(?:存款|储蓄|积蓄)/;
// C4 挤占形：把钱贷出去，别人能用的钱就少了。
const SOURCE_C4_ZH = /(?:贷出去|借出去|放出去|投出去|贷出)[^。！？]{0,12}(?:别人|他人|其他人|别的企业)[^。！？]{0,4}(?:能)?(?:用|可用|支配|拿到)(?:的)?钱[^。！？]{0,4}(?:少|变少|少了)|(?:占用|挤占|挤掉|分走|拿走)[^。！？]{0,8}(?:别人|他人|其他企业)(?:的)?(?:钱|资金|额度|机会)/;
// C5 才充裕形：把储蓄率提上去，信贷自然就充裕了。
const SOURCE_C5_ZH = /(?:把|将)?(?:储蓄率|存款|储蓄)(?:提上去|提起来|升上去|涨上去|增加)[^。！？]{0,12}(?:信贷|贷款|资金|钱)(?:才|就|自然)?(?:能)?(?:充裕|充足|宽松|宽裕)|(?:存款|储蓄)(?:增加|增长)了[^。！？]{0,10}(?:贷款|信贷)(?:自然)?(?:就)?(?:充裕|充足|多起来)/;

const SOURCE_ZH_GROUPS = [
  ['SOURCE_S1_ZH', [SOURCE_S1_ZH]],
  ['SOURCE_S2_ZH', [SOURCE_S2_ZH]],
  ['SOURCE_S3_ZH', [SOURCE_S3_ZH]],
  ['SOURCE_S4_ZH', [SOURCE_S4_ZH]],
  ['SOURCE_S5_ZH', [SOURCE_S5_ZH]],
  ['SOURCE_S6_ZH', [SOURCE_S6_ZH]],
  ['SOURCE_S7_ZH', [SOURCE_S7_ZH]],
  ['SOURCE_C1_ZH', [SOURCE_C1_ZH]],
  ['SOURCE_C1B_ZH', [SOURCE_C1B_ZH]],
  ['SOURCE_C2_ZH', [SOURCE_C2_ZH]],
  ['SOURCE_C3_ZH', [SOURCE_C3_ZH]],
  ['SOURCE_C4_ZH', [SOURCE_C4_ZH]],
  ['SOURCE_C5_ZH', [SOURCE_C5_ZH]],
];

// EN S1：banks lend out the deposits of their savers。
const SOURCE_S1_EN = /\b(?:banks?|lenders?|they|which)\s+(?:lend|loan|advance)\s+(?:out\s+)?(?:the\s+)?(?:deposits?|savings?|money)\s+(?:of|from|held\s+by)\b|\blend(?:s|ing)?\s+out\s+(?:their\s+)?(?:savers?|customers?|depositors?)[\u2018\u2019']?s?\s+(?:deposits?|savings?|money)\b/i;
// EN S2：loans are funded from savings。
const SOURCE_S2_EN = /\bloans?\s+(?:are\s+)?(?:made|funded|financed|created)\s+(?:from|out\s+of|with)\s+(?:existing\s+|prior\s+|pre-?existing\s+)?(?:deposits?|savings?)\b/i;
// EN S3：savings are the source of loans。
const SOURCE_S3_EN = /\b(?:deposits?|savings?)\s+(?:are|is)\s+(?:the\s+)?(?:source|origin|basis|prerequisite|precondition)\s+of\s+(?:loans?|lending|credit|investment)\b|\b(?:loans?|lending|credit)\s+(?:require|requires|depend(?:s)?\s+on|presuppos\w+)\s+(?:prior\s+|existing\s+|pre-?existing\s+)?(?:deposits?|savings?)\b/i;
// EN S4：banks are merely intermediaries / collect deposits and re-lend them。
const SOURCE_S4_EN = /\bbanks?\s+(?:are\s+)?(?:just\s+|merely\s+|only\s+)\s*(?:financial\s+)?intermediaries\b|\bcollect\w*\s+(?:deposits?|savings?)\s+and\s+(?:re-?lend|on-?lend|pass)\w*\s+(?:them|it)\s+(?:out\s+)?(?:as|into)\s+loans?\b/i;
// EN S5：only if people save first can banks lend。
const SOURCE_S5_EN = /\b(?:only\s+if|unless)\s+(?:people|households|savers|firms|businesses)\s+(?:save|deposit)\s+(?:more|first)\b[^.]{0,40}\b(?:can\s+)?(?:banks?|lenders?)\s+(?:lend|loan|extend)\b|\bsavings?\s+(?:must|has\s+to|needs?\s+to)\s+(?:rise|increase|come)\s+(?:first|before)\b[^.]{0,30}\b(?:lending|credit|loans?|investment)\b/i;
// EN S6：there is only so much money / the money supply is fixed。
const SOURCE_S6_EN = /\b(?:there\s+is\s+only\s+so\s+much\s+money|money\s+supply\s+is\s+fixed|total\s+(?:amount\s+of\s+)?money\s+(?:is|in\s+the\s+economy\s+is)\s+fixed|fixed\s+(?:amount|stock|supply)\s+of\s+money)\b/i;
// EN S7：money is just moved from one pocket to another。
const SOURCE_S7_EN = /\bmoney\s+(?:is\s+)?(?:just\s+|merely\s+|only\s+)?(?:moved|transferred|shifted|reallocated)\s+(?:from\s+one\s+)?(?:pocket|account|hand|person)\s+to\s+another\b|\bmoved\s+from\s+one\s+(?:pocket|account|hand)\s+to\s+another\b/i;
// EN C1：no new deposits means no new loans / no savings means no investment。
const SOURCE_C1_EN = /\bno\s+(?:new\s+)?(?:deposits?|savings?)\s+(?:means?|without)\s+no\s+(?:new\s+)?loans?\b|\bwithout\s+(?:new\s+|more\s+)?(?:deposits?|savings?)\s+(?:there\s+)?(?:can\s+be|are)\s+no\s+(?:new\s+)?(?:loans?|investment|lending)\b|\b(?:if|when)\s+(?:deposits?|savings?)\s+(?:do\s+not|don'?t)\s+(?:grow|increase|rise)\b[^.]{0,30}\bno\s+new\s+(?:loans?|lending|investment)\b/i;
// EN C2：insufficient savings leaves nothing to invest。
const SOURCE_C2_EN = /\b(?:insufficient|inadequate|lack\s+of|scarcity\s+of|limited)\s+(?:deposits?|savings?)\b[^.]{0,30}\b(?:nothing|no\s+funds?|no\s+money)\s+(?:to|left\s+to)\s+(?:invest|lend|loan)\b/i;
// EN C3：the amount banks can lend is strictly limited by the deposits they hold。
const SOURCE_C3_EN = /\b(?:amount|volume|total)\s+(?:of\s+)?(?:loans?|lending|credit\s+)?(?:banks?\s+|they\s+|a\s+bank\s+)?(?:can\s+)?(?:lend|make|extend|offer|create)\b[^.]{0,24}\b(?:is\s+|are\s+)?(?:strictly\s+|entirely\s+|only\s+|merely\s+|directly\s+)?(?:limited|determined|constrained|set|capped)\s+by\s+(?:the\s+)?(?:existing\s+)?(?:deposits?|savings?)\b|\bbanks?\s+can\s+(?:only\s+)?lend\s+(?:only\s+)?what\s+(?:they\s+)?(?:have\s+in\s+)?(?:deposits?|savings?)\b|\bcredit\s+(?:is\s+)?(?:strictly\s+|entirely\s+)?(?:limited|constrained|determined)\s+by\s+(?:the\s+)?(?:level\s+of\s+)?(?:deposits?|savings?)\b/i;
// EN C4：lending it out leaves less money for everyone else。
const SOURCE_C4_EN = /\b(?:lend|loan|put)\w*\s+it\s+out\b[^.]{0,24}\b(?:leaves?|means?)\s+(?:less|fewer)\b[^.]{0,20}\b(?:money|funds|credit)\s+(?:for|available\s+to)\s+(?:everyone\s+else|others|other\s+borrowers)\b/i;
// EN C5：raise the savings rate and credit will naturally be abundant。
const SOURCE_C5_EN = /\b(?:rais\w+|increas\w+|boost\w+)\s+(?:the\s+)?savings?\s+rate\b[^.]{0,24}\b(?:credit|lending|loanable\s+funds)\s+(?:will\s+)?(?:naturally\s+|automatically\s+)?(?:be\s+)?(?:abundant|plentiful|ample|sufficient)\b/i;

const SOURCE_EN_GROUPS = [
  ['SOURCE_S1_EN', [SOURCE_S1_EN]],
  ['SOURCE_S2_EN', [SOURCE_S2_EN]],
  ['SOURCE_S3_EN', [SOURCE_S3_EN]],
  ['SOURCE_S4_EN', [SOURCE_S4_EN]],
  ['SOURCE_S5_EN', [SOURCE_S5_EN]],
  ['SOURCE_S6_EN', [SOURCE_S6_EN]],
  ['SOURCE_S7_EN', [SOURCE_S7_EN]],
  ['SOURCE_C1_EN', [SOURCE_C1_EN]],
  ['SOURCE_C2_EN', [SOURCE_C2_EN]],
  ['SOURCE_C3_EN', [SOURCE_C3_EN]],
  ['SOURCE_C4_EN', [SOURCE_C4_EN]],
  ['SOURCE_C5_EN', [SOURCE_C5_EN]],
];

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const PAIR_ZH = 90;
const PAIR_EN = 260;

// ─── 豁免 A：理论讨论（概念名 + 框架词共现，防前缀绕过）──────────
const CONCEPT_ZH = /(?:可贷资金|贷款创造存款|存款创造|货币创造|货币银行学|现代货币理论|MMT)[^。！？\n]{0,20}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明)|(?:理论|框架|学说|观点|视角|模型)[^。！？\n]{0,20}(?:可贷资金|贷款创造存款|货币创造|现代货币理论)/;
const CONCEPT_EN = /\bloanable\s+funds\b|\bmodern\s+monetary\s+theory\b|\bMMT\b|\bmoney\s+creation\b[^.]{0,24}\b(?:theory|mechanism|framework|process|view|debate)\b/i;

// ─── 豁免 B：纠正句（靠/用的不是存款、贷款创造存款）──────────
const CORRECT_ZH = /(?:靠|用|动用|挪)(?:的)?(?:并)?(?:不|没)(?:是|靠|用)[^。！？]{0,6}(?:存款|储蓄|储户)|不是(?:靠|用|动用)[^。！？]{0,6}(?:存款|储蓄|储户)|贷款创造存款|存款是(?:放贷|贷款)的?结果|结果而非|负债而非|并非(?:来自|来源于|出自|动用|取决于)|先有贷款|创造了?新的?存款/;
const CORRECT_EN = /\b(?:do|does|did)\s+not\s+(?:lend|loan)\s+out\b|\bnot\s+(?:lend|loan)(?:ed)?\s+out\b|\bloans?\s+creat\w+\s+deposits?\b|\bdeposits?\s+(?:are|were)\s+creat\w+\s+by\s+(?:lending|loans?|banks?)\b|\bnot\s+(?:sourced|funded|financed|limited|constrained)\s+by\b|\bnot\s+(?:from|out\s+of)\s+(?:existing\s+)?(?:deposits?|savings?)\b|\bcreates?\s+(?:new\s+)?(?:money|deposits)\b/i;

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

// 腿②双守卫（r375 同款）：紧前否定窗（ZH 6 字 / EN 12 字符，含否定即对冲形，
//   「这并不是说贷款来自存款」）+ 对冲短语（腿②前后 20 字内出现
//   「不意味着/误解」类，「贷款来自存款是一种误解」）。只查腿②，防把腿①
//   正当否定误当腿②否定。两者均可负例注入。
const NEG_ZH = /(?:并不|并非|未|未必|不一|不|没|无|别)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|does\s+not\s+mean|doesn'?t\s+mean)/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
    const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 20), x.idx);
    const afterZh = text.slice(x.end, x.end + 20);
    const afterEn = text.slice(x.end, x.end + 40);
    for (const re of negZhList) { if (re && re.test && (re.test(beforeZh))) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
    for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
    for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
  }
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    let regs;
    if (Object.prototype.hasOwnProperty.call(R, name)) {
      const v = R[name];
      // 负例注入双契约：空数组 = 删条（整组消失）；永假正则 = 替换（该组退化
      // 为永不匹配）。两者都不得 crash——RegExp 不可 spread（r369 教训）。
      regs = Array.isArray(v) ? v : (v instanceof RegExp ? [v] : []);
    } else {
      regs = defs;
    }
    out.push(...regs);
  }
  return out;
}

// 签名收集：腿①存贷机制指称为锚（窗内），腿②倒置归源/约束断言在场。
// 两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      ctx: resolveGroups(R, [['CTX_ZH', [CTX_ZH]]]),
      source: resolveGroups(R, SOURCE_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      ctx: resolveGroups(R, [['CTX_EN', [CTX_EN]]]),
      source: resolveGroups(R, SOURCE_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const ctxM = collect(text, L.ctx);
    if (ctxM.length === 0) continue;
    // 腿②受双守卫（紧前否定窗 + 对冲短语）
    const sourceM = collect(text, L.source, { neg: true }, R);
    if (sourceM.length === 0) continue;
    for (const c of ctxM) {
      const s = sourceM.find(x => dist(x, c) <= L.win);
      if (!s) continue;
      sigs.push({ lang: L.lang, ctx: c.raw, source: s.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.ctx + '|' + s.source;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp。统一成数组供 exempt() 消费。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

/**
 * 存款创造贷款误解签名：存贷机制在场 × 倒置归源/约束断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectMoneyCreation(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：理论讨论（可贷资金框架/贷款创造存款机制本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（靠/用的不是存款而是创造的、贷款创造存款）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'money_creation',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '存贷机制「' + x.ctx + '」被倒置为「' + x.source + '」'
      : 'the deposit-loan mechanism "' + x.ctx + '" is reversed as "' + x.source + '"')),
    details: s.lang === 'zh'
      ? '存款创造贷款误解(' + sigs.length + '处: 「' + s.source + '」把贷款说成动用存款/储蓄、把信贷说成受存款约束，跳过贷款创造存款的机制)(zh)'
      : 'deposit-creation-reversal(' + sigs.length + 'x: "' + s.source + '" treats lending as moving existing deposits and credit as constrained by deposits, skipping that lending creates deposits)(en)',
    guidance: '存款创造贷款误解（deposit-creation reversal / loans-come-from-deposits inversion）：现代银行体系里，放贷行为本身在借款人账户上创造出新的存款（loan creates deposit），银行的真实约束是资本充足率、监管要求与借款人信用，而不是既有存款的量。谬误在于把因果关系倒置：「银行放贷用的是储户的存款，没有存款增长就没有贷款」「只有先让大家多存钱，银行才有钱放贷」「银行只是个中介，钱从左口袋倒到右口袋，不会变多」「储蓄不足，经济就没有投资的钱」——把货币创造说成货币搬移，进而推出总量固定、储蓄决定投资一类结论。可贷资金理论（loanable funds）把储蓄视为投资的资金来源，这是一种有争议的理论框架而非机制事实，作为理论讨论时须标明其争议性。正当做法是先把机制对齐：说明贷款创造存款（「放贷在借款人的账户上形成新存款」）、指出真实约束（「银行信贷受资本充足率和监管约束，而非存款约束」）、区分不同制度框架（「非银行融资或封闭经济模型下，存贷关系的讨论前提不同」）；银行作为金融中介的常规职能描述、存款的负债属性陈述、个人为首付而储蓄的陈述，不在本族射程。',
    tags: ['economics', 'monetary', 'banking', 'loan-creation', 'deposit-creation', 'causal-inversion'],
  };
}

module.exports = {
  detectMoneyCreation,
  __internals: () => ({
    CTX_ZH, CTX_EN,
    SOURCE_S1_ZH, SOURCE_S2_ZH, SOURCE_S3_ZH, SOURCE_S4_ZH, SOURCE_S5_ZH, SOURCE_S6_ZH, SOURCE_S7_ZH,
    SOURCE_C1_ZH, SOURCE_C1B_ZH, SOURCE_C2_ZH, SOURCE_C3_ZH, SOURCE_C4_ZH, SOURCE_C5_ZH,
    SOURCE_S1_EN, SOURCE_S2_EN, SOURCE_S3_EN, SOURCE_S4_EN, SOURCE_S5_EN, SOURCE_S6_EN, SOURCE_S7_EN,
    SOURCE_C1_EN, SOURCE_C2_EN, SOURCE_C3_EN, SOURCE_C4_EN, SOURCE_C5_EN,
    SOURCE_ZH_GROUPS, SOURCE_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
