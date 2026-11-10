'use strict';
// round-280  时间与概率推理 wired 维度全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r280 池化探针 coordination/agent4/probes/r280-probe-pool.js 实测：
// gamblers_reversal_zh 7/8 全穿透、appeal_prob_zh 2/3 穿透、
// prosecutor 镜像族 2/5 穿透；良性 23 条零误伤）：
//   A. gamblers_fallacy（赌徒谬误）——腿① 期/天/周开奖计数（十期没出）、
//      黑红连开（连续黑了五把/连黑）、倒霉时长（倒霉了这么久）、动词间隔形
//      （连着输了六个回合）、冷热时长（冷了这么多天）、运气持续差（运气
//      不可能一直差）；EN has been cold / been hot、luck can't stay bad、
//      cold streak/spell；腿② 不可能再[黑红输赢]（否定反转）、[准铁定]
//      [能会]?[赢中]（下一把准赢）、再怎么[也]?得…赢/中/回本（让步反转）、
//      [也该总]轮到X了、该[冷热][一这]?[把次]（该热一把）
//   B. appeal_to_probability（诉诸概率）——腿① 这么[高强]/那么[高]/
//      [希望胜算机会把握]这么[大高多好]（概率高度自然形）；腿② 肯定[跑逃溜]
//      不了/铁定/必定[会能]?/准[会能]?[发生中来成]（口语必然短收尾）
//   C. prosecutors_fallacy（检察官谬误镜像族）——腿① 设备误差率名词族
//      （误差率/错误率/误判率/漏检率/假阴性率…）+ 通用 N分之一 分数形；
//      腿② 无辜镜像（他是无辜的概率也只有百万分之一——P(匹配|无辜) 与
//      P(无辜|匹配) 颠倒）、判错镜像（这案子判错的概率也就千分之一——
//      误差率与个案错判概率混淆）；EN the chance he is innocent is /
//      the probability of innocence is
//
// 纪律：
//   - 维度计数不变（243）、src/index.js 零改动
//   - 探针口径：gate.action !== 'pass' 且 findings 承重该维度 = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const gfMod = require(path.join(__dirname, '..', 'src', 'gamblers-fallacy.js'));
const atpMod = require(path.join(__dirname, '..', 'src', 'appeal-to-probability.js'));
const pfMod = require(path.join(__dirname, '..', 'src', 'prosecutors-fallacy.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵（gate 层：维度承重且非 pass）──────────────────────────
const ATTACKS = [
  // A gamblers_fallacy（ZH 腿①新族 × 腿②）
  ['gamblers_fallacy', '这个号十期没出了，下期出它的概率大多了。'],
  ['gamblers_fallacy', '都连续黑了五把，下一把不可能再黑了。'],
  ['gamblers_fallacy', '连着输了六个回合，再怎么也得赢一回了。'],
  ['gamblers_fallacy', '倒霉了这么久，下一次总该轮到我走运。'],
  ['gamblers_fallacy', '背了这么久，下一次也轮到它了。'],
  ['gamblers_fallacy', '运气不可能一直差，下一把准赢。'],
  ['gamblers_fallacy', '冷了这么多天，该热一把了。'],
  ['gamblers_fallacy', '连续红了八期，下一期不可能再红了。'],
  // A gamblers_fallacy（EN 腿①新族 × 既有腿②）
  ['gamblers_fallacy', 'It has been cold for so long, a hot round is due.'],
  ['gamblers_fallacy', 'Luck can\u2019t stay bad forever; the next one is bound to pay out.'],
  // B appeal_to_probability（腿①新族 × 腿②新族）
  ['appeal_to_probability', '可能性这么高，铁定会发生。'],
  ['appeal_to_probability', '希望这么大，肯定跑不了。'],
  ['appeal_to_probability', '胜算那么高，十有八九会成。'],
  ['appeal_to_probability', '机会这么好，准会发生。'],
  // C prosecutors_fallacy（镜像族 + 误差率族）
  ['prosecutors_fallacy', 'DNA 比对吻合的概率是百万分之一，所以他是无辜的概率也只有百万分之一。'],
  ['prosecutors_fallacy', '误差率只有千分之二，这案子判错的概率也就千分之二。'],
  ['prosecutors_fallacy', 'The DNA match probability is one in a million, so the chance he is innocent is one in a million.'],
  ['prosecutors_fallacy', 'The test misses one in a billion, so the probability of innocence is one in a billion.'],
];

console.log('== 新攻击矩阵（' + ATTACKS.length + ' 条）==');
for (const [dim, s] of ATTACKS) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === dim);
  ok(carries && r.gate.action !== 'pass', dim + ' | ' + s.slice(0, 34));
}

