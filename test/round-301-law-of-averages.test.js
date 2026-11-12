'use strict';
// round-301  时间与概率推理 wired 维度全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r301 池化探针 scripts/round-301/probe-candidates{1,2,3}-r301.js 实测，
// v6.8.174 改前 gate()：候选族 A 虚假类比 2/10、B 期望值≠概率 3/10、
// C/G 规则例外滥用 10/14、D 诉诸沉默 6/10、F 量词换位 5/6 穿透中，
// 最终立项 P5「长期平均论证短期补偿」族——存量 gamblers_fallacy（第148维）
// 对 4/5 攻击整句穿透且良性干净）：
//   gamblers_fallacy（赌徒谬误）「长期平均论证 × 短期补偿」族（law of
//   averages）+「连发形 × 追投行动」族：
//     腿① LLN_ZH/LLN_EN 长期平均论证——长期看输赢总会扯平 / 样本越多
//       结果越接近均值 / 频率回归平均（EN: in the long run … even out /
//        revert to the average / as the sample grows / with more trials /
//        law of averages）：存量腿①只收 streak 事实、腿②只收「该赢了/
//       due」预期形，引用长期平均为短期补偿背书这一经典论证外壳整体
//       缺席（探针 4/5 穿透实证）。
//     腿② CHASE_ZH/CHASE_EN 追投行动——加倍下注/梭哈/全押/加码/重注
//       （EN: double down / all in / raise the stakes / win it back）：
//       平衡义务的行动面表达，存量腿②不收。
//     三条新路由（与存量路由并行，不并存量数组——避 r265 length===N
//       断言纪律）：streak×chase、lln×due、lln×chase（中英各三条）。
//
// 纪律：
//   - 维度计数不变（246）、src/index.js 零改动、VERSION 不 bump（同 r297-r300 先例）
//   - 探针口径：gate.action !== 'pass' 且 findings 承重该维度 = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss
//   - 已知基线（改前实测，git stash 对照 51/2 完全一致，非本轮引入）：
//     r280 轮测 2 条既有失败——良性「天气冷了这么多天，该回暖了」被存量
//     daily×reversal 路由承重（r289 族既有 FP）+ 1 条注入删条；本轮良性
//     矩阵因此剔除该句并在此登记，不与新族混计。
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const gfMod = require(path.join(__dirname, '..', 'src', 'gamblers-fallacy.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵（gate 层：维度承重且非 pass）──────────────────────────
const ATTACKS = [
  // ZH — lln×chase（长期平均论证 × 追投行动）
  ['gamblers_fallacy', '长期看输赢总会扯平，所以现在连输五把正是加倍下注的好时机。'],
  ['gamblers_fallacy', '长远看正反面的次数总会扯平，这一把运气该回来了。'],
  ['gamblers_fallacy', '概率保证频率会回归平均，所以下一把该赢回来了。'],
  // ZH — streak×chase（连发形 × 追投行动）
  ['gamblers_fallacy', '次数越多，结果越会回归均值，现在连败三局，正是加码的时候。'],
  ['gamblers_fallacy', '拉长看，正反面出现次数总会扯平，连续五次正面之后，下一把该全押反面了。'],
  ['gamblers_fallacy', '长期来看输赢的概率会互相抵消，所以连输五把之后该梭哈了。'],
  ['gamblers_fallacy', '他已经连输五把了，再这样下去我得加注。'],
  ['gamblers_fallacy', '连续三把没中，我决定梭哈。'],
  // ZH — lln×due（无连发形在场）
  ['gamblers_fallacy', '样本越多结果越接近均值，这一把该把之前输的全赢回来。'],
  ['gamblers_fallacy', '试验次数越多频率越稳定，下一把准赢。'],
  // EN — lln×chase / streak×chase
  ['gamblers_fallacy', 'In the long run wins and losses even out, so after five losses it is time to double the bet.'],
  ['gamblers_fallacy', 'Over many trades the results average out, so after a losing streak you should raise the stakes.'],
  ['gamblers_fallacy', 'It has been cold for so long, so it is time to go all in on the next hand.'],
  ['gamblers_fallacy', 'Over time, luck evens out, so a win is due.'],
  // EN — lln×due
  ['gamblers_fallacy', 'Frequencies revert to the average, so after ten smalls in a row a big is due.'],
  ['gamblers_fallacy', 'As the sample grows, outcomes revert to the mean, so a win is due.'],
  ['gamblers_fallacy', 'With more flips the frequency settles toward the mean, so heads is due.'],
  ['gamblers_fallacy', 'The law of averages says a big number is due after so many smalls.'],
];
console.log('== 攻击矩阵（' + ATTACKS.length + ' 条）==');
let atkHit = 0;
for (const [dim, s] of ATTACKS) {
  const r = gate(s);
  const carried = (r.findings || []).some(f => f.dimension === dim);
  const nonPass = r.gate && r.gate.action && r.gate.action !== 'pass';
  if (carried && nonPass) atkHit++;
  else console.log('  ❌ 未承重/被放行 gate=' + (r.gate && r.gate.action) + ' | ' + s.slice(0, 44));
}
ok(atkHit === ATTACKS.length, '攻击全部承重且非 pass（' + atkHit + '/' + ATTACKS.length + '）');

// ─── 良性矩阵（不得承重 gamblers_fallacy）──────────────────────────
const BENIGN_SENTENCES = [
  // 正确概率陈述（独立性原理/大数定律正确用法）
  '长期看频率趋近概率，但每一局都是独立事件，不存在「该回了」。',
  '样本越多估计越准，但下一把的概率与历史无关。',
  '大数定律说的是长期频率，不是短期补偿。',
  // 风险管理（连发形在场但行动是减仓不是追投）
  '连输五把之后，风险管理要求减半仓位而不是加倍。',
  '连赢三局之后，他反而降低了投注额。',
  // r280 既有良性（不得回归）
  '运气不可能一直差，但也别把希望寄托在下一把翻本上。',
  '十期没出只是随机波动，每期概率独立，不会因为没出就更容易出。',
  '虽然连续黑了五把，但每轮都是独立事件，概率不变。',
  '连着输了六个回合，但每局独立，下一局概率还是一样的。',
  '倒霉了这么久，终于转运了，这只是叙事，每件事概率并没变。',
  '现在轮到它发球了，我方球员准备接招。',
  '连赢了五局，终于轮到它上场。',
  // 投资语境（LLN 在场但无 DUE/CHASE 腿——时点判断不是平衡义务）
  '长期看房价会回归均值，不过抄底时点要看现金流和利率，不是看连跌几个月。',
  '随着样本量增加，检验功效会提高，这是统计学的常识。',
  // EN 既有良性
  'It has been cold for so long, but each draw is an independent event.',
  'The weather can\u2019t stay cold forever; pack accordingly.',
  'My luck can\u2019t stay this bad, so I am going to stop gambling and review the odds.',
  // EN 正确概率陈述/风险管理
  'In the long run frequencies approach probability, but each round is independent.',
  'The law of large numbers governs long-run frequencies, not the next trade.',
  'After a losing streak, risk management calls for smaller positions, not bigger bets.',
  'As the sample grows, estimates get more precise, but each flip is still independent.',
];
console.log('== 良性矩阵（' + BENIGN_SENTENCES.length + ' 条）==');
let fp = 0;
for (const s of BENIGN_SENTENCES) {
  const r = gate(s);
  const carried = (r.findings || []).some(f => f.dimension === 'gamblers_fallacy');
  if (carried) { fp++; console.log('  ❌ 误伤 | ' + s.slice(0, 44)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 存量回归（r717/r280/r289 攻击不得回归）────────────────────────
console.log('== 存量回归 ==');
const REGRESSION = [
  '已经连输五把了，下一把肯定赢。',
  '都出十次小了，该出大了。',
  '这个号十期没出了，下期出它的概率大多了。',
  '都连续黑了五把，下一把不可能再黑了。',
  '连着输了六个回合，再怎么也得赢一回了。',
  '倒霉了这么久，下一次总该轮到我走运。',
  '运气不可能一直差，下一把准赢。',
  '冷了这么多天，该热一把了。',
  '连续迟到五天，今天该准时到了。',
  'It has been tails five times in a row, so heads is due next.',
  'After ten losses, a win is statistically more likely now.',
  'It has been cold for so long, a hot round is due.',
];
let regOk = 0;
for (const s of REGRESSION) {
  const r = gate(s);
  const carried = (r.findings || []).some(f => f.dimension === 'gamblers_fallacy');
  if (carried && r.gate.action !== 'pass') regOk++;
  else console.log('  ❌ 存量回归失败 | ' + s.slice(0, 40));
}
ok(regOk === REGRESSION.length, '存量路由零回归（' + regOk + '/' + REGRESSION.length + '）');

// ─── 登记纪律 ────────────────────────────────────────────────────────
console.log('== 登记纪律 ==');
const G = gfMod.__internals();
ok(gfMod.checkGamblersFallacy.length === 2, '模块带 inject 钩子（函数元数=2）');
const srcHas = (re, needle) => re.source.includes(needle);
ok(G.LLN_ZH && srcHas(G.LLN_ZH, '长期') && srcHas(G.LLN_ZH, '扯平')
  && srcHas(G.LLN_ZH, '越[多大小长]') && srcHas(G.LLN_ZH, '(?:回归|趋近|回到|靠近|集中于)'),
  'LLN_ZH 含 r301 新族（长期扯平/样本越多/频率回归）');
ok(G.LLN_EN && srcHas(G.LLN_EN, 'in\\s+the\\s+long\\s+run') && srcHas(G.LLN_EN, 'even\\s+out')
  && srcHas(G.LLN_EN, 'revert\\s+to\\s+the') && srcHas(G.LLN_EN, 'law\\s+of\\s+averages'),
  'LLN_EN 含 r301 新族（in the long run / even out / revert / law of averages）');
ok(G.CHASE_ZH && srcHas(G.CHASE_ZH, '加倍[下押投注]') && srcHas(G.CHASE_ZH, '梭哈')
  && srcHas(G.CHASE_ZH, '全押') && srcHas(G.CHASE_ZH, '加码'),
  'CHASE_ZH 含 r301 新族（加倍下注/梭哈/全押/加码）');
ok(G.CHASE_EN && srcHas(G.CHASE_EN, 'double\\s+down') && srcHas(G.CHASE_EN, 'all\\s+in')
  && srcHas(G.CHASE_EN, 'raise\\s+the') && srcHas(G.CHASE_EN, 'win\\s+it'),
  'CHASE_EN 含 r301 新族（double down / all in / raise / win it back）');
// 存量数组长度不变（新族不并存量数组——r265 纪律）
ok(srcHas(G.STREAK_ZH, '期天周节') && srcHas(G.DUE_ZH, '不可能[再又][黑红输赢]')
  && srcHas(G.STREAK_DAILY_ZH, '迟到') && srcHas(G.DUE_DAILY_ZH, '回暖'),
  '存量腿逐字保留（r280/r289 族仍在原位）');

// ─── 负例：注入-删条 ─────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须转 miss）==');
const NEVER = /(?!x)x/;
const gf = (t, inj) => gfMod.checkGamblersFallacy(t, inj);
// 从大正则常量里删掉指定新族（= 删除该新模式），换成永不匹配
const cutRe = (re, needle) => new RegExp(re.source.replace(needle, '(?!x)x'), re.flags.replace('g', ''));

const INJ = [
  // LLN_ZH 三分支逐支删
  { label: 'LLN_ZH 长期/长远/拉长分支', run: gf, text: '长远看正反面的次数总会扯平，这一把运气该回来了。', inject: { LLN_ZH: cutRe(G.LLN_ZH, '(?:长期|长远|拉长[看时]|时间拉长)') } },
  { label: 'LLN_ZH 样本/次数越多分支', run: gf, text: '样本越多结果越接近均值，这一把该把之前输的全赢回来。', inject: { LLN_ZH: cutRe(G.LLN_ZH, '(?:样本|次数|试验|投掷|对局|局数|重复|数据量)越[多大小长]') } },
  { label: 'LLN_ZH 频率/概率回归分支', run: gf, text: '概率保证频率会回归平均，所以下一把该赢回来了。', inject: { LLN_ZH: cutRe(G.LLN_ZH, '(?:频率|胜率|概率|均值)[^。！？!?]{0,8}(?:回归|趋近|回到|靠近|集中于)') } },
  // LLN_EN 四分支逐支删
  { label: 'LLN_EN over time', run: gf, text: 'Over time, luck evens out, so a win is due.', inject: { LLN_EN: cutRe(G.LLN_EN, 'over\\s+time') } },
  { label: 'LLN_EN with more flips', run: gf, text: 'With more flips the frequency settles toward the mean, so heads is due.', inject: { LLN_EN: cutRe(G.LLN_EN, 'with\\s+more\\s+(?:trials|trades|rounds|bets|flips|games|data)') } },
  { label: 'LLN_EN law of averages', run: gf, text: 'The law of averages says a big number is due after so many smalls.', inject: { LLN_EN: cutRe(G.LLN_EN, 'law\\s+of\\s+averages') } },
  // CHASE_ZH 逐元素删
  { label: 'CHASE_ZH 加倍下注', run: gf, text: '长期看输赢总会扯平，所以现在连输五把正是加倍下注的好时机。', inject: { CHASE_ZH: cutRe(G.CHASE_ZH, '加倍[下押投注]') } },
  { label: 'CHASE_ZH 梭哈', run: gf, text: '长期来看输赢的概率会互相抵消，所以连输五把之后该梭哈了。', inject: { CHASE_ZH: cutRe(G.CHASE_ZH, '梭哈') } },
  { label: 'CHASE_ZH 加码', run: gf, text: '次数越多，结果越会回归均值，现在连败三局，正是加码的时候。', inject: { CHASE_ZH: cutRe(G.CHASE_ZH, '加码') } },
  // CHASE_EN 逐元素删
  { label: 'CHASE_EN double the bet', run: gf, text: 'In the long run wins and losses even out, so after five losses it is time to double the bet.', inject: { CHASE_EN: cutRe(G.CHASE_EN, 'double\\s+(?:the|my|your|our)\\s+(?:bet|stake|wager)') } },
  { label: 'CHASE_EN raise the stakes', run: gf, text: 'Over many trades the results average out, so after a losing streak you should raise the stakes.', inject: { CHASE_EN: cutRe(G.CHASE_EN, 'raise\\s+the\\s+(?:bet|stake|stakes)') } },
  // 路由级证明：streak 腿全置空后 lln 路由仍须独立命中（证新路由不依赖存量腿）
  { label: 'STREAK_ZH 全删后 lln×due 仍独立命中', mode: 'independent', run: gf, text: '样本越多结果越接近均值，这一把该把之前输的全赢回来。', inject: { STREAK_ZH: NEVER, STREAK_DAILY_ZH: NEVER } },
  { label: 'STREAK_EN 全删后 lln×due 仍独立命中', mode: 'independent', run: gf, text: 'Frequencies revert to the average, so after ten smalls in a row a big is due.', inject: { STREAK_EN: NEVER } },
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
  if (c.mode === 'independent') {
    ok(before && after, '路由独立性: ' + c.label);
    continue;
  }
  ok(before && !after, '注入删条变红: ' + c.label);
  if (before && !after) injRed++;
}

// ─── 汇总 ───────────────────────────────────────────────────────────
console.log('\nr301 测试结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
console.log('=== r301 轮测汇总: passed=' + passed + ' failed=' + failed + ' 注入变红=' + injRed + '/' + INJ.length + ' ===');
if (failed > 0) { process.exitCode = 1; }
