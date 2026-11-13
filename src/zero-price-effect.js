/**
 * src/zero-price-effect.js — 「零价格效应」检测器
 * （r313 新建第 254 个判别维度 zero_price_effect）
 *
 * 辨别的族：零价格效应（zero price effect）——**零价格信号**
 * （免费/不要钱/0元/白送/免单/free of charge/no cost/zero price）
 * 与**需求或价值判断失真**（蜂拥而至/不拿白不拿/抢购一空/失去
 * 判断力/ grabbed more than needed / demand jumped despite no value）
 * 两腿近距共现。零价格让需求跳升、且该跳升没有对应的价值依据
 * ——这正是零价格效应区别于「正当免费」的形状。
 *
 * 外部来源：本轮三层扫描（HN Algolia / Semantic Scholar / GitHub，
 * 原始证据 /tmp/hf-scout-1794536053.txt）无可集成的纯规则实现
 * （GitHub 最相关项 factcircuit 927 星但为 LLM 支撑的 Python
 * harness，违反零 LLM 依赖铁律；References 78 星为引用垃圾场
 * 无判别逻辑）。判据为心虫自有纯规则实现，家族定义取自行为
 * 经济学标准描述：Shampanier, Mazar & Ariely (2007) "Zero as
 * a Special Price: The True Value of Free Products", Marketing
 * Science——价格降到零时需求出现非线性跃升，人对免费物品的
 * 评估系统性地偏离其真实效用（免费糖果实验：需求从 15¢ 时的
 * 低水平跳到 0¢ 时的数倍，且零价格下人们转而按情感而非效用
 * 评估物品）。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：零价格效应
 * 是**价格信号失真**型偏误——「不要钱」被当成了「值得多拿」
 * 的理由，而价格为零恰恰意味着该信号不再携带成本信息。探针
 * 实证（coordination/agent4/probes/r313-probe.js，v6.8.178
 * 基线 gate() 全量 findings 实测）：10 个攻击变体 7 个真实穿透
 * （G6/G8/G10 被无关维度 confidence/monocausal_attribution/
 * false_urgency 代拦，其余 7 条 gate.action 恒 pass），8 个良性
 * 样本（公共卫生分发/开源社区/免费但说明价值/元话语批评零价格
 * 效应本身）零误命中。src/ 下没有任何维度判「零价格 × 非理性
 * 需求」这一结构：sunk_cost_coercion 管已投入成本绑架、statistical_
 * misleading 管统计表述失真、econ_reasoning_gate 17 族管概念误用
 * （其族单无零价格族），均不判价格为零诱发需求跃升这一形态。
 *
 * 与既有维度的边界（r313 归因）：
 *   · sunk_cost_coercion 管**沉没成本绑架**（已经投了所以必须
 *     继续）；本族判「零价格 → 需求/价值判断失真」，方向是
 *     「无成本诱发」而非「已投入绑架」。
 *   · statistical_misleading 管**统计表述失真**（比率/基数/
 *     百分比口径错误）；本族不涉统计口径，判价格信号失真。
 *   · false_urgency 管**虚假紧迫**（限时/最后一天催促行动）；
 *     本族判免费诱因，无时间压迫结构。
 *   · monocausal_attribution 管**单一因果过度归因**；本族判
 *     需求跃升归因于零价格而非价值，两腿共现才判。
 *
 * 判据（两腿近距共现，缺一不判）：
 *   ① 零价格信号——价格为零被显式点出（r313 腿①含裸名词
 *      形态：免费/白送/不要钱/不花钱/零元/0元/倒贴/免单/
 *      白给；EN free / no cost / zero price / for free /
 *      costs nothing / free of charge / on the house）；
 *   ② 需求或价值判断失真——因零价格而产生的非理性行为或价值
 *      错位（蜂拥而至/抢购一空/不拿白不拿/不薅白不薅/多拿/
 *      失去判断力/放着也是放着/不要钱为什么不；EN grabbed
 *      more than needed / snapped up / hoarded / stockpiled /
 *      everyone took it / no reason not to take it）；
 *   ③ 近距离窗（ZH 80 / EN 200），两腿均查否定前缀守卫
 *      （「不免费」「not free」不判；「免费并不能」豁免腿①）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次零价格实验或
 * 批评该现象（「零价格效应解释了免费物品为何被过度领取」正是
 * 本族要教的判别动作）、公共卫生/开源/赈灾语境下正当且必要的
 * 免费发放说明，rewrite/block 会误伤。verify 的语义是「这段
 * 文本把零价格当成了需求或价值的理由，先核实该需求跃升是否
 * 有效用依据、免费是否为策略性诱饵，再决定是否采信其判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（零价格效应/零价格特殊价格/Shampanier/Ariely/
 *     zero price effect——CONCEPT 豁免）；
 *   · 正当免费说明（公共卫生措施/疫苗接种/赈灾/开源社区/义务
 *     教育/公共服务免费提供，且无需求失真腿——CORRECTIVE 豁免）；
 *   · 有零价格无失真（免费但没人要/免费发放反映寥寥——缺失真
 *     腿即无本族）；
 *   · 有失真无零价格（限量发售引发抢购——价格信号存在，非本族）；
 *   · 否定/疑问形式（真的不要钱吗？/免费不免费另说——守卫排除）；
 *   · sunk_cost_coercion / statistical_misleading / false_urgency /
 *     monocausal_attribution 领地（见上边界）。
 */
