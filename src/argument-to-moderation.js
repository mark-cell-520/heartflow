/**
 * src/argument-to-moderation.js — 「诉诸中庸（argument to moderation /
 * 中间立场谬误）」检测器
 * （第 194 个判别维度）
 *
 * [r196 立项] decision 本体在当前引擎（v6.8.124，193 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究：HN Algolia "logical fallacy
 * detection" 命中 arXiv 2405.02318「Translating natural language to
 * first-order logic for logical fallacy detection」（pts=258，comments=143，
 * https://arxiv.org/abs/2405.02318）——谬误检测是 NLP 公认任务族；GitHub
 * "fallacy detection" 按星标前列 latent-variable/Real_time_fallacy_detection
 * ★120（LLM 实时转写方案，依赖 LLM，心虫不可用）、tmakesense/logical-fallacy
 * ★21（在线工具无判据代码）、panFJCharlotte98/Fallacy_Detection ★5
 * （EMNLP 2024 LLM zero-shot 分类器）——全部依赖 LLM 或仅有分类器框架，
 * 无可复用的纯规则判据；Semantic Scholar HTTP 429 空返，如实记录。
 * 引擎差距实测：grep -rniE 'moderation|中庸|中间立场' src/ 仅命中古籍名词
 * （《中庸》书名）与 content moderation 一词——193 维无一覆盖
 * 「折中立场被直接当成真理」这一族。
 *
 * 辨别的族：诉诸中庸——把两个立场（或指控与辩护）并置后，断言
 * **「真相/正确答案在中间」「各打五十大板」「折中才是对的」「一个巴掌
 * 拍不响」**，用「取中」这个动作本身替代对双方证据的检验。中间立场偶尔
 * 确实更接近真相，但那要凭证据成立，不能凭「它在中间」成立：
 *   甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。
 *   这两种观点都太极端了，正确的答案在它们中间。
 *   公说公有理婆说婆有理，其实折中才是对的。
 *   关于这项政策该不该继续，支持和反对的人都走了极端，中间立场才是理性的。
 *   Both extremes are wrong, so the truth lies somewhere in the middle.
 *   Let's just split the difference — the middle ground is the correct answer.
 *   When two sides clash, the fairest position is usually the one in between.
 *
 * 与既有维度的边界（r196 归因）：
 *   · false_balance 管**等权并置**（「两种说法/各有道理」把未证实指控
 *     并列到已证事实旁），本族不停留在并置——而是进一步断言**中间立场
 *     才是正确的**，两者互斥：false_balance 说「一样重」，本族说「中间对」；
 *   · false_dilemma 管**排除第三选项的二元压迫**（「要么A要么B，没有
 *     中间路线」），本族恰恰相反——承认两端存在，但把**中间**封为真理，
 *     不逼人选边；
 *   · false_equivalence 管两类事物的错误类比，本族不引入类比对象；
 *   · sole_narrative 管口径垄断（只许一种说法），本族的主张是「只有
 *     中间那种说法对」；
 *   · monocause 管多因压成单因，本族不断言原因数量，反对的是**以位置
 *     取信**而非以证据取信。
 *
 * 判据（两腿共现 + 叙事窗，缺一不判）：
 *   腿① MIDDLE 中间/折中立场表述（中文，裸名词形态）：
 *     中间(立场|地带|道路|路线|选项|方案)/真相·答案·结论(就)在(两者|
 *     两个|双方|它们)(之间|中间)/折中/中庸/各打五十大板/一个巴掌拍不响/
 *     双方·两边(都)(有错|有过错|不对|有问题|有责任)/(都|全)(太|过于)极端|
 *     走了极端|两个极端|各让一步|各退一步/取(个)中间；
 *     EN middle ground / in between / split the difference / meet in the
 *     middle / halfway / compromise (position|stance|view|answer|solution)/
 *     both extremes / the middle (position|course|path|road|way|option)；
 *   腿② TRUTH 中间=正确 的断言（中文）：
 *     才是(对|正确|真理|真相|正解|正道|理性|清醒|客观|公道|合理|最优|
 *     最好|答案|出路)/(中间|折中|中庸)(立场|方案|道路)?才是X/(都|全)不
 *     (完全)?(对|错)|都不全对/把(中间|折中|中庸)(立场|方案)当成(真理|
 *     真相|正确|正解)/(最|才)(公平|公正|合理|正确)的(处理|解决|做法|
 *     方案|结果|答案|方式)/才是[^。；，]{0,8}(公平|公道|合理|正确)/
 *     (正确|真正|对)的(答案|结论|真相|立场|做法|解法)(就)在；
 *     EN is (the) (correct|right|true|rational|sane|fair|fairest|
 *     reasonable|best) answer/position/conclusion/view/solution / truth
 *     lies in the middle / both sides are wrong / neither side is entirely
 *     right / middle ground is the (correct|fairest|rational) / the
 *     (fairest|correct|best) position is (the one) in between；
 *   两腿命中位置相距 ≤50 字（EN ≤200 字符）即算同一叙事。
 *
 * 为什么取 VERIFY 级：中间立场是否更接近真相取决于证据分布，规则引擎
 * 无法独立判定「这次折中是否正确」，只能识别「以位置取信」的推断形态。
 * verify 的含义是「先检验双方证据再采信」：调用方应要求列出两端各自的
 * 证据强度、说明为什么折中结论比任一端更成立，而不是把「取中」本身
 * 当成结论的依据。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（诉诸中庸/argument to moderation/中庸之道/儒家/
 *     亚里士多德/逻辑谬误/教材/论文）——讨论这个概念本身是正确判别；
 *   · 谈判/交易/和解语境（谈判/协商/和解/调解/协议/签约/签署/成交/
 *     报价/让步/调解员；EN negotiated / deal / signed / contract /
 *     settlement / mediation / agreement）——博弈中「各让一步」是关于
 *     成交的程序动作，不是真理断言；
 *   · 算术/统计取中（平均值/均值/中位数/中间值/取平均；EN average /
 *     median / midpoint）——取中位数是正当计算；
 *   · 推理否定/反向承认（并不总是/不等于/并不意味着/未必/不一定/推不出/
 *     不见得/不是都对也都错/是谬误；EN does not mean / not automatically /
 *     not necessarily / is not correct）——拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/似乎/好像/说不定；EN maybe / perhaps /
 *     might / probably / seems）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */

