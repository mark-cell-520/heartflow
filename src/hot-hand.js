/**
 * [r722] 第 153 维度 hot_hand（热手谬误：把连胜势头当成下一局胜率提升的保证）。
 *
 * 形状：主观或客观的连胜势头（手感/手气/势头/连赢N把/on a hot streak/
 * five in a row）× 对下一局的延续性断言（肯定还会中/一定也赢/definitely/
 * bound to win）。落点是**势头→胜率提升**的推断，且陈述里没有独立事件/
 * 概率不变等证据线索。与存量维度的分工：gamblers_fallacy 第 148 维管
 * 「连胜之后该反转」（due 方向——该输了/该赢了/probability is higher），
 * 本族管「连胜势头会延续」（momentum 方向——肯定还会赢/势头在我），
 * 两维合起来闭合「独立事件序列的概率幻觉」家族；post_hoc 管一次前后
 * 相即归因，本族管多局序列的势头外推；wishful_thinking 管「因为想它
 * 成真所以成真」，本族管「因为正在发生所以继续发生」。
 *
 * 判据两条路由任一成立（缺腿不判）：
 *   R1 中文：腿①势头/连胜表达（手感/手气/势头/趁热打铁/走运/连赢/连胜/
 *      连对/连红/连中/连签/连过/连成/连涨/全过/全中/签了三单）× 腿②
 *      延续性断言（肯定/一定/必然/势必/铁定/必中/必赢/稳了/还会/也会/
 *      再来一局/继续押/下一把也/再买几注）。
 *      「连胜可能提升信心，但每局概率独立」只有势头语境无延续断言，
 *      是正当复盘，不判。
 *   R2 英文：腿①（hot streak/on a roll/in the zone/momentum/on fire/
 *      going my way/five in a row/wins in a row/ride the momentum）×
 *      腿②（definitely/guaranteed/bound to/certainly/for sure/no doubt/
 *      is mine/will work out/going in/on my side/next one will）。
 *
 * 豁免（三常量，负例注入逐承重）：
 *   META_NOUN：热手谬误/hot hand fallacy 等概念词——样本在解释概念
 *     而不是运用热手推断，不判。
 *   EVIDENCE_PRESENT：独立事件/概率独立/不影响/与历史无关/大数定律；
 *     EN: independent event/regardless of/remains the same/does not
 *     affect/same probability——样本在讲随机性机制而不是下势头结论。
 *   THIRD_PERSON_EXEMPT：老师/教材/课堂/教授/textbook/lecture——
 *     教学转述语境，不判。
 *
 * 2026-10-24 decision 本体选出（scripts/decide-r722.js，首轮 A/B composite
 * 0.81 打平弃权——诚实行为，补真实可区分判据后第二轮选中 A，composite
 * 0.83 / confidence 0.8 / identity alignment 0.8）。r722 探测器实测：
 * 攻击漏判 11/15（73%）、真零命中 11/11、误伤 0/8。
 */
'use strict';

// 腿①：势头/连胜表达（ZH）
const STREAK_ZH = [
  '手感', '手气旺', '手风顺', '势头', '气势', '趁热打铁', '走运', '运气好', '状态好',
  '正旺', '正顺', '顺风局',
  '连赢', '连胜', '连对', '连红', '连中', '连签', '连过', '连成', '连涨', '连杀', '连秀', '连拿',
  '全过', '全中', '全赢', '全成',
];
// 腿①补充正则（ZH）：「签了三单」类成功计数形（不进数组常量，负例注入
// 只针对数组；此形是腿①的窄补充）
const STREAK_ZH_RE = /签[了过][一二三四五六七八九十两\d]+\s*单/;
// 腿②：延续性断言（ZH）
const CONTINUE_ZH = [
  '肯定', '一定', '必然', '势必', '铁定', '必定', '必中', '必赢', '稳了', '跑不了',
  '还会', '也会', '再来一局', '再来一把', '再来一注', '接着来', '继续押', '继续买',
  '下一把也', '下一局也', '下一场也', '下一道也', '下一个也', '下个月也', '下次也',
  '再买几注', '再买几张', '再下一注',
];