'use strict';

// ─── 腿① 零价格信号：价格为零被显式点出 ─────────────────────────
// r313：含裸名词形态自查（161 轮教训：只收带后缀的形会漏裸形）。
// 「免费」「白送」本身即裸名词，直接命中；「0元/零元/不要钱/
// 不花钱/免单/白给/倒贴」为同族后缀变体，全部收录。
const ZERO_PRICE_ZH = [
  /(?:免费|不收费|不花钱|不要钱|无需付费|零元|0元|0\.00元|白送|白给|白拿|免单|免票|免学费|倒贴|赠送|无偿|公益发放|免费领|免费送|免费拿|免费拿)/,
  /(?:价格|价钱|售价|费用|成本)(?:是|为|降到|降到)?(?:零|0)/,
];
const ZERO_PRICE_EN = [
  /\b(?:free\s+of\s+charge|for\s+free|at\s+no\s+cost|no\s+cost|zero\s+price|priced\s+at\s+zero|price\s+of\s+zero|costs?\s+nothing|costs?\s+zero|on\s+the\s+house|given\s+away\s+for\s+free|handed\s+out\s+for\s+free|free\s+to\s+take|free\s+to\s+download|free\s+to\s+use|free\s+to\s+keep|free\s+shipping|no\s+charge)\b/i,
  /\b(?:it'?s|it\s+is|was|they'?re|everything\s+is)\s+free\b/i,
];

