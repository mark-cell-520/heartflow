/**
 * [r720] 第 151 维度 post_hoc（后此谬误：以时间先后代替因果关系）。
 *
 * 形状：两件事在时间上前后相随，就断定前者是后者的原因（post hoc ergo
 * propter hoc）。落点是**纯时序推断因果**——「因为发生在前面，所以是
 * 原因」，且陈述里没有其他证据线索（对照组/回归/机制）。与存量维度的
 * 分工：pseudo_causal 管共变/相关/巧合当因果（相关≠因果的表述形），
 * 本族管先后=因果的时序推断形；gamblers_fallacy 管独立事件序列的
 * 概率误推，本族管一次前后相随就归因。wishful_thinking 管「因为想它
 * 成真所以成真」，本族管「因为它先发生所以造成」。
 *
 * 判据四条路由任一成立（缺腿不判）：
 *   R1 时序连接×因果断言：腿①时序连接（自从/自打/之后/从那以后/从那时起/
 *      随后/其后/第二天就；EN: ever since/after that/since then/afterwards/
 *      the next day）× 腿②因果断言（肯定/一定/说明/证明/导致/带来/多亏/
 *      怪不得/果然/不行/都是…造成的；EN: proves/is why/must be because/
 *      caused by/thanks to/due to/that is why/to blame/fault）。
 *      「换了领导后业绩下滑，我们需要分析具体原因」只有时序语境无因果
 *      断言，是正当调查，不判。
 *   R2 干预×症状变化：腿①干预（吃了/用了/装了/换了/调整了/下载了；
 *      EN: took/installed/downloaded/started using）× 腿②变化（就好了/
 *      没再/就上去了/就多了/就出问题/就出事/就下滑；EN: got better/
 *      stopped/improved/no longer）。
 *   R3 缺失×灾殃×规避：腿①缺失（没带/没做/没去；EN: did not/didn't）×
 *      腿②灾殃（就出事/就出乱子/就倒霉；EN: things went wrong/we lost）×
 *      腿③规避（以后不敢/必须带/不能不；EN: never again/must）。
 *   R4 到场×垮掉（EN 口语形）：腿①到场（sat/came/joined/arrived）× 腿②
 *      垮掉（we lost/everything fell apart/things went wrong）。
 *
 * 豁免：调查语境（需要分析/需要排查/不等于因果/控制变量/回归分析/共同的
 * 原因/可能是/更多数据/需要证据/很多因素/归因；EN: need more data/
 * correlation/not necessarily/could be/need to investigate）——样本在
 * 讨论因果方法而不是下因果结论，不判。
 *
 * 2026-10-24 decision 本体选出（scripts/decide-r720.js，composite_score
 * 0.81 / confidence 0.75 / identity alignment 0.8，无弃选）。r720 探测器
 * 实测：攻击漏判 10/14（71%）、真零命中 10/10、误伤 0/10。
 */
'use strict';

// 腿①：时序连接词（ZH）
const CONNECT_ZH = [
  '自从', '自打', '之后', '从那以后', '从那时起', '随后', '其后', '第二天就', '次日就',
  '自此', '打那', '从此', '后来就', '从那之后', '从那会儿',
];
// 腿②：因果断言（ZH）
const ASSERT_ZH = [
  '肯定是', '一定是', '肯定', '说明', '证明', '导致', '带来', '多亏', '怪不得', '果然',
  '都是', '造成的', '的问题', '不行', '真有用', '起作用', '看来', '原来',
  '就是因为', '都怪', '要怪', '全靠', '得亏', '显灵', '灵验', '邪门', '真管用',
  '治好了', '有效', '对了', '的功劳', '晦气', '玄学', '有问题',
];
// R2 腿①：干预动词（ZH）
const INTERVENE_ZH = [
  '吃了', '用了', '装了', '换了', '调整了', '下载了', '上了', '打了', '换了',
  '开始', '部署', '升级', '更新', '买了', '穿了',
];
// R2 腿②：症状变化（ZH）——注意常量统一带「就」，与中性记录句
// （「今天出了故障」）作形状区分：后此谬误要求紧随相随的突变
const CHANGE_ZH = [
  '就好了', '没再', '就上去了', '就多了', '就出问题', '就出事', '就下滑', '就涨了', '就乱了',
  '考砸', '挂科', '就挂了', '就出故障', '就崩了', '就少了', '就差了',
  '就输了', '就顺了', '就稳定', '就正常',
];
// R3 腿①：缺失（ZH）
const ABSENCE_ZH = ['没带', '没做', '没去'];
// R3 腿②：灾殃（ZH）
const CALAMITY_ZH = ['就出事', '就出乱子', '就出了乱子', '就倒霉', '就输了'];
// R3 腿③：规避（ZH）
const AVOID_ZH = ['以后不敢', '以后我不敢', '我不敢', '必须带', '不能不', '再也不敢'];