// EN 词表
const STREAK_EN = [
  'hot streak', 'on a roll', 'in the zone', 'momentum', 'on fire',
  'going my way', 'luck is in', 'running hot', 'ride the momentum',
];
// 腿①补充正则（EN）：「five in a row / three wins in a row」计数形
const STREAK_EN_RE = /\b(?:\d+|five|three|four|six|seven|eight|nine|ten|two)\s+(?:times\s+)?in\s+a\s+row\b|\b(?:wins?|victories|games?)\s+in\s+a\s+row\b/i;
// 腿②：延续性断言（EN）
const CONTINUE_EN = [
  'definitely', 'guaranteed', 'bound to', 'will certainly', 'certainly',
  'surely', 'for sure', 'no doubt', 'is mine', 'will work out', 'going in',
  'on my side', 'next one will', 'keep riding', 'ride the momentum',
];

// 豁免常量
const META_NOUN = [
  '热手谬误', '热手效应', 'hot hand fallacy', 'hot hand effect', 'hot hand',
  '赌徒谬误', 'gambler fallacy', "gambler's fallacy",
];
const EVIDENCE_PRESENT = [
  '独立事件', '概率不变', '概率独立', '不影响', '与历史无关', '不会累积',
  '大数定律', '对照组', '随机结果', '独立',
  'independent event', 'regardless of', 'remains the same', 'does not affect',
  'law of large numbers', 'same probability', 'not related', 'uncorrelated',
];
const THIRD_PERSON_EXEMPT = [
  '老师', '教材', '课本', '课堂', '教授', '讲师', '讲义',
  'textbook', 'lecture', 'professor', 'in class', 'the course',
];

/**
 * 热手谬误判定。
 * @param {string} text 规范化后的文本
 * @returns {{score:number,count:number,matches:Array,zeroHit:boolean,details:string}}
 */
function checkHotHand(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '' };
  }

  const lower = text.toLowerCase();
  const isZh = /[\u4e00-\u9fff]/.test(text);

  const has = (arr, s) => arr.some((w) => s.includes(w));
  if (has(META_NOUN, text) || has(META_NOUN, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '概念词豁免' };
  }
  if (has(EVIDENCE_PRESENT, text) || has(EVIDENCE_PRESENT, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '证据语境豁免' };
  }
  if (has(THIRD_PERSON_EXEMPT, text) || has(THIRD_PERSON_EXEMPT, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '第三人称教学转述豁免' };
  }

  const matches = [];
  const routes = new Set();

  // R1 中文：势头/连胜表达 × 延续性断言
  if ((has(STREAK_ZH, text) || STREAK_ZH_RE.test(text)) && has(CONTINUE_ZH, text)) {
    routes.add(1);
    matches.push({ route: 1, legA: '势头/连胜', legB: '延续断言' });
  }

  // R2 英文：hot streak/momentum × continuation assertion
  if ((has(STREAK_EN, lower) || STREAK_EN_RE.test(lower)) && has(CONTINUE_EN, lower)) {
    routes.add(2);
    matches.push({ route: 2, legA: 'hot streak', legB: 'continuation' });
  }

  if (matches.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: true, details: '' };
  }

  const routeCount = routes.size;
  const score = Math.min(90, 60 + matches.length * 8 + (routeCount > 1 ? 6 : 0));
  const details = isZh
    ? '热手谬误(' + matches.length + '处: 连胜势头被当成下一局胜率的保证)'
    : 'hot hand fallacy(' + matches.length + ' occurrences: streak asserted as guarantee for the next round)';
  return { score, count: matches.length, matches, zeroHit: false, details };
}

class HotHand {
  constructor() {
    this.dimension = 'hot_hand';
    this.detail = '热手谬误';
    this.guidance = '连胜势头不能提高下一局的胜率——独立事件的结果互不影响；把「手感正旺/连赢N把」当成「下一局肯定还会赢」是把随机序列当成了有记忆的过程。要判断下一局，回到每局固有的概率与证据。';
  }

  reset() {
    this.count = 0;
    this.hits = [];
    this.empties = [];
    this.claims = [];
    this.signals = [];
  }

  analyze(text) {
    this.reset();
    if (typeof text !== 'string') return this;
    const r = checkHotHand(text);
    if (r.count > 0) {
      this.count = r.count;
      this.hits.push(r.details);
      this.claims.push('热手谬误');
      this.signals.push({ dimension: 'hot_hand', severity: r.score, details: r.details, matches: r.matches });
    } else {
      this.empties.push(r.details || '');
    }
    return this;
  }

  get score() {
    return this.count >= 1 ? 78 : 0;
  }
}

module.exports = { HotHand, checkHotHand, __internals: { STREAK_ZH, STREAK_ZH_RE, CONTINUE_ZH, STREAK_EN, STREAK_EN_RE, CONTINUE_EN, META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT } };
