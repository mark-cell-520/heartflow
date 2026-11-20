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
 * [r426 扩展·真升级②] 新增路由：
 *   R5 事件先后×玄学归因：腿①事件先后标记（存量 CONNECT 之外补「结果/
 *      后来/那天/当天/上次/早上/下午」等裸时序形，EN 补强时序词与
 *      「…, and …」逗号并置形）× 腿②玄学归因标记（果然/果真；旺运财帛
 *      族；晦气显灵财神菩萨开光辟邪符咒护身符手串等迷信物象；拜了拜/
 *      上香/祈福/算卦等仪式动作；「杯子摔了」器物破损兆——宾语锁防
 *      「摔了一跤」误入；EN luck/charm/blessing/ritual/jinx/cursed/
 *      karma/feng shui 等 \b 词边界形）。存量四路由射程外：R1 的
 *      CONNECT 表不收裸时序形（「后来项目就黄了」的「后来」与「就」
 *      不相邻，'后来就' 子串匹配不到）、ASSERT 表只收晦气/玄学/显灵/
 *      灵验/邪门 五窄形。豁免：沿用调查语境/测量报告豁免 + 新增 R5 否定
 *      对冲（巧合/没有关系/只是先后/无关/需要对照数据——仅作用本路由）。
 *      同池探针定拨 Q1：穿透 11/12、模块层良性 0/12、模块层攻击 0/12
 *      真零命中（coordination/agent4/probes/r426-probe-pool.js）。
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

// ═══════════════════════════════════════════════════════════════
// [r426 扩展·真升级②] R5「事件先后 × 玄学归因」族分支表
// （同池探针 coordination/agent4/probes/r426-probe-pool.js 定拨 Q1：
//  穿透 11/12、模块层良性 0/12、模块层攻击 0/12 真零命中）
// 形状：一件日常动作与后续结果先后相随，就把结果归给超自然/运势/
// 仪式兆头（「那天出门摔了一跤，果然当天就下雨了」「临走前把杯子
// 摔了，后来团队就散了」）。存量四路由全部射程外：R1 的 CONNECT 表
// 不收「结果/后来/那天/上次」等裸时序形（「后来项目就黄了」中「后来」
// 与「就」不相邻，'后来就' 子串匹配不到），ASSERT 表只收
// 晦气/玄学/显灵/灵验/邪门 五个窄形，旺运/仪式/辟邪物整族不在场。
// 判据：腿①事件先后标记 × 腿②玄学归因标记，句级共现 + 否定对冲豁免。
// ═══════════════════════════════════════════════════════════════

// R5 腿①：事件先后标记新族（ZH）——存量 CONNECT_ZH 之外的裸时序形。
// 「结果」极常见故不作单腿判据，必须与腿②共现；不收「昨天/今天」
// （太日常，无归因标记时纯叙事）。
const SEQ_ZH_R5 = [
  '结果', '后来', '那天', '当天', '上次', '次日', '临走前', '出门前', '开会前', '事前', '事后',
  '早上', '上午', '下午', '晚上', '当晚', '那天起',
];
// R5 腿①（EN）——显式时序词 + 逗号-and 并置形（"…, and …"：
// He forgot to say the blessing, and the client walked away.）。
// 刻意不收裸 after/since/once（CONNECT_EN 已收，但过于日常，
// 与 OMEN 共现会把 "After the ritual, the team felt confident."
// 这类描述句误判——R5 的 EN 侧只要强时序形）。
const SEQ_EN_R5 = [
  'later that day', 'that day', 'the next day', 'sure enough', 'right afterward', 'right afterwards',
];
const JUXTAPOSE_EN = /,\s+(?:and|so)\b/;