// ─── 腿② 需求或价值判断失真：因零价格产生的非理性行为/价值错位 ──
// r313：同族自查——「抢购」「蜂拥」为裸动词；「抢购一空/蜂拥而至/
// 不拿白不拿/不薅白不薅」为成语形；「多拿/囤/失去判断力」为行为
// 与认知失真形。EN 侧 grabbed / snapped up / hoarded / stockpiled /
// no reason not to take 全部为同族平行形。
const DISTORTION_ZH = [
  /(?:蜂拥而至|蜂拥|抢购一空|抢空|抢光|抢购|疯抢|一抢而空|闻风而至|趋之若鹜|扎堆|排长队|排起长队|连夜排队)/,
  /(?:不拿白不拿|不薅白不薅|不领白不领|不抢白不抢|白不拿|有便宜不占|便宜不占|不要钱为什么不|白送的干嘛不要|放着也是放着)/,
  /(?:多拿|多领|囤|囤积|囤货|扫货|搬空|全都拿走|能拿多少拿多少|拿得越多越好|领了一大堆|用不完还拿|用不上也拿|堆在家里吃灰|拿多少都(?:不心疼|不嫌多)|有多少拿多少|生怕(?:错过|吃亏))|(?:更|越)(?:疯狂|疯狂|踊跃|夸张|离谱|盲目)/,
  /(?:失去(?:判断|判断力|了判断力|了判断|理性|理智|分寸)|丧失(?:判断|判断力|理性|理智)|不顾(?:质量|品质|好坏)|不看(?:质量|品质|好坏|需不需要)|根本不看|完全不看|忘了(?:需不需要|要不要)|让人完全|令人完全)/,
  /(?:以为(?:免费|不要钱|白送)(?:就是|等于)?(?:好|值得|划算|占便宜)|觉得(?:免费|不要钱)(?:就是|等于)?(?:好|值得|划算))/,
];
const DISTORTION_EN = [
  /\b(?:grabbed|grabbing|snapped\s+up|snapping\s+up|hoarded|hoarding|stockpiled|stockpiling|swarmed|flocked|rushed\s+to\s+get|cleared\s+out|sold\s+out\s+in\s+minutes|queued\s+for\s+hours|lined\s+up\s+for\s+blocks)\b/i,
  /\b(?:no\s+reason\s+not\s+to\s+take|might\s+as\s+well\s+take|why\s+not\s+take\s+it|free\s+means\s+take\s+more|took\s+(?:far\s+|way\s+|much\s+|even\s+)?more\s+than\s+(?:they\s+)?(?:needed|could\s+use|necessary)|took\s+more\s+than\s+needed|more\s+than\s+(?:they\s+)?(?:needed|could\s+use))\b/i,
  /\b(?:demand\s+(?:jumped|jumped\s+up|surged|soared|spiked|shot\s+up)|demand\s+(?:jump|surge|soar|spike)|(?:jumped|surged|soared|spiked)\s+(?:sharply\s+)?(?:up\s+)?despite|even\s+though\s+(?:the\s+)?(?:item\s+)?(?:has\s+)?no\s+value|without\s+(?:any\s+)?(?:real\s+)?(?:value|utility|use))\b/i,
  /\b(?:stopped\s+(?:checking|looking\s+at|considering)\s+(?:the\s+)?(?:quality|value|whether\s+they\s+needed)|never\s+(?:checked|bothered\s+(?:to\s+)?check(?:ing)?)\s+(?:the\s+)?(?:quality|value|whether\s+they\s+needed)|ignored\s+(?:the\s+)?(?:quality|value|need)|lost\s+(?:all\s+)?(?:judgment|judgement|inhibition|restraint)|forgot\s+whether\s+they\s+(?:needed|wanted))\b/i,
  /\b(?:assumed|thought|figured)\s+(?:that\s+)?free\s+(?:means|meant|equals)\s+(?:good|worth\s+it|valuable|a\s+deal)\b/i,
];

// ─── 距离窗（零价格信号 × 需求/价值失真）───────────────────────
const PAIR_ZH = 80;
const PAIR_EN = 200;

// ─── 豁免：概念讨论（零价格效应/创始人/学科术语的教学定义句）──
const CONCEPT_ZH = /(?:零价格效应|零价格|免费效应|免费陷阱|价格为零|特殊价格|沙姆帕尼尔|阿瑞里|阿里利|行为经济学|价格心理学|非理性消费)/;
const CONCEPT_EN = /\bzero[- ]price\s+effect\b|\bzero\s+as\s+a\s+special\s+price\b|\bShampanier\b|\bMazar\b|\bAriely\b|\bfree\s+as\s+a\s+special\s+price\b|\bbehavioral\s+economics\b/i;

// ─── 豁免：正当免费说明（公共卫生/赈灾/开源/义务教育等语境）───
// 关键：这些是「免费+说明目的/价值依据」的正当形，无需求失真腿。
// 显式给出受益范围、公共属性、成本承担方的句子同样正当。
const CORRECTIVE_ZH = /(?:公共卫生|疫苗接种|疫苗|防疫|赈灾|救灾|扶贫|义务教育|公共服务|公益|慈善|捐赠|援建|免费发放(?:疫苗|药品|物资|口罩)|免费提供(?:服务|咨询|培训)|免费开放|免费入学|费用由(?:政府|财政|国家|基金会|企业)承担|成本由(?:政府|财政|国家|基金会)承担|免费是(?:为了|出于|旨在)|免费(?:发放|提供)的(?:目的|初衷|意义)|开源|社区共同维护|非盈利|非营利)/;
const CORRECTIVE_EN = /\b(?:public\s+health|vaccinat(?:e|ion|ing)|disaster\s+relief|humanitarian|charit(?:y|able)|philanthrop|open[- ]source|maintained\s+by\s+the\s+community|non-?profit|funded\s+by\s+(?:the\s+)?(?:government|taxpayers|foundation|donors)|free\s+to\s+(?:all|everyone)\s+(?:as\s+a|because)|provided\s+at\s+no\s+cost\s+(?:to|for)\s+(?:ensure|guarantee|make\s+it\s+accessible)|subsidized\s+by)\b/i;

