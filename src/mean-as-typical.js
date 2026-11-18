/**
 * src/mean-as-typical.js — 「均值当典型值谬误（mean-as-typical fallacy）」检测器
 * （第 267 个判别维度）
 *
 * [r394 立项] 阶段1 三层外部搜索（HN Algolia / GitHub API）结果：谬误检测
 * 仓库几乎全为 LLM 驱动，不适配心虫纯规则形态；lucid-bias 为 rule-based
 * 但 README 拉取失败。转内部路径（阶段2b）：穿透探针
 * scripts/round-394/probe-candidates.js 实测 7 个候选族，本族（mean_as_typical）
 * 攻击 5/6 穿透零命中、良性 3/3 全干净；射程核查
 * scripts/round-394/probe-coverage.js 确认 ecological_fallacy(211) 腿②
 * 只收「每个/人人/任何/随便」个体指称、不收「大多数/大部分/多数」，
 * 是真缺口。decision 本体裁决 accelerate（philosophy_decision：
 * type=accelerate / confidence 0.7 / priority 40 / trigger
 * optimal_conditions / goalReviewed true；cognitiveLoad 与 uncertainty
 * 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：均值当典型值 / 分布误读（mean-as-typical / distribution
 * misreading）——拿**群体或样本的算术平均数**直接推出**「大多数个体」或
 * **「随便哪个个体」**处在该水平，忽略分布形状（右偏/长尾/两极分化）：
 *   人均收入达到了八万元，所以大多数人的年收入都在八万左右。
 *   班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。
 *   平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。
 *   平均房价是一万二，这说明随便一套房就是一万一二的价格。
 *   The average income is 80,000, so most people earn around 80,000.
 *   The class average was 85, so most students scored above 85.
 *
 * 与既有维度的边界（r394 归因）：
 *   · ecological_fallacy（第 211 维）管**群体层→个体层**的属性迁移
 *     （「这个区人均寿命长，所以张三也一定长寿」），其腿②只收
 *     「每个/人人/任何/随便」个体指称；本族要件是**平均数→多数/典型**
 *     的分布误读（「人均八万→大多数人在八万左右」），射程不重叠。
 *   · law_of_small_numbers（第 239 维）管**样本量不足**下的偶然波动；
 *     本族可出现在大样本真平均数上，错的是**用均值代表多数**，不是
 *     样本量。
 *   · statistical_misleading 管统计口径泛化误导；本族是具体的
 *     「平均数→大多数/典型个体」结构，判定锚在**平均量词×多数指称腿**
 *     共现。
 *   · count_rate_conflation（第 233 维）管绝对计数缺分母；本族分母
 *     在场（人均/平均），错在把均值当众数/中位数用。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① MEAN_STAT 平均数/均值统计量（中英）：人均 / 平均每 / 平均
 *     每户 / 平均房价 / 平均分 / 平均收入 / 平均值 / 平均数 / average /
 *     mean。**必须带「平均/人均」标记**——裸数字（「收入八万」）不是
 *     统计量陈述，不收。
 *   · 腿② TYPICAL_INDIVIDUAL 典型个体/多数指称（中英）：大多数人 /
 *     大部分 / 多数 / 绝大多数 / 八成人 / 七成人 / 多数家庭 / 普遍 /
 *     都（处在/考到/在…左右）/ 随便（一个/一套/哪） / 任何人 / most /
 *     majority / the average person / typical / most people。
 *   · 缺腿不判：只有平均数无多数指称（「人均收入八万，仍需努力」）是
 *     中性陈述；只有多数指称无平均数（「大多数人年收入在八万左右」）
 *     归 unsupported_claim。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的错误论证（教学中作为反例）、
 * 或作者自己正要指出均值≠典型值。verify 的含义是「这个从平均数推出的
 * 多数结论可能不成立，需要回到中位数/众数/分布形态再谈」——调用方应
 * 要求补上分布证据，而不是接受平均数直接得出的多数结论。
 *
 * 明确不判的（豁免）：
 *   · 分布纪律语言在场（中位数/众数/分布/长尾/右偏/两极分化/中位/
 *     median/mode/distribution/skew）：作者已在正确口径上讨论；
 *   · 平均数自身作为主语被质疑的元陈述（平均数会掩盖/平均数不代表/
 *     平均数不等于/均值≠/average hides/average doesn't represent）：
 *     那是在破除本谬误；
 *   · 平均数只用于描述且无个体层结论（仅陈述均值、不推出个体属性）。
 */