// R5 腿②：玄学归因标记（ZH）——把先后结果归给运势/兆头/仪式。
// 与存量 ASSERT_ZH 的分工：晦气/玄学/显灵/灵验/邪门 已在 ASSERT 表
// （R1 承重），本表补旺运财帛、仪式动作、器物破损兆与归因副词，
// 两表可重叠共现但互不依赖（负例逐表删条各自有样本翻转）。
const OMEN_ZH = [
  // o1 归因副词（「果然」= 事后诸葛式确认）
  '果然', '果真',
  // o2 运势财帛（「旺」只收带后缀/主语形——裸「旺」会中「旺季」）
  '真旺', '旺了起来', '旺起来', '旺我', '旺宅', '旺夫', '财运', '旺财', '招财', '进宝',
  '转运', '开运', '运势', '气运', '命数', '天意',
  // o3 迷信物象/仪式场域
  '晦气', '显灵', '灵验', '邪门', '玄学', '风水', '财神', '菩萨', '保佑', '开光',
  '辟邪', '符咒', '护身符', '手串', '佛珠', '八字', '相冲', '彩头', '讨彩', '吉利', '霉运',
  // o4 仪式动作
  '拜了拜', '拜一拜', '拜了', '上香', '烧香', '祈福', '求签', '算卦', '占卜', '念咒',
  '犯了忌讳', '破了忌讳',
];
// o5 器物破损兆（「临走前把杯子摔了」——打碎东西不吉利；宾语锁防
// 「摔了一跤」误入：腿形要求 杯子|碗|碟|花瓶|镜子|餐具|玉件 作宾语）
const OMEN_BREAK_ZH = /(?:杯子|碗|碟|花瓶|镜子|餐具|玉件|镯子)(?:被)?摔(?:了|碎|破|坏)|打碎(?:了)?(?:杯子|碗|花瓶|镜子|碟)/;
// R5 腿②（EN）——\b 词边界匹配（luck 不中 unlucky 内部的 luck——
// 实际 \bluck\b 要求边界，unlucky 无边界故不中；charm 不中 charmed）
const OMEN_EN = [
  'luck', 'lucky', 'charm', 'blessing', 'ritual', 'sure enough', 'jinx',
  'cursed', 'bad omen', 'omen', 'karma', 'feng shui', 'fate', 'voodoo',
  'it works', 'superstition',
];
// R5 否定对冲豁免（仅作用路由⑤）——样本在否认先后因果或要求数据时，
// 即使两腿在场也不判。与 EXEMPT（调查语境）分工：那条管「正在排查」
// 的方法论陈述，这条管「明确否认因果」的叙事句。
const R5_NEGATE_ZH = /巧合|没有(?:任何)?(?:关系|因果|证据|联系)|只是(?:先后|时间上|碰巧)|纯属|无关|不能只归因|需要(?:对照|数据|证据|更多|分析|排查|复盘)/;
const R5_NEGATE_EN = /coincidence|unrelated|no (?:causal )?(?:relation|connection|evidence)|just (?:a )?(?:coincidence|sequence)|need (?:more )?(?:data|evidence)|not (?:necessarily|related)/i;

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
 * @param {object} [inject] [r426] 负例脚本注入用：以永不匹配串/自定义正则
 *   替换 R5 新族常量（SEQ_ZH_R5/SEQ_EN_R5/JUXTAPOSE_EN/OMEN_ZH/
 *   OMEN_BREAK_ZH/OMEN_EN/R5_NEGATE_ZH/R5_NEGATE_EN），存量四路由不受影响
 * @returns {{score:number,count:number,matches:Array,zeroHit:boolean,details:string}}
 */