// ─── 豁免：元话语批评（明确指出该偏误并要求纠正的正当陈述）───
// 「零价格效应让人失去判断力，我们要按效用而非价格评估」——
// 这是本族要教的判别动作本身，不判。
const CRITIC_ZH = /(?:零价格效应|免费陷阱|被免费|因免费|不要钱反而|免费反而|免费容不得|我们要警惕|需要警惕|应当警惕|应警惕|别被|不要被|按(?:效用|价值|需求)(?:而|来)?(?:评估|判断|决策)|而非(?:价格|是否免费))(?![\s\S]{0,12}(?:所以|因此)(?:蜂拥|抢购|多拿|不拿白不拿))/;
const CRITIC_EN = /\b(?:zero[- ]price\s+effect|free\s+(?:can|may|might)\s+(?:distort|skew|undermine)|we\s+should\s+(?:judge|evaluate|assess)\s+(?:by|on)\s+(?:utility|value|need)|based\s+on\s+utility\s+rather\s+than\s+(?:price|whether\s+it'?s\s+free)|beware\s+of\s+free|guard\s+against\s+the\s+lure\s+of\s+free)\b/i;

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

// 否定守卫：命中词本身被否定（「不免费」「并非免费」「not free」），
// 或紧邻的否定前缀（「并没有免费」「并不免费」）→ 不判。
const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|并非|不算|未必|不等于|不代表|从不|绝不|永不|打死不|死活不|坚决不|并没有|并未|不因|并不|根本没|压根没|一点都|压根|丝毫)/;
// r313：NEG_BEFORE 排除「不但/不仅/不只/不光/而且」这类递进连词——「不但
// 免费还倒贴」的「不」是连词首字而非否定词，r313 实测被守卫误杀（A9
// 变体整句漏判：lookbehind 拦不住句首连词，因「不」前无字可查）。
// 做法：先取命中词前 10 字窗口，若窗口内出现递进/转折连词，不判否定；
// 否则才在该窗口内找否定词。
const ADVERSATIVE_ZH = /(?:不但|不仅|不只|不光|况且|而且|并且|虽然说|虽说|固然|诚然)/;
function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 10), idx);
  if (ADVERSATIVE_ZH.test(before)) return false;
  return NEG_BEFORE_ZH_CORE.test(before);
}
const NEG_BEFORE_ZH_CORE = /(?:不|没|未|无|非|莫|甙|并非|并不|并未)[^。，！？；\n]{0,4}$/;
const NEG_BEFORE_ZH = NEG_BEFORE_ZH_CORE; // 兼容外部引用
const NEG_INSIDE_EN = /\bnot\s+free\b|\bnot\s+actually\s+free\b|\bno\s+longer\s+free\b|\bbarely\s+free\b|\bhardly\s+free\b|\bfar\s+from\s+free\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|never|isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|can'?t|cannot|neither|nor|hardly|barely)\s+(?:\w+\s+){0,3}$/i;

