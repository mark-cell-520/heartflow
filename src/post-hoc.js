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
 *
 * [r224] 召回扩面（v6.8.152）：r220 D 节起连续四轮挂账的漏判族——两腿词表
 * 只收「紧邻形」，裸时序标记与高频干预动词整族漏网。扩面三项：
 *   ① CONNECT_ZH +「那天」族（从那天以后/从那天起/打那以后…）与短时距裸
 *      标记（第二天/隔天/当天/次日）；
 *   ② INTERVENE_ZH + 喝了/拜了/去了/请了/求了/换上/戴上/贴上/抹了/搬进…
 *      （「可被迷信归因的单次动作」族）；
 *   ③ CHANGE_ZH + 就没事了/就愈合了/就赢了/就退烧了/就硬朗了/就越来越好…
 *      九个带「就」的紧邻突变形。
 * 扩面后 r224 探针 16 条同族攻击句 detector 命中 0/16 → 15/16（唯一仍漏的
 * 「昨天我在电梯里摔了一跤，今天就下雨了」不构成后此谬误——全句没有任何
 * 因果断言，只是两件事并置，按本维度自身定义不判，详见 UPGRADE_LOG.md
 * r224 第五节第 1 条）；32 条良性叙述句与 A/B 32371 条全量语料零误伤。
 */
'use strict';

const { hasExclNegCausal } = require('./methodology-exempt.js');