'use strict';

// ─── 腿① MIDDLE 中间/折中立场表述（中文，裸名词形态）──────────────────
// r161 教训自查：「中间立场」「折中」「各打五十大板」为裸名词形态，
// 去掉任何修饰（「那条中间道路」「所谓的折中」）仍以原词命中；
// 「取中间」收受限形，不收「中间」裸词（「中间价/中间值」是算术语境）。
const MIDDLE_ZH = [
  /中间(?:立场|地带|道路|路线|选项|方案|派|力量)/,
  /(?:真相|真理|事实|答案|结论|说法|立场|做法|解法|选择|正解|公道)(?:的)?(?:所在)?(?:就)?在(?:两者|两个|双方|两极|两端|它们|其|对立|争论)?(?:之间|中间)/,
  /折中/,
  /中庸/,
  /各打五十大板/,
  /一个巴掌拍不响/,
  /(?:双方|两边|两方|两家|彼此)(?:都|各自|全|其实|确实|纷纷)?(?:有错|有过错|有错处|不对|有问题|有责任|有毛病)/,
  /(?:都|全)(?:太|过于|很|有些|挺)?极端|走了极端|两个极端|各走极端|极端化/,
  /各让一步|各退一步|各让半分|彼此让步/,
  /取(?:个)?中间|往中间|往折中(?:走|靠)/,
];