// r313 实测修复：B4「There was no reason not to take it — people swarmed
// the booth and cleared it out.」被 NEG_BEFORE_EN 误杀——「no reason not
// to take」是**肯定语气的惯用语**（不拿白不拿的对应形），句中 no...not
// 构成的是强调而非否定。做法：这些习语本身整串豁免守卫（同 r313 中文
// 侧 ADVERSATIVE_ZH 对「不但免费还倒贴」的处理思路——守卫拦的是语义
// 否定，不拦连词与惯用语）。
const IDIOM_EN = /\b(?:no\s+reason\s+not\s+to|might\s+as\s+well|why\s+not|may\s+as\s+well)\b/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (IDIOM_EN.test(x.raw)) return true;
  if (NEG_INSIDE_ZH.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  // 命中词前 45 字符窗内若含 IDIOM_EN 整串，同样豁免（腿①在腿②之后的语序）。
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (IDIOM_EN.test(beforeEn)) return true;
  if (negBeforeZh(text, x.idx)) return false;
  return !NEG_BEFORE_EN.test(beforeEn);
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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 两腿配对：零价格信号 × 需求/价值失真。要求：两腿在近距离窗内
// 共现，且不位置重叠（防止同一个词既当零价格又当失真，冒充结构）。
function findSignatures(text, R) {
  const sigs = [];
  const asList = v => (Array.isArray(v) ? v : (v ? [v] : []));
  const langs = [
    {
      price: R.ZERO_PRICE_ZH || ZERO_PRICE_ZH,
      dist: R.DISTORTION_ZH || DISTORTION_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      price: R.ZERO_PRICE_EN || ZERO_PRICE_EN,
      dist: R.DISTORTION_EN || DISTORTION_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // r313 实测补腿：B4「There was no reason not to take it — people
    // swarmed the booth and cleared it out.」腿①（价格为零的显式陈述）
    // 全文零命中——该样本的零价格信号是**惯用语形态**「no reason not
    // to take」（不拿白不拿的对应形），语义上等于「因为不要钱所以拿」。
    // 单列第三腿：FREE-IDIOM 惯用语信号 × 需求/价值失真腿。守卫由
    // matchAlive 的 IDIOM_EN 豁免负责（no...not 是强调不是否定）。
    {
      price: asList(R.IDIOM_EN || [IDIOM_EN]),
      dist: R.DISTORTION_EN || DISTORTION_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const priceM = collect(text, L.price, true);
    const distM = collect(text, L.dist, true);
    if (priceM.length === 0 || distM.length === 0) continue;
    for (const p of priceM) {
      const d = distM.find(x => dist(x, p) <= L.win);
      if (!d) continue;
      sigs.push({ lang: L.lang, price: p.raw, distortion: d.raw });
    }
  }
  return sigs;
}
/**
 * 零价格效应签名：零价格信号 × 需求/价值判断失真 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectZeroPriceEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（零价格效应/沙姆帕尼尔/阿瑞里教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：正当免费说明（公共卫生/赈灾/开源/义务教育，无需求失真腿）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：元话语批评（指出该偏误并要求按效用评估的正当陈述）
  if ((R.CRITIC_ZH || CRITIC_ZH).test(text) || (R.CRITIC_EN || CRITIC_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'zero_price_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '零价格「' + x.price + '」× 需求失真「' + x.distortion + '」'
      : 'zero price "' + x.price + '" x demand distortion "' + x.distortion + '"')),
    details: s.lang === 'zh'
      ? '零价格效应(' + sigs.length + '处: 价格为零「' + s.price + '」被当成了需求/价值的理由——「' + s.distortion + '」，价格信号为零时需求出现无效用依据的跃升)(zh)'
      : 'zero price effect(' + sigs.length + 'x: zero price "' + s.price + '" is treated as a reason for demand/value judgment — "' + s.distortion + '" — demand jumps without utility justification when price carries no cost information)(en)',
    guidance: '零价格效应指价格降到零时需求出现非线性跃升、人对免费物品的评估系统性偏离其真实效用（Shampanier/Mazar/Ariely 2007：价格为零不再携带成本信息，「不要钱」不等于「值得多拿」）——因为免费大家蜂拥而至哪怕毫无价值 / 白送的东西不拿白不拿 / 0元购让人失去判断力 / 不要钱为什么不拿 / it was free so everyone grabbed more than they needed / the zero price made demand jump even though the item has no value / since it cost nothing they stopped checking the quality。请补上论证：评估物品应看效用与真实需求，而不是价格是否为零；如果免费是公共卫生、赈灾、开源等正当安排，明确其目的与成本承担方；如果这段话只是转述或批评零价格效应本身，则无需按本维度处理。',
    tags: ['economics', 'behavioral-economics', 'zero-price-effect', 'cognitive-bias', 'judgment-and-decision-making', 'pricing'],
  };
}

module.exports = {
  detectZeroPriceEffect,
  __internals: () => ({
    ZERO_PRICE_ZH, ZERO_PRICE_EN,
    DISTORTION_ZH, DISTORTION_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    CRITIC_ZH, CRITIC_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