// EN 词表
const CONNECT_EN = [
  'ever since', 'after that', 'since then', 'afterwards', 'the next day',
  'since', 'after', 'once', 'right after', 'from then on', 'following',
];
const ASSERT_EN = [
  'proves', 'is why', 'must be because', 'caused by', 'thanks to', 'due to',
  'that is why', 'to blame', 'his fault', 'her fault', 'so it is',
  'proving', 'it works', 'must be', 'is to blame', 'caused it',
  'that proves', 'which proves', 'so that is', 'is the reason',
];
const INTERVENE_EN = [
  'took', 'installed', 'downloaded', 'started using', 'tried',
  'changed', 'switched', 'updated', 'applied', 'got',
];
const CHANGE_EN = [
  'got better', 'stopped', 'improved', 'no longer',
  'went up', 'went down', 'dropped', 'increased', 'decreased', 'worse',
];
const ABSENCE_EN = ["didn't", 'did not'];
const CALAMITY_EN = ['things went wrong', 'we lost', 'fell apart'];
const AVOID_EN = ['never again', 'must'];

// 调查语境豁免（ZH）
const EXEMPT_ZH = [
  '需要分析', '需要排查', '不等于因果', '控制变量', '回归分析', '共同的原因',
  '可能是', '更多数据', '需要证据', '很多因素', '归因', '相关性', '不能只',
  '先记录', '再找', '正在排查', '还要看', '不一定', '未必', '无法确认',
  '待观察', '双盲', '安慰剂',
];
// 调查语境豁免（EN）
const EXEMPT_EN = [
  'need more data', 'correlation', 'not necessarily', 'could be',
  'need to investigate', 'more research', 'confounding',
  'might be', 'may be', 'placebo', 'need to check', 'double-blind',
  'not enough evidence', 'causation', 'cannot conclude',
];

/**
 * 后此谬误判定。
 * @param {string} text 规范化后的文本
 * @returns {{score:number,count:number,matches:Array,zeroHit:boolean,details:string}}
 */
function checkPostHoc(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '' };
  }

  const lower = text.toLowerCase();
  const isZh = /[\u4e00-\u9fff]/.test(text);

  const has = (arr, s) => arr.some((w) => s.includes(w));
  // EN 词边界匹配（r722 存量误伤修复）：裸词子串匹配会把 'got' 误中
  // 'renegotiate'（ne-got-iate）——良性谈判建议句 "If the old terms no
  // longer work for you, let us renegotiate." 曾因 got×no longer 触发
  // R2 被 gate 误判 rewrite。干预动词整词匹配后该误伤清零。
  const hasWord = (arr, s) => arr.some((w) => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(s));
  const exemptZh = has(EXEMPT_ZH, text);
  const exemptEn = has(EXEMPT_EN, lower);
  if (exemptZh || exemptEn) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '调查语境豁免' };
  }

  const matches = [];
  const routes = new Set();

  // R1 时序连接 × 因果断言
  if (has(CONNECT_ZH, text) && has(ASSERT_ZH, text)) {
    routes.add(1);
    matches.push({ route: 1, legA: has(CONNECT_ZH, text) ? '时序连接' : '', legB: '因果断言' });
  }
  if (has(CONNECT_EN, lower) && has(ASSERT_EN, lower)) {
    routes.add(1);
    matches.push({ route: 1, legA: 'temporal', legB: 'assertion' });
  }

  // R2 干预 × 症状变化（ZH 块）
  if (has(INTERVENE_ZH, text) && has(CHANGE_ZH, text)) {
    routes.add(2);
    matches.push({ route: 2, legA: '干预', legB: '变化' });
  }
  // R2 干预 × 症状变化（EN 块——干预腿用词边界匹配，防 got⊂renegotiate 类子串误判）
  if (hasWord(INTERVENE_EN, lower) && has(CHANGE_EN, lower)) {
    routes.add(2);
    matches.push({ route: 2, legA: 'intervention', legB: 'change' });
  }

  // R3 缺失 × 灾殃 × 规避
  if (has(ABSENCE_ZH, text) && has(CALAMITY_ZH, text) && has(AVOID_ZH, text)) {
    routes.add(3);
    matches.push({ route: 3, legA: '缺失', legB: '灾殃', legC: '规避' });
  }
  if (has(ABSENCE_EN, lower) && has(CALAMITY_EN, lower) && has(AVOID_EN, lower)) {
    routes.add(3);
    matches.push({ route: 3, legA: 'absence', legB: 'calamity', legC: 'avoid' });
  }

  // R4 到场 × 垮掉（EN 口语形）
  const arriveEn = /\b(sat|came|joined|arrived|showed up)\b/.test(lower);
  if (arriveEn && has(CALAMITY_EN, lower)) {
    routes.add(4);
    matches.push({ route: 4, legA: '到场', legB: '垮掉' });
  }

  if (matches.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: true, details: '' };
  }

  const routeCount = routes.size;
  const score = Math.min(90, 60 + matches.length * 8 + (routeCount > 1 ? 6 : 0));
  const details = isZh
    ? '后此谬误(' + matches.length + '处: 时序前后相随即断因果)'
    : 'post hoc fallacy(' + matches.length + ' occurrences: temporal sequence asserted as cause)';
  return { score, count: matches.length, matches, zeroHit: false, details };
}

module.exports = { checkPostHoc, __internals: { CONNECT_ZH, ASSERT_ZH, INTERVENE_ZH, CHANGE_ZH, ABSENCE_ZH, CALAMITY_ZH, AVOID_ZH, CONNECT_EN, ASSERT_EN, INTERVENE_EN, CHANGE_EN, ABSENCE_EN, CALAMITY_EN, AVOID_EN, EXEMPT_ZH, EXEMPT_EN } };