// 腿①：时序连接词（ZH）
// [r224] 扩面两族（r220 D 节 / r221 G 节起连续四轮挂账的 3 条漏判句）：
//   ① 「那天」族裸标记——原表只有带「就」的紧邻形（第二天就/次日就/后来就），
//      「从那天以后他就像变了个人」的「从那天以后」一条都不匹配（「从那以后」
//      是另一串，子串不中）；② 短时距裸标记「第二天/隔天/当天/次日」——原表
//      只有「第二天就」紧邻形，「隔天他就退烧了」的「隔天」漏网。
//    两族都与存量条目同构（两腿匹配、无窗口），是否引入误交由 A/B 全量语料
//    裁定（r224 实测 32371 条 test/ quoted 样本：count 变化 5 条且全部是
//    攻击句获得应得命中，零良性回归，见 UPGRADE_LOG.md r224）。
const CONNECT_ZH = [
  '自从', '自打', '之后', '从那以后', '从那时起', '随后', '其后', '第二天就', '次日就',
  '自此', '打那', '从此', '后来就', '从那之后', '从那会儿',
  '从那天以后', '从那天起', '那天起', '打那以后', '打那天', '那天以后',
  '隔天', '当天', '第二天', '次日',
];
// 腿②：因果断言（ZH）
const ASSERT_ZH = [
  '肯定是', '一定是', '肯定', '说明', '证明', '导致', '带来', '多亏', '怪不得', '果然',
  '都是', '造成的', '的问题', '不行', '真有用', '起作用', '看来', '原来',
  '就是因为', '都怪', '要怪', '全靠', '得亏', '显灵', '灵验', '邪门', '真管用',
  '治好了', '有效', '对了', '的功劳', '晦气', '玄学', '有问题',
];
// R2 腿①：干预动词（ZH）
// [r224] 扩面：原表只收 吃了/用了/装了/换了…，「喝了/拜了/去了/请了/求了/
// 换上/戴上/贴上/抹了/搬进」整族漏网——「他喝了这个偏方，第二天病就好了」
// 死在这一腿（喝了 × 就好了 两条都该命中）。新增动词全部是「可被迷信归因的
// 单次动作」族（喝了偏方/拜了神/请了佛像/戴上护身符/贴上符咒/搬进新宅），
// 与存量条目同一判别口径。
// [r224] 复合后缀护栏 IV_SUFFIX_GUARD：「动词+了」形条目同时是更长动词的
// 后缀——去了⊂「成功率自然就上去**了**」（方向补语）、求了⊂「要**求了**」、
// 请了⊂「邀**请了**」、喝了⊂「吆**喝了**」。裸 includes 会把良性句判成干预
// 动作：r224 A/B 全量语料（32371 条 test/ quoted 样本）实测「修好线上 bug
// 之后成功率自然就上去了」等 14 条 reward_hacking 存量样本因此被误命中
// （13 条 block→block 多一条 finding、1 条 pass→rewrite 假阳性）。护栏 =
// 命中位置的前一字不在复合前缀表内才算干预动词。存量条目（吃了/用了/装了/
// 换了/上了…）不经护栏，行为逐字不变。
const INTERVENE_ZH = [
  '吃了', '用了', '装了', '换了', '调整了', '下载了', '上了', '打了', '换了',
  '开始', '部署', '升级', '更新', '买了', '穿了',
  '喝了', '拜了', '拜过', '去了', '请了', '求了', '换上', '戴上', '贴上',
  '抹了', '搬进',
];
// 复合前缀表：键 = 需护栏的干预动词，值 = 出现即说明它是更长动词的后缀
const IV_SUFFIX_GUARD = {
  '去了': '上下出回进过起飞冲奔升落掉撤退绕走离开接送往',
  '求了': '要恳哀请',
  '请了': '邀恳申招',
  '喝了': '吆呼',
};
// 带护栏的子串匹配：所有命中位置都被复合前缀挡住才算不成立
function hasInterveneZh(s, w) {
  const bad = IV_SUFFIX_GUARD[w];
  if (!bad) return s.includes(w);
  let idx = s.indexOf(w);
  while (idx !== -1) {
    const prev = idx > 0 ? s[idx - 1] : '';
    if (!bad.includes(prev)) return true;
    idx = s.indexOf(w, idx + 1);
  }
  return false;
}
// R2 腿②：症状变化（ZH）——注意常量统一带「就」，与中性记录句
// （「今天出了故障」）作形状区分：后此谬误要求紧随相随的突变
// [r224] 扩面：新增 就没事了/就愈合了/就赢了/就退烧了/就不疼了/就硬朗了/
// 就越来越好/就签了/就中了 九词，与新增干预动词配对（戴上×就赢了、
// 抹了×就愈合了、求了×就顺了…）。全部带「就」的紧邻突变形，与存量同口径。
const CHANGE_ZH = [
  '就好了', '没再', '就上去了', '就多了', '就出问题', '就出事', '就下滑', '就涨了', '就乱了',
  '考砸', '挂科', '就挂了', '就出故障', '就崩了', '就少了', '就差了',
  '就输了', '就顺了', '就稳定', '就正常',
  '就没事了', '就愈合了', '就赢了', '就退烧了', '就不疼了', '就硬朗了',
  '就越来越好', '就签了', '就中了',
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

// ─── [r220] 方法学/统计语境豁免（G7/G8 误拦）──────────────────────────
// 轮初实测（scripts/tmp-220-probe.js）：18 条统计/方法学陈述句 9 条被
// R1（时序连接×因果断言）误判 rewrite。红队报告 r214 §4 G7/G8 原句：
//   「控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应」
// —— 这是中介分析的标准结论句式（control X → direct effect still
// significant → partial mediation），「之后」是时序连接词、「说明」是
// 因果断言词，两腿恰好齐备；而 EN 同形句 pass（CONNECT_EN×ASSERT_EN 无
// 命中），中英不对称。
// 误伤样本的共性：句中出现**统计设计词汇**——控制/调整某个变量、或直接
// 出现效应/回归/协变量等估计术语。判别口径两条任一成立：
//   ① 控制动词 × 统计对象（控制/调整/纳入/… + 0-14 字 + 变量/因素/效应/…）
//   ② 「控制X之后，Y仍然显著/相关」的持续效应习语（中介分析定式）
//   ③ 裸统计术语在场（协变量/中介变量/固定效应/回归/直接效应/…）
// 反向保证：20 条攻击探针（含「我们调整了排期之后，交付就稳定了」这类
// 控制动词在场的真后此句）零条被本表豁免——它们的统计对象半全部缺席。
const STAT_CONTEXT_ZH = /(?:控制|调整|纳入|加入|考虑|剔除|排除|匹配|加权|分层)[^。]{0,14}(?:变量|因素|协变量|混杂|混淆|中介|固定效应|基线|选择偏差|调节|倾向得分|反事实|差距|差异|特征)|(?:控制|调整|纳入|加入|剔除|排除|匹配|加权|分层)[^。]{0,14}(?:之后|以后)[^。]{0,20}(?:仍然|依然|依旧|还是)[^。]{0,8}(?:显著|相关|存在|成立|稳健)|(?:变量|协变量|混杂|混淆变量|中介变量|固定效应|基线特征|选择偏差|倾向得分|调节变量|对照组|控制组|实验组|回归|方差分析|结构方程|路径系数|标准误|置信区间|p\s*[=<]|样本量|元分析|队列研究|双重差分|工具变量|反事实|估计系数|直接效应|间接效应|中介效应|处理效应|政策效应|主效应|调节效应)/;

// [r222] 方法学「排除性否定因果归属」豁免（五维共表，见
// src/methodology-exempt.js）：本表 STAT_CONTEXT_ZH 支②的持续效应习语
// 要求「控制动词 + ≤14 字 + 之后 + ≤20 字 + 仍然/依然 + ≤8 字 + 显著/
// 相关/存在/成立/稳健」，装不下「分层之后，各层效应方向一致，说明效应
// 不是由层间差异造成的」这类**否定归因形**方法学句（无「仍然/依然」紧
// 邻、归因对象「层间差异」不在统计对象表内）——r222 扩样 30 条里 6 条
// 落本维误伤。hasExclNegCausal 自带更严双条件（方法学动词 × 「不是由
// Z 造成的」），r221 F 节边缘攻击（「他上任之后利润就涨了，这不是巧合
// 造成的」无方法学动词、否定与归因间无「由」）不被误豁免。

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
  // [r220] 方法学/统计语境：中介分析、回归报告等标准结论句式（见
  // STAT_CONTEXT_ZH 注释）。判据只认统计设计词汇，不认「先后」本身，
  // 所以「调整了排期之后，交付就稳定了」这类真后此句不受影响。
  if (exemptZh || exemptEn) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '调查语境豁免' };
  }
  if (STAT_CONTEXT_ZH.test(text)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '方法学语境豁免' };
  }
  // [r222] 排除性否定归因豁免（五维共表，src/methodology-exempt.js）
  if (hasExclNegCausal(text)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '方法学语境豁免' };
  }

  // [audit-fix r177] 技术测量报告豁免（r166 审计设计、当日未落地，本轮补）：
  // 工程语境「We applied the patch. Latency dropped 40% after the
  // change.」是对改动前后量化指标的客观记录，干预动词×变化词同句即触发
  // R2 被误判 rewrite（r166 审计实测复现）。判据：量化变化（数字+%/
  // 百分点）× 技术测量名词（延迟/吞吐/错误率/CPU…）双在场才是测量报告。
  // 刻意不收医学症状名词（体温/疼痛/评分）——「吃了药疼痛减轻了40%」
  // 仍是后此谬误族；round-720 唯一 R2 攻击样本无数值，不受影响。
  const QUANT_MEASURE = /\d+(?:\.\d+)?\s*(?:%|percent|percentage\s+points?|百分点)/i;
  const TECH_METRIC_EN = /\b(?:latency|throughput|error\s+rate|response\s+time|cpu|memory|qps|p99|p95|rps|i\/o|disk|benchmark)s?\b/i;
  const TECH_METRIC_ZH = /(?:延迟|吞吐|错误率|响应时间|内存|耗时|成功率|失败率|占比|均值|qps|p99|p95|基准)/i;
  if (QUANT_MEASURE.test(text) && (TECH_METRIC_EN.test(lower) || TECH_METRIC_ZH.test(text))) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '测量报告豁免' };
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

  // R2 干预 × 症状变化（ZH 块）——干预腿走 hasInterveneZh（复合后缀护栏）
  if (INTERVENE_ZH.some((w) => hasInterveneZh(text, w)) && has(CHANGE_ZH, text)) {
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

module.exports = { checkPostHoc, STAT_CONTEXT_ZH, __internals: { CONNECT_ZH, ASSERT_ZH, INTERVENE_ZH, CHANGE_ZH, ABSENCE_ZH, CALAMITY_ZH, AVOID_ZH, CONNECT_EN, ASSERT_EN, INTERVENE_EN, CHANGE_EN, ABSENCE_EN, CALAMITY_EN, AVOID_EN, EXEMPT_ZH, EXEMPT_EN, STAT_CONTEXT_ZH } };
