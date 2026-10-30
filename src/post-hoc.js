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
 *   R2 干预×症状变化×归因主张：腿①干预（吃了/用了/装了/换了/调整了/
 *      下载了；EN: took/installed/downloaded/started using）× 腿②变化
 *      （就好了/没再/就上去了/就多了/就出问题；EN: got better/stopped/
 *      improved/no longer）× 腿③归因主张（EN，r738 补：so/therefore/
 *      thus/hence/that's why/which proves 或 right after/immediately/
 *      instantly）。
 *      [r738] EN 侧补腿③的理由：本维度 guidance 明文承诺「缺腿不判——
 *      『上周打了补丁，今天出了故障』只有时间陈述无归因主张，是正常事件
 *      记录」，但 r720 建维度时 EN 侧只有干预×变化两腿，于是
 *      "We applied the patch. Latency dropped 40% after the change." 与
 *      "I took the medicine and got better, so the medicine works." 形状
 *      同构、判据无法区分，中性工程复盘被误判 rewrite。ZH 侧靠
 *      CHANGE_ZH 常量统一带「就」做紧随相随的形状区分（见下方常量注释），
 *      EN 侧自 r720 起就没有对应约束——这是「文档承诺了但代码没实现」的
 *      半接线，不是判据覆盖不足。腿③两支取「或」不用「与」：r720 的两条
 *      EN 攻击样本（I took the medicine and got better, so the medicine
 *      works. / I updated the app and the crashes stopped, so it works.）
 *      没有即时性标记、只有尾部因果收束，只留即时性标记会漏掉它们。
 *      ZH 侧不加腿③：「就」本身同时是紧随相随与归因语气（「换了个手机
 *      号，孩子成绩就上去了」无其它归因词也是谬误形），两侧形状不同，
 *      强行对齐会打红 r720 的 ZH 攻击样本。
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
// R4 腿①：到场动词（EN 口语形）。抽成常量让 checkPostHoc 与 describePostHoc
// 共用同一份词表——否则诊断看到的腿①会和判定用的腿①漂移（r737 踩坑③ 同族：
// 辅助判据与调用方必须是同一个不变式的两半）。
const ARRIVE_EN = ['sat', 'came', 'joined', 'arrived', 'showed up'];
// [r738] R2 腿③：归因主张（EN）——把「先后相随」升级成「先后即因」的那一步。
// 两支取「或」：③a 显式因果收束（推论连接词），③b 即时性标记（「紧随相随」的
// EN 对应物，即 ZH  CHANGE_ZH 里那个「就」）。
// ③a 刻意只收推论连接词，不收 'after'/'since'/'when' 这类时序连接词——
// 后者已在 CONNECT_EN 里，若也放进腿③，R2 会退化成 R1 的宽版子集，
// 「We applied the patch. Latency dropped 40% after the change.」又会
// 因为一个 'after' 重新变 rewrite。'so' 等必须走词边界匹配，
// 否则 'also'/'person' 会子串误中。
const CLOSURE_EN = [
  'so', 'therefore', 'thus', 'hence', "that's why", 'which is why',
  'that is why', 'which proves', 'that proves', 'which means',
  'that means', 'meaning', 'as a result', 'so that is',
];
const IMMEDIACY_EN = [
  'right after', 'immediately', 'instantly', 'right away', 'at once',
  'soon after', 'no sooner', 'as soon as', 'the moment', 'suddenly',
  'minutes later', 'hours later', 'days later', 'overnight',
];

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

  // R2 干预 × 症状变化（ZH 块）——ZH 的腿② CHANGE_ZH 常量统一带「就」，
  // 「就」本身同时承担紧随相随与归因语气，所以 ZH 侧只需两腿。
  if (has(INTERVENE_ZH, text) && has(CHANGE_ZH, text)) {
    routes.add(2);
    matches.push({ route: 2, legA: '干预', legB: '变化' });
  }
  // R2 干预 × 变化 × 归因主张（EN 块）
  // [r738] 腿③ attribution：干预腿与变化腿都走词边界匹配（防 got⊂renegotiate
  // 与 also⊂'so' 两类子串误判），腿③两支取「或」——推论连接词、因果断言
  // 词表、即时性标记任一成立即可。缺腿③时不判：那正是中性工程复盘的
  // 形状（「改了配置，告警就停了」只有事件记录，没有归因主张）。
  if (hasWord(INTERVENE_EN, lower) && has(CHANGE_EN, lower)) {
    const closureHit = hasWord(CLOSURE_EN, lower);
    const assertHit = has(ASSERT_EN, lower);
    const immediacyHit = hasWord(IMMEDIACY_EN, lower);
    if (closureHit || assertHit || immediacyHit) {
      routes.add(2);
      matches.push({
        route: 2, legA: 'intervention', legB: 'change', legC: 'attribution',
        legCSource: closureHit ? 'closure' : (assertHit ? 'assertion' : 'immediacy'),
      });
    }
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
  const arriveEn = hasWord(ARRIVE_EN, lower);
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

/** 找出命中的具体词（诊断用，不参与判定）。 */
function _hits(arr, s, word) {
  const out = [];
  for (const w of arr) {
    if (word) {
      if (new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(s)) out.push(w);
    } else if (s.includes(w)) {
      out.push(w);
    }
  }
  return out;
}

/**
 * [r738] 逐路由逐腿诊断：把「判了 / 没判」摊开成哪条腿中、中的是哪个词、
 * 哪条腿缺。修复前这条维度对外只显示 count=0，分不清「扫描过但缺腿」与
 * 「守卫路径早退」，R2 EN 侧腿③的缺口因此连续五轮复测才定位到根因。
 * @param {string} text 规范化后的文本
 * @returns {{exempt:boolean,exemptSource:string,routes:Array,score:number,count:number}}
 */
function describePostHoc(text) {
  const guard = { score: 0, count: 0, matches: [], zeroHit: false, exempt: false, exemptSource: '', routes: [] };
  if (typeof text !== 'string' || text.length === 0) {
    return Object.assign(guard, { zeroHit: false, guardPath: 'empty_or_non_string' });
  }
  const lower = text.toLowerCase();
  const isZh = /[一-鿿]/.test(text);
  const exemptZh = _hits(EXEMPT_ZH, text, false);
  const exemptEn = _hits(EXEMPT_EN, lower, false);
  if (exemptZh.length || exemptEn.length) {
    return Object.assign(guard, {
      zeroHit: false, exempt: true,
      exemptSource: exemptZh.length ? 'zh' : 'en',
      exemptEvidence: (exemptZh.length ? exemptZh : exemptEn).slice(0, 4),
      routes: [],
    });
  }

  const leg = (name, hits) => ({ name, hit: hits.length > 0, evidence: hits.slice(0, 4) });
  const routes = [];

  // R1 时序连接 × 因果断言
  const r1a = _hits(CONNECT_ZH, text, false);
  const r1b = _hits(ASSERT_ZH, text, false);
  const r1aEn = _hits(CONNECT_EN, lower, false);
  const r1bEn = _hits(ASSERT_EN, lower, false);
  routes.push({
    route: 1, side: isZh ? 'zh' : 'en',
    legs: isZh
      ? [leg('temporal', r1a), leg('assertion', r1b)]
      : [leg('temporal', r1aEn), leg('assertion', r1bEn)],
  });

  // R2 干预 × 变化（ZH 两腿）／ 干预 × 变化 × 归因主张（EN 三腿）
  const r2iZh = _hits(INTERVENE_ZH, text, false);
  const r2cZh = _hits(CHANGE_ZH, text, false);
  const r2iEn = _hits(INTERVENE_EN, lower, true);
  const r2cEn = _hits(CHANGE_EN, lower, false);
  const r2Closure = _hits(CLOSURE_EN, lower, true);
  const r2Assert = _hits(ASSERT_EN, lower, false);
  const r2Imm = _hits(IMMEDIACY_EN, lower, true);
  const r2Attr = r2Closure.concat(r2Assert, r2Imm);
  routes.push({
    route: 2, side: isZh ? 'zh' : 'en',
    legs: isZh
      ? [leg('intervention', r2iZh), leg('change', r2cZh)]
      : [
        leg('intervention', r2iEn), leg('change', r2cEn),
        {
          name: 'attribution', hit: r2Attr.length > 0,
          evidence: r2Attr.slice(0, 4),
          sources: {
            closure: r2Closure.slice(0, 4), assertion: r2Assert.slice(0, 4),
            immediacy: r2Imm.slice(0, 4),
          },
        },
      ],
    missingAttribution: !isZh && r2iEn.length > 0 && r2cEn.length > 0 && r2Attr.length === 0,
  });

  // R3 缺失 × 灾殃 × 规避
  routes.push({
    route: 3, side: isZh ? 'zh' : 'en',
    legs: isZh
      ? [
        leg('absence', _hits(ABSENCE_ZH, text, false)),
        leg('calamity', _hits(CALAMITY_ZH, text, false)),
        leg('avoid', _hits(AVOID_ZH, text, false)),
      ]
      : [
        leg('absence', _hits(ABSENCE_EN, lower, true)),
        leg('calamity', _hits(CALAMITY_EN, lower, false)),
        leg('avoid', _hits(AVOID_EN, lower, true)),
      ],
  });

  // R4 到场 × 垮掉（EN 口语形）
  routes.push({
    route: 4, side: 'en',
    legs: [
      leg('arrival', _hits(ARRIVE_EN, lower, true)),
      leg('calamity', _hits(CALAMITY_EN, lower, false)),
    ],
  });

  routes.forEach((r) => { r.satisfied = r.legs.every((l) => l.hit); });
  const res = checkPostHoc(text);
  return {
    exempt: false, exemptSource: '',
    routes, score: res.score, count: res.count, zeroHit: res.zeroHit,
  };
}

module.exports = {
  checkPostHoc, describePostHoc,
  __internals: {
    CONNECT_ZH, ASSERT_ZH, INTERVENE_ZH, CHANGE_ZH, ABSENCE_ZH, CALAMITY_ZH, AVOID_ZH,
    CONNECT_EN, ASSERT_EN, INTERVENE_EN, CHANGE_EN, ABSENCE_EN, CALAMITY_EN, AVOID_EN,
    EXEMPT_ZH, EXEMPT_EN, CLOSURE_EN, IMMEDIACY_EN, ARRIVE_EN,
  },
};