'use strict';

// ─── 腿① MEAN_STAT 平均数统计量（中文）────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态。「人均」「平均」本身
// 即统计量标记，不需后缀；同时收「平均值/平均数」显式名词形态。
const MEAN_ZH = [
  /人均(?:收入|GDP|gdp|可支配|住房|面积|支出|消费|产量|寿命|薪资|工资|纯收入)?/,
  /平均每(?:人|户|家|个|名|位|套|间|年|月|天|次|地|国|校|班|科)/,
  /平均(?:房价|收入|分|值|数|水平|工资|薪资|年薪|薪酬|月薪|待遇|寿命|年龄|身高|体重|成绩|销量|单价|时长|速率|速度|规模|支出|成本|学费|租金|利率|涨幅|增长率|通过率|分数|绩点)/,
  /(?:平均值|平均数|均值|均分|全班平均|全年级平均|全市平均|全国平均|全县平均)/,
  // 「每户平均」「每人平均」倒装形态
  /每(?:人|户|家|名|位|个|套|间)(?:的)?平均/,
];

// ─── 腿① MEAN_STAT 平均数统计量（英文）────────────────────────────
const MEAN_EN = [
  /\b(?:the\s+)?averag(?:e|ed|es)\s+(?:income|score|salary|wage|price|height|weight|age|life\s+expectancy|rent|cost|rate|value|number|household|family|person|people|student|home|house|gdp|spending|expenditure|consumption|output|yield)\b/i,
  /\b(?:income|score|salary|wage|price|height|weight|age|life\s+expectancy|rent|cost|value|spending|gdp)\s+averages?\s+(?:to|is|are|was|were|of|at)\b/i,
  /\b(?:on\s+)?(?:the\s+)?averag(?:e|ed)\b/i,
  /\bmean\s+(?:income|score|salary|wage|price|value|height|weight|age)\b/i,
  /\bper\s+capita\b/i,
];

// ─── 腿② TYPICAL_INDIVIDUAL 多数/典型个体指称（中文）────────────────
const TYPICAL_ZH = [
  // 多数指称（核心：大多数/大部分/多数/绝大多数 + 后续名词或直接谓语）
  /(?:大多数|大部分|多半|多数|绝大多数|绝多数|十之八九|八九成|七成|八成|九成|六成|五成)(?:人|家庭|户|学生|同学|百姓|老百姓|民众|居民|员工|家长|购房者|消费者|企业|公司|国家|城市|地区|孩子|老人|男人|女人|男人|女生|男生|从业者|用户|客户|患者|病例|房子|房源|产品|商品)?/,
  // 「普遍/普遍都」分布描述（动词承接：过上了/做到了/达到了/生活在/处于…）
  /普遍(?:都|是|在|达到|处于|有|超过|高于|低于|约|为|能|可以|过上|做到|实现|生活在|享受到|处于|反映|呈现|达到)/,
  // 「都在…左右/以上/以下」——多数处在该水平的等价表述
  /都(?:处在|处于|达到|考到|落在|维持在|保持在|稳定在|徘徊在|集中在|分布在|挤在)/,
  // 「随便（一个/一套/哪）」个体指称（含「拉出来/拉出/找出来/挑出来」等动态指称）
  /随便(?:一个|一套|一栋|一户|一家|一所|哪|哪个|多少|拉(?:出来|出)?|找(?:出来|出)?|挑(?:出来|出)?|问|说)/,
  // 「任何（一）个/人」个体指称
  /任何(?:一个|一家|一户|一套|一栋|一人|一名|一位)/,
  // 「人人/个个/大家（都）」群体指称
  /(?:人人|个个|大家|诸位)(?:都|均|皆)?/,
  // 「typical」类中文表述
  /典型(?:的)?(?:情况|水平|状态|个体|家庭|学生|用户|客户|案例|样本)/,
];