function checkPostHoc(text, inject) {
  if (typeof text !== 'string' || text.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '' };
  }

  const R = inject || {};
  const SEQ_ZH_R5_ = R.SEQ_ZH_R5 || SEQ_ZH_R5;
  const SEQ_EN_R5_ = R.SEQ_EN_R5 || SEQ_EN_R5;
  const JUXTAPOSE_EN_ = R.JUXTAPOSE_EN || JUXTAPOSE_EN;
  const OMEN_ZH_ = R.OMEN_ZH || OMEN_ZH;
  const OMEN_BREAK_ZH_ = R.OMEN_BREAK_ZH || OMEN_BREAK_ZH;
  const OMEN_EN_ = R.OMEN_EN || OMEN_EN;
  const R5_NEGATE_ZH_ = R.R5_NEGATE_ZH || R5_NEGATE_ZH;
  const R5_NEGATE_EN_ = R.R5_NEGATE_EN || R5_NEGATE_EN;

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

  // R2 干预 × 症状变化（ZH 块）
  if (has(INTERVENE_ZH, text) && has(CHANGE_ZH, text)) {
    routes.add(2);
    matches.push({ route: 2, legA: '干预', legB: '变化' });
  }
  // R2 干预 × 症状变化（EN 块——干预腿用词边界匹配，防 got⊂renegotiate 类子串误判）
  // [r267 修复] 机构/复数主语 + 无归因断言 → 不触发：旧式仅 `干预词 × 变化词`
  // 两腿粗匹配，把 "Many families installed water purifiers, and water quality
  // improved measurably." / "The city installed bike lanes, and traffic congestion
  // dropped citywide." 这类中性公共趋势叙述判为事后归因（route 2 score 68 →
  // gate rewrite）。区分规则：机构/复数主语（many/the/our + 复数名词/机构词）
  // 且句中无归因断言（ASSERT_EN: proves/is why/to blame/which proves…）时，
  // 属公共指标陈述而非个人因果归因，不触发 R2 EN。
  // 存量 R2 EN 攻击 5 条（个人第一/第三人称叙事）不受影响（探针实证）。
  // ATK6 "Neighborhoods that installed doorbell cameras…so doorbell cameras are
  // attracting thieves" 现码 post_hoc score 0（由 false_cause 代拦），不受影响。
  const INSTITUTIONAL_EN = /^\s*(?:many|the|most|several|our|some|these|those|neighborhoods?|residents?|households?|families|companies|cities|schools|people|users|drivers|teams|stores|factories|governments?|officials?|researchers?|studies|reports)\b/i;
  const interventionEn = hasWord(INTERVENE_EN, lower);
  const changeEn = has(CHANGE_EN, lower);
  const attributionEn = has(ASSERT_EN, lower);
  if (interventionEn && changeEn && (attributionEn || !INSTITUTIONAL_EN.test(text))) {
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

  // ═══ [r426] R5 事件先后 × 玄学归因 ═══
  // 腿①事件先后标记（存量 CONNECT ∪ 新裸时序形）× 腿②玄学归因标记。
  // EN 侧刻意不走裸 after/since/once（CONNECT_EN）——日常介词与 OMEN
  // 共现会把 "After the ritual, the team felt confident." 这类描述句
  // 误判，故只要强时序词或逗号-and 并置形。OMEN_EN 用词边界匹配
  // （charm 不中 charmed、luck 不中 unlucky）。R5_NEGATE 只作用本路由。
  const r5Negate = R5_NEGATE_ZH_.test(text) || R5_NEGATE_EN_.test(lower);
  if (!r5Negate) {
    const seqZh = has(SEQ_ZH_R5_, text);
    const seqEn = hasWord(SEQ_EN_R5_, lower) || JUXTAPOSE_EN_.test(text);
    const omenZh = has(OMEN_ZH_, text) || OMEN_BREAK_ZH_.test(text);
    const omenEn = hasWord(OMEN_EN_, lower);
    if ((has(CONNECT_ZH, text) || seqZh) && omenZh) {
      routes.add(5);
      matches.push({ route: 5, legA: '事件先后', legB: '玄学归因' });
    }
    if (seqEn && omenEn) {
      routes.add(5);
      matches.push({ route: 5, legA: 'sequence', legB: 'omen-attribution' });
    }
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

module.exports = { checkPostHoc, __internals: { CONNECT_ZH, ASSERT_ZH, INTERVENE_ZH, CHANGE_ZH, ABSENCE_ZH, CALAMITY_ZH, AVOID_ZH, CONNECT_EN, ASSERT_EN, INTERVENE_EN, CHANGE_EN, ABSENCE_EN, CALAMITY_EN, AVOID_EN, EXEMPT_ZH, EXEMPT_EN, SEQ_ZH_R5, SEQ_EN_R5, JUXTAPOSE_EN, OMEN_ZH, OMEN_BREAK_ZH, OMEN_EN, R5_NEGATE_ZH, R5_NEGATE_EN } };
