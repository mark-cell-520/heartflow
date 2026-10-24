/**
 * src/appeal-to-probability.js — 「诉诸概率（可能性误当必然）」检测器
 * （第 152 个判别维度）
 *
 * [r721 立项] decision 本体选出（scripts/decide-r721.js，composite_score
 * 0.81 / confidence 0.78 / identity alignment 0.8，无弃权）。候选池来自
 * r721 探测器（scripts/round-721-family-probe.js）在当前引擎（v6.8.68，
 * 151 维）上逐族复测：本族攻击漏判 12/16（75%）、真零命中 12/12、
 * 误伤 0/10。Phase 1.5 同律复核：12 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 12/12——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：诉诸概率（appeal to probability / base-rate-as-guarantee）——
 * **把「基数大、重复多、样本大、时间够长、概率存在」当成「一定发生、
 * 一定轮到我」的保证**，让概率事件背负确定性外衣：
 *   宇宙这么大，肯定有外星人。
 *   世上无难事，只要肯试，试多了总能成。
 *   航班天天飞，出事的才几起，我肯定赶不上。
 *   选择题四个选项，蒙个十道八道总能对几道，考试稳了。
 *   概率再低，只要重复次数够多就一定发生。
 *   中国有十四亿人，什么样的事不可能发生？
 *   With so many tickets sold, someone has to win — why not me?
 *   I have applied to hundreds of jobs; one of them is bound to say yes.
 *   The universe is so vast, there must be intelligent life.
 *   Given enough time, anything that can happen will happen.
 *   If I keep playing, I am bound to win sooner or later.
 *   Do it enough times and success is guaranteed eventually.
 *
 * 与既有维度的边界（r721 归因）：
 *   · gamblers_fallacy（第 148 维）管**历史频率→该反转**（连输五把
 *     下一把肯定赢/都出十次小了该出大了），方向是「平衡义务」；本族
 *     管**基数/重复/规模→一定发生**，不依赖历史连胜连败形态；
 *   · wishful_thinking 管**坚信→必将**（我肯定能成功/一定会好起来
 *     的纯愿望断言），本族要件是基数/规模论据在场，可毫无愿望色彩
 *     （「宇宙这么大，肯定有外星人」是论据推演不是期盼）；
 *   · confidence 管**断言强度**（肯定/一定/毫无疑问），本族管
 *     「规模→确定性」的论证结构，强度词可缺席（「Given enough time,
 *     anything will happen」无强词仍是伪确定性）；
 *   · appeal_to_majority 管**人数→观点正确**（大家都这么认为所以
 *     是对的），本族管**人数/基数→事件必然**，结论指向事件发生率
 *     不指向观点真伪；
 *   · 其余 151 个维度对本族 12 条漏判样本实测零命中 12/12。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① BASE 基数/重复/规模/时长表达——这么[大广多]/那么[大广多]/
 *     十四亿人/这么多人/天天飞/遍地/试多了/重复次数够多/蒙十道八道/
 *     投了三百份/时间够长（中）；so many / so vast / billions of /
 *     given enough time / enough times / keep playing / hundreds of（英）；
 *   · 腿② CERTAIN 必然性断言——肯定[有会成]/一定[会能发生]/总能/
 *     迟早/必然/不可能不发生/稳了/凭什么不是我（中）；must be /
 *     bound to / guaranteed / has to / inevitable / will happen /
 *     sooner or later / why not me（英）。
 *   · 缺腿不判：只有腿①（「宇宙这么大，但至今没有证据」）是正确
 *     规模陈述；只有腿②（「这事一定能成」）无论据来源，归
 *     wishful_thinking / confidence。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误（「他说宇宙这么大
 * 肯定有外星人，我劝他先看证据」）、概率论教学中的反例讲解（「很多
 * 人认为基数大就一定会发生，这是诉诸概率」）、风险沟通中的背景
 * 陈述。verify 的含义是「这段话在把概率当保证，需要回到大数定律与
 * 独立事件的常识层面」——调用方应要求把「一定」落到可核对的期望值
 * 与证据上，而不是接受规模幻觉。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（诉诸概率/appeal to probability 字样在场）：
 *     分析这个概念本身不是运用它；
 *   · 正确概率陈述在场（概率很低/不代表/不保证/不能说明/小概率/
 *     不能心存侥幸/大数定律/独立事件/随机/没有证据；low probability /
 *     improbable / no evidence / does not guarantee / odds are against）：
 *     陈述概率原理的话是在破除谬误；
 *   · 概率教学第三人称语境（老师/教材/课堂上/教授/textbook/lecture/
 *     professor）：专业角色复盘反例。
 */