// ─── 腿② TYPICAL_INDIVIDUAL 多数/典型个体指称（英文）────────────────
const TYPICAL_EN = [
  /\bmost\s+(?:people|persons?|individuals?|families|households|students?|citizens?|residents?|employees?|workers?|consumers?|customers?|users?|patients?|cases?|homes?|houses?|countries?|cities|companies|businesses|children|adults|men|women|buyers?|sellers?|members)\b/i,
  /\bthe\s+(?:vast\s+)?majority\s+of\b/i,
  /\bmost\s+of\s+(?:the\s+)?(?:people|students?|families|households|customers?|users?|population|respondents?|participants?|cases?|households?)\b/i,
  /\b(?:the\s+)?(?:average|typical|ordinary|median|regular)\s+(?:person|people|individual|household|family|student|consumer|customer|user|worker|citizen|resident|employee)\b/i,
  /\bany\s+(?:given\s+)?(?:one|person|individual|household|family|student|home|house|case)\b/i,
  /\b(?:everyone|everybody|each\s+person)\s+(?:earns?|makes?|has|have|gets?|is|are)\b/i,
  // r395 补腿：「每期都是该均值」的均匀分布断言——mean-as-typical 的周期性变体。
  // 攻击样本：'Average rainfall is 500mm, which means it rains 500mm every month.'
  // / 'The average is 500 a day, so it happens 500 times each day.'
  // 纪律（防误伤）：JS 无后顾，故把「统计量/数值 + ... + 周期词」写进正则本体，
  // 要求周期词之前（同一分句内）确有统计量或数字。
  // 误伤对照（不命中）：'Every month we review the metrics...'（无统计量/数字在前）
  /\b(?:average|mean|median|per)\s+(?:of\s+)?[\d,.]+\s*(?:a|per|each|every)\s+(?:month|day|year|week|hour|quarter|season)\b/i,
  // 数字 + 可选单位（mm/k/%/times）+ 周期词：'it rains 500mm every month'
  /\b[\d,.]+\s*(?:[a-z]{1,6}\s+)?(?:times?\s+)?(?:a|per|each|every)\s+(?:month|day|year|week|hour|quarter|season)\b/i,
  /\btyp(?:ical|ically)\b/i,
];

// ─── 豁免一：分布纪律语言在场 ─────────────────────────────────────
const EXEMPT_DIST_ZH = [
  /中位数|中位值|众数|分布(?:形态|情况|曲线|形状)?|长尾|右偏|左偏|偏态|两极分化|分化严重|离散程度|方差|标准差|四分位|百分位|分位数|箱线图|直方图|峰值|离散度|不均匀|悬殊/,
  /收入差距|贫富差距|差距悬殊|两极|分化|不均衡|失衡/,
];
const EXEMPT_DIST_EN = [
  /\bmedian\b/i, /\bmode\b/i, /\bdistribution\b/i, /\bskew(?:ed|ness)?\b/i,
  /\b(?:long|fat|heavy)\s+tail\b/i, /\bvariance\b/i, /\bstandard\s+deviation\b/i,
  /\bpercentile\b/i, /\bquartile\b/i, /\bhistogram\b/i, /\bbimodal\b/i,
  /\b(?:income|wealth)\s+(?:inequality|gap|disparity)\b/i, /\buneven(?:ly)?\s+distributed\b/i,
];

// ─── 豁免二：元陈述破除本谬误 ─────────────────────────────────────
const EXEMPT_META_ZH = [
  /平均数(?:会|只|往往|常常|容)?(?:掩盖|掩盖了|不代表|不等于|不能代表|无法反映|反映不了|替代不了|不说明|说明不了|推不出)/,
  /(?:均值|平均值)(?:会|只|往往|常常)?(?:掩盖|不代表|不等于|不能代表|无法反映|替代不了|推不出)/,
  /平均数(?:与|和)?(?:大多数|典型|多数|个体)(?:不是|并非|不等于|未必是)/,
  /不能(?:用|拿)?平均数(?:代表|推断|推出|衡量)/,
  /平均数(?:具有|有)?(?:误导|误导性|欺骗性)/,
  /别看平均数|别只看平均数|平均数会骗人|平均数陷阱|平均数幻觉/,
];
const EXEMPT_META_EN = [
  /\baverages?\s+(?:can\s+)?(?:hide|hides|conceal|mask|mislead|misleads|distort|distorts|obscure)\b/i,
  /\baverages?\s+(?:don'?t|does\s+not|do\s+not)\s+(?:represent|reflect|tell|mean|capture)\b/i,
  /\baverages?\s+(?:are|is)\s+not\s+(?:the\s+same|equivalent)\s+as\b/i,
  /\bthe\s+averag(?:e|es)\s+(?:misrepresent|misrepresents|misleading)\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:use|rely\s+on|trust)\s+(?:the\s+)?averag(?:e|es)\b/i,
];