// ─── 腿② TRUTH 中间=正确（中文）──────────────────────────────────────
const TRUTH_ZH = [
  /才是[^。；，]{0,8}(?:对|正确|真理|真相|正解|正道|理性|清醒|客观|公道|合理|最优|最好|出路|公平|公正)(?:的)?/,
  /(?:中间|折中|中庸)(?:立场|方案|道路|路线|观点)?(?:才)?是(?:对|正确|真理|真相|正解|正道|理性|清醒|客观|公道|合理|最优|最好)(?:的)?/,
  /(?:都|全)(?:不|没)(?:完全)?(?:对|错)|都不全对|谁也没有完全(?:对|错)|没有一方(?:是)?(?:完全)?(?:对|错)/,
  /(?:把|将|拿)(?:中间|折中|中庸)(?:立场|方案|观点|结论)?(?:当成|看作|视为|说成|当作)(?:真理|真相|正确|对的|正解|正道)/,
  /(?:最|才)(?:公平|公正|合理|正确)的(?:处理|解决|做法|方案|结果|答案|方式)/,
  /(?:两|双)边(?:都|全)(?:错|不对)/,
  /(?:正确|真正|对)的(?:答案|结论|真相|真理|立场|做法|解法|选择|说法)(?:就)?在/,
];

// ─── 英文侧腿① ────────────────────────────────────────────────────────
const MIDDLE_EN = [
  /\bmiddle[- ]ground\b/i,
  /\bin[- ]between\b/i,
  /\bsplit(?:ting)? the difference\b/i,
  /\bmeet in the middle\b/i,
  /\bhalfway\b/i,
  /\bcompromise (?:position|stance|view|answer|solution)\b/i,
  /\bboth extremes?\b/i,
  /\bthe middle (?:position|course|path|road|way|option|answer|view)\b/i,
];

// ─── 英文侧腿② ────────────────────────────────────────────────────────
const TRUTH_EN = [
  /\b(?:is|are) (?:usually |often |always |simply |just )?(?:the )?(?:only )?(?:correct|right|true|truth|rational|sane|fair|fairest|reasonable|best|real) (?:answer|position|conclusion|view|stance|solution|course)\b/i,
  /\btruth (?:lies|is|often lies|usually lies|always lies) (?:somewhere |right )?in (?:the )?(?:middle|in[- ]between)\b/i,
  /\bboth (?:sides|extremes?|parties) are (?:wrong|mistaken|at fault|equally|partly)\b/i,
  /\bneither (?:side|party|one) is (?:entirely|completely|fully|totally) (?:right|wrong)\b/i,
  /\bmiddle (?:ground|position|course|way) is (?:usually |often |always )?(?:the )?(?:correct|right|true|best|fairest|rational|sane|fair|reasonable)\b/i,
  /\b(?:fairest|fair|correct|right|best|most rational|most reasonable|only rational|only fair|only correct|only right) (?:\w{3,15} )?(?:position|answer|stance|view|conclusion|course) is (?:usually |often |always )?(?:the )?(?:one )?(?:in[- ]between|in the middle|middle|halfway|compromise|between the (?:two|both) extremes)\b/i,
  /\bsplitting the difference is (?:the )?(?:correct|right|fair|rational|sensible)\b/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /诉诸中庸|中间立场谬误|中庸之道|儒家|论语|亚里士多德|逻辑谬误|谬误清单|折中主义/,
  /教材|课堂|论文|教案|教科书|科普/,
];
const EXEMPT_META_EN = [
  /\bargument to moderation\b/i,
  /\bmiddle[- ]ground fallacy\b|\bfalse (?:middle|balance|compromise)\b/i,
  /\bAristotle\b|\bdoctrine of the mean\b/i,
  /\bfallac(?:y|ies)\b/i,
  /\btextbook\b|\blecture\b|\bphilosophy class\b/i,
];

// ─── 豁免二：谈判/交易/和解语境 ───────────────────────────────────────
const EXEMPT_DEAL_ZH = [
  /谈判|协商|和解|调解|协议|签约|签署|成交|报价|还价|让步|调解员|签下|缔约|买卖合同|合同|磋商/,
];
const EXEMPT_DEAL_EN = [
  /\bnegotiat\w*/i,
  /\bdeal\b|\bsigned\b|\bcontract\b|\bsettlement\b|\bmediat\w*\b|\bagreement\b|\b bargain(?:ed|ing)?\b/i,
];