// ─── 良性矩阵（承重即误伤）───────────────────────────────────────────
const DIMS = ['gamblers_fallacy', 'appeal_to_probability', 'prosecutors_fallacy'];
const BENIGN_SENTENCES = [
  // A gamblers_fallacy 良性（正确概率陈述/轮次叙事/天气）
  '十期没出只是随机波动，每期概率独立，不会因为没出就更容易出。',
  '虽然连续黑了五把，但每轮都是独立事件，概率不变。',
  '连着输了六个回合，但每局独立，下一局概率还是一样的。',
  '倒霉了这么久，终于转运了，这只是叙事，每件事概率并没变。',
  '运气不可能一直差，但也别把希望寄托在下一把翻本上。',
  '天气冷了这么多天，该回暖了，注意添衣。',
  '现在轮到它发球了，我方球员准备接招。',
  '连赢了五局，终于轮到它上场。',
  'It has been cold for so long, but each draw is an independent event.',
  'The weather can\u2019t stay cold forever; pack accordingly.',
  'My luck can\u2019t stay this bad, so I am going to stop gambling and review the odds.',
  // B appeal_to_probability 良性（对冲/证据语境）
  '希望这么大，但也要做好两手准备，概率不等于保证。',
  '可能性这么高，值得认真评估，但仍需数据验证。',
  '胜算这么大，也不能保证一定赢，独立事件每轮概率不变。',
  '机会这么好，不试试怎么知道，成不成看运气。',
  // C prosecutors_fallacy 良性（正确判别/证伪）
  'DNA 比对吻合的概率是百万分之一，但他是无辜的概率需要综合全案证据判断，不能直接等同。',
  '误差率只有千分之一，但这案子判错的概率受多种因素影响，不能简单折算。',
  '误判率长期维持在低位，司法机关仍在持续改进复核机制。',
  'The chance he is innocent is something the jury must weigh carefully.',
  'The error rate is 0.1%, and each case still requires individual review.',
  '虽然匹配概率极低，但先验概率和假阳性率决定了后验概率不能直接下结论。',
];
console.log('== 良性矩阵（' + BENIGN_SENTENCES.length + ' 条）==');
let fp = 0;
for (const s of BENIGN_SENTENCES) {
  const r = gate(s);
  const carried = DIMS.filter(d => (r.findings || []).some(f => f.dimension === d));
  if (carried.length) { fp++; console.log('  ❌ 误伤 ' + carried.join(',') + ' | ' + s.slice(0, 40)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 登记纪律 ────────────────────────────────────────────────────────
console.log('== 登记纪律 ==');
const G = gfMod.__internals(), A = atpMod.__internals(), P = pfMod.__internals();
ok(gfMod.checkGamblersFallacy.length === 2
  && atpMod.checkAppealToProbability.length === 2
  && pfMod.detectProsecutorsFallacy.length === 2,
  '三个模块均带 inject 钩子（负例通道）');
const srcHas = (re, needle) => re.source.includes(needle);
ok(srcHas(G.STREAK_ZH, '期天周节') && srcHas(G.STREAK_ZH, '连[续着]?[黑红]')
  && srcHas(G.STREAK_ZH, '[倒霉背晦]了') && srcHas(G.STREAK_ZH, '连着[输赢败开押]了')
  && srcHas(G.STREAK_ZH, '[冷热]了') && srcHas(G.STREAK_ZH, '运气[^。]{0,8}'),
  'STREAK_ZH 含 r280 新族（期天周/黑红/倒霉/连着输了/冷热/运气）');
ok(srcHas(G.STREAK_EN, 'been\\s+(?:cold|hot|dry)') && srcHas(G.STREAK_EN, '\\s+stay\\b')
  && srcHas(G.STREAK_EN, 'cold\\s+(?:streak|spell|run)'),
  'STREAK_EN 含 r280 新族（been cold / luck stay / cold streak）');
ok(srcHas(G.DUE_ZH, '不可能[再又][黑红输赢]') && srcHas(G.DUE_ZH, '[准铁定][能会]?[赢中]')
  && srcHas(G.DUE_ZH, '再怎么[也]?得') && srcHas(G.DUE_ZH, '[也该总]轮到[它我你他]了')
  && srcHas(G.DUE_ZH, '该[冷热][一这]?[把次]'),
  'DUE_ZH 含 r280 新族（不可能再/准赢/再怎么也得/轮到它了/该热一把）');
const arrHas = (arr, needle) => arr.some(re => re.source.includes(needle));
ok(arrHas(A.BASE_ZH, '这么[高强]') && arrHas(A.BASE_ZH, '[希望胜算机会把握][这那]么[大高多好]'),
  'BASE_ZH 含 r280 新族（这么高/希望胜算机会这么大高好多）');
ok(arrHas(A.CERTAIN_ZH, '肯定[跑逃溜]不了') && arrHas(A.CERTAIN_ZH, '铁定')
  && arrHas(A.CERTAIN_ZH, '十有八九') && arrHas(A.CERTAIN_ZH, '准[会能]?[发生中来成]'),
  'CERTAIN_ZH 含 r280 新族（肯定跑不了/铁定/十有八九/准会发生）');
ok(arrHas(P.RARE_MATCH_ZH, '误差率') && arrHas(P.RARE_MATCH_ZH, ']+分之['),
  'RARE_MATCH_ZH 含 r280 新族（误差率名词/通用 N分之一）');
ok(arrHas(P.GUILT_INFERENCE_ZH, '无辜') && arrHas(P.GUILT_INFERENCE_ZH, '判错'),
  'GUILT_INFERENCE_ZH 含 r280 新族（无辜镜像/判错镜像）');
ok(arrHas(P.GUILT_INFERENCE_EN, 'innocent'),
  'GUILT_INFERENCE_EN 含 r280 新族（innocent mirror）');

// ─── 负例：注入-删条 ─────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须转 miss）==');
const NEVER = /(?!x)x/;
const gf = (t, inj) => gfMod.checkGamblersFallacy(t, inj);
const atp = (t, inj) => atpMod.checkAppealToProbability(t, inj);
const pf = (t, inj) => pfMod.detectProsecutorsFallacy(t, inj);
// 从大正则常量里删掉指定新族（= 删除该新模式），换成永不匹配
const cutRe = (re, needle) => new RegExp(re.source.replace(needle, '(?!x)x'), re.flags.replace('g', ''));
// 从常量数组里删掉含指定子串的新腿
const dropLeg = (arr, needle) => arr.filter(re => !re.source.includes(needle));

const INJ = [
  // A gamblers 腿①新族（源码级删条）
  { label: 'STREAK_ZH 期天周开奖计数族', run: gf, text: '这个号十期没出了，下期出它的概率大多了。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '[二三四五六七八九十百千\\d]+[期天周节][没都][有出开中现冒]') } },
  { label: 'STREAK_ZH 黑红连开族', run: gf, text: '都连续黑了五把，下一把不可能再黑了。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '连[续着]?[黑红]') } },
  { label: 'STREAK_ZH 倒霉时长族', run: gf, text: '倒霉了这么久，下一次总该轮到我走运。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '[倒霉背晦]了[这那]?么?[久长]') } },
  { label: 'STREAK_ZH 动词间隔形（连着输了）', run: gf, text: '连着输了六个回合，再怎么也得赢一回了。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '连着[输赢败开押]了') } },
  { label: 'STREAK_ZH 冷热时长族', run: gf, text: '冷了这么多天，该热一把了。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '[冷热]了[这那]?么?[久长多]') } },
  { label: 'STREAK_ZH 运气持续差族', run: gf, text: '运气不可能一直差，下一把准赢。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '运气[^。]{0,8}(?:一直|始终|这么|那么|最近)[差背霉衰不好]') } },
  { label: 'STREAK_ZH 背了这么久（同一族第二条腿）', run: gf, text: '背了这么久，下一次也轮到它了。', inject: { STREAK_ZH: cutRe(G.STREAK_ZH, '[倒霉背晦]了[这那]?么?[久长]') } },
  // A gamblers 腿②新族
  { label: 'DUE_ZH 不可能再黑（否定反转）', run: gf, text: '都连续黑了五把，下一把不可能再黑了。', inject: { DUE_ZH: cutRe(G.DUE_ZH, '不可能[再又][黑红输赢]') } },
  { label: 'DUE_ZH 下一把准赢', run: gf, text: '运气不可能一直差，下一把准赢。', inject: { DUE_ZH: cutRe(G.DUE_ZH, '[准铁定][能会]?[赢中]') } },
  { label: 'DUE_ZH 再怎么也得赢一回', run: gf, text: '连着输了六个回合，再怎么也得赢一回了。', inject: { DUE_ZH: cutRe(G.DUE_ZH, '再怎么[也]?得[^。！？!?]{0,8}(?:赢|中|回本|翻本|中一)') } },
  { label: 'DUE_ZH 也轮到它了', run: gf, text: '背了这么久，下一次也轮到它了。', inject: { DUE_ZH: cutRe(G.DUE_ZH, '[也该总]轮到[它我你他]了') } },
  { label: 'DUE_ZH 该热一把了', run: gf, text: '冷了这么多天，该热一把了。', inject: { DUE_ZH: cutRe(G.DUE_ZH, '该[冷热][一这]?[把次]') } },
  // A gamblers EN 腿①新族
  { label: 'STREAK_EN has been cold', run: gf, text: 'It has been cold for so long, a hot round is due.', inject: { STREAK_EN: cutRe(G.STREAK_EN, 'been\\s+(?:cold|hot|dry)') } },
  { label: 'STREAK_EN luck can\u2019t stay', run: gf, text: 'Luck can\u2019t stay bad forever; the next one is bound to pay out.', inject: { STREAK_EN: cutRe(G.STREAK_EN, '\\s+stay\\b') } },
  // B appeal_to_probability 腿①新族
  { label: 'BASE_ZH 这么高（可能性这么高）', run: atp, text: '可能性这么高，铁定会发生。', inject: { BASE_ZH: dropLeg(A.BASE_ZH, '这么[高强]') } },
  { label: 'BASE_ZH 希望胜算机会这么好（胜算这么好）', run: atp, text: '胜算这么好，十有八九会成。', inject: { BASE_ZH: dropLeg(A.BASE_ZH, '[希望胜算机会把握][这那]么[大高多好]') } },
  // B appeal_to_probability 腿②新族
  { label: 'CERTAIN_ZH 肯定跑不了', run: atp, text: '希望这么大，肯定跑不了。', inject: { CERTAIN_ZH: dropLeg(A.CERTAIN_ZH, '肯定[跑逃溜]不了') } },
  { label: 'CERTAIN_ZH 铁定会发生', run: atp, text: '可能性这么高，铁定会发生。', inject: { CERTAIN_ZH: dropLeg(A.CERTAIN_ZH, '铁定') } },
  { label: 'CERTAIN_ZH 十有八九', run: atp, text: '胜算那么高，十有八九会成。', inject: { CERTAIN_ZH: dropLeg(A.CERTAIN_ZH, '十有八九') } },
  { label: 'CERTAIN_ZH 准会发生', run: atp, text: '机会这么好，准会发生。', inject: { CERTAIN_ZH: dropLeg(A.CERTAIN_ZH, '准[会能]?[发生中来成]') } },
  // C prosecutors_fallacy 腿②镜像族
  { label: 'GUILT_ZH 无辜镜像', run: pf, text: 'DNA 比对吻合的概率是百万分之一，所以他是无辜的概率也只有百万分之一。', inject: { GUILT_INFERENCE_ZH: dropLeg(P.GUILT_INFERENCE_ZH, '无辜') } },
  { label: 'GUILT_ZH 判错镜像', run: pf, text: '误差率只有千分之二，这案子判错的概率也就千分之二。', inject: { GUILT_INFERENCE_ZH: dropLeg(P.GUILT_INFERENCE_ZH, '判错') } },
  { label: 'GUILT_EN innocent mirror', run: pf, text: 'The DNA match probability is one in a million, so the chance he is innocent is one in a million.', inject: { GUILT_INFERENCE_EN: dropLeg(P.GUILT_INFERENCE_EN, 'innocent') } },
  { label: 'GUILT_EN probability of innocence', run: pf, text: 'The test misses one in a billion, so the probability of innocence is one in a billion.', inject: { GUILT_INFERENCE_EN: dropLeg(P.GUILT_INFERENCE_EN, 'of\\s+(?:innocence') } },
  // C prosecutors_fallacy 腿①误差率族（两条新腿联合删）
  { label: 'RARE_ZH 误差率族+通用分之一形', run: pf, text: '误差率只有千分之二，这案子判错的概率也就千分之二。', inject: { RARE_MATCH_ZH: dropLeg(dropLeg(P.RARE_MATCH_ZH, '误差率'), ']+分之[') } },
];
let injRed = 0;
for (const c of INJ) {
  let before = false, after = true;
  try {
    before = c.run(c.text).hit === true;
    after = c.run(c.text, c.inject).hit === true;
  } catch (e) {
    ok(false, '注入删条变红: ' + c.label + '（异常 ' + e.message + '）');
    continue;
  }
  ok(before && !after, '注入删条变红: ' + c.label);
  if (before && !after) injRed++;
}

// ─── 汇总 ───────────────────────────────────────────────────────────
console.log('\n=== r280 轮测汇总: passed=' + passed + ' failed=' + failed + ' 注入变红=' + injRed + '/' + INJ.length + ' ===');
if (failed > 0) { process.exitCode = 1; }