// ─── 豁免三：平均数仅描述、无个体层结论 ────────────────────────────
// 句中只有平均数陈述且结论落在均值自身/总量层（不落到个体）。
const EXEMPT_DESCRIPTIVE_ZH = [
  /(?:人均|平均|均值)(?:收入|GDP|gdp|住房|面积|支出|消费|产量|寿命|工资|薪资|分|值|数|水平|成绩|销量|单价|成本|房价)(?:仅|只)(?:为|是|有|达到|到|超)/,
  /(?:人均|平均|均值)(?:为|是|达到|提高到|提升到|增长到|上升到|下降到|降至)[^。，；]{0,10}(?:元|万|亿|千|百分点|%|％)/,
];
// 纯描述豁免（EN）——「平均工资是 X」如实陈述统计量。
// r395 修复：原规则在
// 「The average income is 80,000, so most people earn around 80,000.」上误杀
// （前半是描述、后半是推断）。纪律：单条正则的后瞻会被回溯绕过
// （实测：\\b 边界回溯后前瞻放行），故改为**函数级显式判定**：
// 描述短语之后若紧跟推论连接词（so/therefore/meaning/which means...），
// 说明这是「统计量→推断」的谬误句，不予豁免。
// 良性对照（仍应豁免）：'The average income is 80,000.' / 'Average rainfall was 500mm.'
// 攻击（应命中）：'The average income is 80,000, so most people earn around 80,000.'
const EXEMPT_DESCRIPTIVE_EN = [
  /\baverag(?:e|ed)\s+(?:income|score|salary|price|cost|value)\s+(?:is|was|are|were|stood\s+at|reached|came\s+in\s+at)\b/i,
];
// 推论连接词：描述短语之后出现即判定为「统计量→推断」结构，撤回纯描述豁免
const INFERENCE_CONNECTORS_EN = [
  /\b(?:so|therefore|thus|hence|meaning|suggesting|indicating|proving|showing|that\s+means)\b/i,
  /\bwhich\s+(?:means|suggests|implies|shows)\b/i,
  /\bmeans\s+that\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 统计某正则清单在文本中的总匹配次数（保留原 flags 并补 g，
// r249 教训：只传 'g' 会丢掉 i 标志导致漏统）
function countMatches(list, text) {
  let n = 0;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) n += m.length;
  }
  return n;
}

/**
 * 均值当典型值谬误检测
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMeanAsTypical(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const M_Z = R.MEAN_ZH || MEAN_ZH;
  const M_E = R.MEAN_EN || MEAN_EN;
  const T_Z = R.TYPICAL_ZH || TYPICAL_ZH;
  const T_E = R.TYPICAL_EN || TYPICAL_EN;
  const ED_Z = R.EXEMPT_DIST_ZH || EXEMPT_DIST_ZH;
  const ED_E = R.EXEMPT_DIST_EN || EXEMPT_DIST_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const DES_Z = R.EXEMPT_DESCRIPTIVE_ZH || EXEMPT_DESCRIPTIVE_ZH;
  const DES_E = R.EXEMPT_DESCRIPTIVE_EN || EXEMPT_DESCRIPTIVE_EN;

  // 分布纪律语言 / 元陈述 → 不是在犯本谬误
  if (anyHit(ED_Z, text) || anyHit(ED_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EM_Z, text) || anyHit(EM_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 纯描述豁免（EN）：只在描述短语之后**不紧跟推论连接词**时生效。
  // r395 修复：「The average income is 80,000, so most people earn around 80,000.」
  // 前半是描述、后半是推断——原样豁免会误杀。此处显式判定：
  // 描述短语命中 + 全文含推论连接词 → 判定为「统计量→推断」谬误句，不豁免。
  if (anyHit(DES_E, text) && !anyHit(INFERENCE_CONNECTORS_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(DES_Z, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿① 平均数统计量
  let meanCount = countMatches(M_Z, text) + countMatches(M_E, text);
  if (meanCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 多数/典型个体指称
  let typCount = countMatches(T_Z, text) + countMatches(T_E, text);
  if (typCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '均值当典型值×平均数→多数个体分布误读(zh)'
      : 'mean-as-typical×average→most-individuals distribution misreading(en)',
  };
}

module.exports = {
  checkMeanAsTypical,
  __internals: () => ({
    MEAN_ZH, MEAN_EN, TYPICAL_ZH, TYPICAL_EN,
    EXEMPT_DIST_ZH, EXEMPT_DIST_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_DESCRIPTIVE_ZH, EXEMPT_DESCRIPTIVE_EN,
  }),
};