// ─── 豁免三：算术/统计取中 ────────────────────────────────────────────
const EXEMPT_AVG_ZH = [
  /平均值|均值|中位数|中间值|中间价|取平均|算术平均/,
];
const EXEMPT_AVG_EN = [
  /\baverage\b|\bmedian\b|\bmidpoint\b/i,
];

// ─── 豁免四：推理否定 / 反向承认 ──────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /并不总是|并不等于|不等于|并不意味着|未必|不一定|不能说明|推不出|不见得|不能证明|绝不是|绝非/,
  /不是(?:都|全)(?:对|错)|就是谬误|是谬误|的逻辑错误/,
];
const EXEMPT_NEG_EN = [
  /\bdoes not mean\b|\bdoesn'?t mean\b/i,
  /\bnot (?:automatically|necessarily|always)\b/i,
  /\bis not (?:automatically|necessarily|always)?\s*(?:correct|right|true|the answer)\b/i,
  /\bnot necessarily\b|\bneither is\b/i,
];

// ─── 豁免五：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|有待|待验证/,
];
const EXEMPT_HEDGE_EN = [
  /\bmaybe\b|\bperhaps\b|\bmight\b|\bpossibly\b|\bprobably\b|\bseems?\b|\bappears?\b|\bsometimes\b|\bmay\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 source 列表中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/**
 * 两腿 + 叙事窗：存在 m∈MIDDLE, t∈TRUTH 使 |m-t|≤win。
 */
function legsZh(text, R) {
  const mid = positions(R.MIDDLE_ZH || MIDDLE_ZH, text);
  const tru = positions(R.TRUTH_ZH || TRUTH_ZH, text);
  if (mid.length === 0 || tru.length === 0) return false;
  const WIN = 50;
  for (const m of mid) {
    for (const t of tru) {
      if (Math.abs(m - t) <= WIN) return true;
    }
  }
  return false;
}

function legsEn(text, R) {
  const mid = positions(R.MIDDLE_EN || MIDDLE_EN, text);
  const tru = positions(R.TRUTH_EN || TRUTH_EN, text);
  if (mid.length === 0 || tru.length === 0) return false;
  const WIN = 200;
  for (const m of mid) {
    for (const t of tru) {
      if (Math.abs(m - t) <= WIN) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkArgumentToModeration(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：疑问句 / 概念教学 / 谈判交易 / 算术取中 / 推理否定 / 对冲
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_DEAL_ZH || EXEMPT_DEAL_ZH, text) || anyHit(R.EXEMPT_DEAL_EN || EXEMPT_DEAL_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_AVG_ZH || EXEMPT_AVG_ZH, text) || anyHit(R.EXEMPT_AVG_EN || EXEMPT_AVG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? legsZh(text, R) : legsEn(text, R);
  if (!hit) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：基础 0.62 + 俗语形（各打五十大板/一个巴掌拍不响/split the
  // difference）+0.06 + 显式中间=正确断言 +0.04，封顶 0.85
  let score = 0.62;
  if (/各打五十大板|一个巴掌拍不响/.test(text) || /\bsplit(?:ting)? the difference\b/i.test(text)) score += 0.06;
  if (anyHit(R.TRUTH_ZH || TRUTH_ZH, text) || anyHit(R.TRUTH_EN || TRUTH_EN, text)) score += 0.04;
  if (score > 0.85) score = 0.85;

  return {
    hit: true, score, count: 1,
    detail: isZh
      ? '诉诸中庸×折中立场被直接当成真理(zh)'
      : 'argument to moderation×middle position asserted as truth(en)',
  };
}

module.exports = {
  checkArgumentToModeration,
  __internals: () => ({
    MIDDLE_ZH, TRUTH_ZH, MIDDLE_EN, TRUTH_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_DEAL_ZH, EXEMPT_DEAL_EN,
    EXEMPT_AVG_ZH, EXEMPT_AVG_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