'use strict';

// ─── 腿①：基数/重复/规模/时长表达（中文）────────────────────────
const BASE_ZH = [
  /这么[大广多长]/,
  /那么[大广多]/,
  /[0-9一二三四五六七八九十百千万亿]+亿?[多]?人/,
  /这么多人/,
  /天天[飞跑有来发生开]/,
  /满地[都也]?是/,
  /遍地[都也]?是/,
  /满大街/,
  /试多了/,
  /试这么[多长]/,
  /多试[几些\d]+[次遍回把]/,
  /重复次数[够足][多了]/,
  /投了?[\d三百两千]+[份篇]/,
  /投得够多/,
  /发得够多/,
  /蒙[个些]?[\d几一两十]{1,4}[道题]/,
  /练这么[多长遍]/,
  /刷了?[\d这么几]+遍/,
  /买这么[多长次]/,
  /坚持这么[久长]/,
  /宇宙这么[大广]/,
  /世上[这么那]么[多广]/,
  /每天这么[多长]/,
  /基数[这大么那]/,
  /次数够多/,
  /时间[够足]够?长/,
  /样本[这大么那]/,
];

// ─── 腿①：基数/重复/规模/时长表达（英文）────────────────────────
const BASE_EN = [
  /\bso\s+(?:many|vast|large|big|much|numerous|widespread)\b/i,
  /\b(?:billions?|millions?|trillions?)\s+of\b/i,
  /\b(?:hundreds|thousands|millions)\s+of\b/i,
  /\bgiven\s+enough\s+time\b/i,
  /\benough\s+(?:time|times|attempts|tries|shots|rolls|repetition)\b/i,
  /\bkeep\s+(?:playing|trying|applying|rolling|buying|going)\b/i,
  /\bif\s+(?:I|you|we|they)\s+keep\b/i,
  /\bso\s+many\s+(?:people|tickets|applications|attempts|tries|rolls|shots)\b/i,
  /\bvast\s+(?:universe|number|majority|pool)\b/i,
  /\bnumerous\s+(?:attempts|tries|applications)\b/i,
  /\bwith\s+enough\s+(?:time|attempts|tries|repetition)\b/i,
  /\brepeated(?:ly)?\s+enough\b/i,
];

// ─── 腿②：必然性断言（中文）────────────────────────────────────
const CERTAIN_ZH = [
  /肯定[有会成对中赶来赢到]/,
  /一定会/,
  /一定[会能发生成有中来赢对到]/,
  /必然[会有成在发生是]/,
  /必[中注定成]/,
  /迟早[会有成来]/,
  /总[有能该][一会成到来中赢对]/,
  /不可能不(?:发生|存在|中|是|赢)/,
  /不可能发生/,
  /稳[了赢]/,
  /逃不掉/,
  /躲不掉/,
  /跑不掉/,
  /凭什么不是我/,
  /总有一[天次家个]/,
  /还会远吗/,
];

// ─── 腿②：必然性断言（英文）────────────────────────────────────
const CERTAIN_EN = [
  /\bmust\s+be\b/i,
  /\bthere\s+must\s+be\b/i,
  /\bbound\s+to\b/i,
  /\bguaranteed\b/i,
  /\bhas\s+to\s+(?:happen|win|hit|work|come|be)\b/i,
  /\binevitable\b/i,
  /\bwill\s+(?:eventually\s+)?happen\b/i,
  /\bsooner\s+or\s+later\b/i,
  /\bwhy\s+not\s+me\b/i,
  /\bmust\s+win\b/i,
  /\bis\s+sure\s+to\b/i,
  /\bare\s+sure\s+to\b/i,
  /\bcertain\s+to\b/i,
];

// ─── 豁免一：元话语/概念引述（分析这个概念本身不是运用它）──────────
const META_NOUN = [
  /诉诸概率/,
  /appeal\s+to\s+probability/i,
  /可能性误当必然/,
];

// ─── 豁免二：正确概率陈述在场（陈述概率原理的话是在破除谬误）────
const EVIDENCE_ZH = [
  /概率[很极太][低小不高]/,
  /概率不大/,
  /小概率/,
  /不代表/,
  /不保证/,
  /不能保证/,
  /不能说明/,
  /不等于必然/,
  /不意味着一定/,
  /不是必然/,
  /不等于一定/,
  /不能心存侥幸/,
  /不能当/,
  /大数定律/,
  /独立事件/,
  /随机/,
  /没有[^。]{0,6}证据/,
  /尚未发现/,
  /幸存者/,
  /不能排除/,
];
const EVIDENCE_EN = [
  /\blow\s+probability\b/i,
  /\bimprobable\b/i,
  /\bdoes\s+not\s+guarantee\b/i,
  /\bno\s+guarantee\b/i,
  /\bnot\s+a\s+guarantee\b/i,
  /\bno\s+evidence\b/i,
  /\bodds\s+are\s+(?:low|against)\b/i,
  /\bpossible\s+but\b/i,
  /\bcannot\s+be\s+sure\b/i,
  /\blaw\s+of\s+large\s+numbers\b/i,
  /\brandom\b/i,
  /\bnot\s+necessarily\b/i,
];

// ─── 豁免三：概率教学第三人称语境（专业角色复盘反例）──────────────
const THIRD_PERSON_EXEMPT = [
  /老师/,
  /教材/,
  /课本/,
  /课堂上/,
  /教授说/,
  /textbook/i,
  /lecture/i,
  /professor/i,
  /\bin\s+class\b/i,
  /\bteacher\s+said\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * 中文路由：腿①×腿② 双腿共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白数组替换指定常量
 */
function checkZh(text, R) {
  const base = R.BASE_ZH || BASE_ZH;
  const certain = R.CERTAIN_ZH || CERTAIN_ZH;
  if (!anyHit(base, text)) return null;
  if (anyHit(certain, text)) return { route: 'zh:base×certain' };
  return null;
}

/** 英文路由：腿①×腿② 双腿共现。 */
function checkEn(text, R) {
  const base = R.BASE_EN || BASE_EN;
  const certain = R.CERTAIN_EN || CERTAIN_EN;
  if (!anyHit(base, text)) return null;
  if (anyHit(certain, text)) return { route: 'en:base×certain' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToProbability(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0, zeroHit: false };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const EVIDENCE_ZH_ = R.EVIDENCE_ZH || EVIDENCE_ZH;
  const EVIDENCE_EN_ = R.EVIDENCE_EN || EVIDENCE_EN;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (anyHit(META_NOUN_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确概率陈述在场 → 陈述概率原理是在破除谬误
  if (anyHit(EVIDENCE_ZH_, text) || anyHit(EVIDENCE_EN_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 概率教学第三人称语境：专业角色复盘反例
  if (anyHit(THIRD_PERSON_EXEMPT_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `诉诸概率×规模替代必然(${r.route})`
        : `appeal to probability×scale-as-certainty(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToProbability,
  __internals: () => ({
    BASE_ZH, BASE_EN, CERTAIN_ZH, CERTAIN_EN,
    META_NOUN, EVIDENCE_ZH, EVIDENCE_EN, THIRD_PERSON_EXEMPT,
  }),
};
