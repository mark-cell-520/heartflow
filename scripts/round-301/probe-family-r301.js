/* scripts/round-301/probe-family-r301.js — r301 新族功能探针（只读）
 * 改后验证：LLN/CHASE 四常量 + 三条并行路由的命中与豁免。
 */
const path = require('path');
const { checkGamblersFallacy } = require(path.join(__dirname, '..', '..', 'src', 'gamblers-fallacy.js'));
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const ATTACK = [
  // ZH — lln×chase / streak×chase
  '长期看输赢总会扯平，所以现在连输五把正是加倍下注的好时机。',
  '次数越多，结果越会回归均值，现在连败三局，正是加码的时候。',
  '拉长看，正反面出现次数总会扯平，连续五次正面之后，下一把该全押反面了。',
  '长期来看输赢的概率会互相抵消，所以连输五把之后该梭哈了。',
  // ZH — lln×due（无连发形在场）
  '样本越多结果越接近均值，这一把该把之前输的全赢回来。',
  // EN — lln×chase / streak×chase / lln×due
  'In the long run wins and losses even out, so after five losses it is time to double the bet.',
  'Frequencies revert to the average, so after ten smalls in a row a big is due.',
  'As the sample grows, outcomes revert to the mean, so a win is due.',
  'Over many trades the results average out, so after a losing streak you should raise the stakes.',
  'It has been cold for so long, so it is time to go all in on the next hand.',
];

const BENIGN = [
  // 正确概率陈述（EVIDENCE_PRESENT 或无双腿）
  '长期看频率趋近概率，但每一局都是独立事件，不存在「该回了」。',
  '样本越多估计越准，但下一把的概率与历史无关。',
  '大数定律说的是长期频率，不是短期补偿。',
  // 风险管理/非追投
  '连输五把之后，风险管理要求减半仓位而不是加倍。',
  // r280 既有良性（不得回归）
  '运气不可能一直差，但也别把希望寄托在下一把翻本上。',
  '天气冷了这么多天，该回暖了，注意添衣。',
  '十期没出只是随机波动，每期概率独立，不会因为没出就更容易出。',
  // 投资语境（LLN 在场但无 DUE/CHASE 腿）
  '长期看房价会回归均值，不过抄底时点要看现金流和利率，不是看连跌几个月。',
  // EN
  'In the long run frequencies approach probability, but each round is independent.',
  'The law of large numbers governs long-run frequencies, not the next trade.',
  'After a losing streak, risk management calls for smaller positions, not bigger bets.',
  'My luck cannot stay this bad, so I am going to stop gambling and review the odds.',
  'It has been cold for so long, but each draw is an independent event.',
];

let a = 0, b = 0;
console.log('=== ATTACK（模块直调）===');
for (const s of ATTACK) {
  const r = checkGamblersFallacy(s);
  if (r.hit) a++; else console.log('  MISS | ' + s.slice(0, 52));
}
console.log('=== BENIGN（模块直调）===');
for (const s of BENIGN) {
  const r = checkGamblersFallacy(s);
  if (r.hit) { b++; console.log('  FP!! | ' + s.slice(0, 52) + ' | ' + r.detail); }
}
console.log('=== GATE 层（承重维度 + action）===');
let gCaught = 0;
for (const s of ATTACK) {
  const g = hf.gate(s);
  const action = g.gate && g.gate.action;
  const dims = (g.findings || []).map(f => f.dimension).join(',');
  const carried = dims.includes('gamblers_fallacy');
  if (action && action !== 'pass') gCaught++;
  console.log('  ' + (carried ? 'CARRY' : '-----') + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 44));
}
let gBenign = 0;
for (const s of BENIGN) {
  const g = hf.gate(s);
  const action = g.gate && g.gate.action;
  const dims = (g.findings || []).map(f => f.dimension).join(',');
  const carried = dims.includes('gamblers_fallacy');
  if (carried) { gBenign++; console.log('  GATE-FP!! [' + dims + '] | ' + s.slice(0, 44)); }
}
console.log('攻击模块命中 ' + a + '/' + ATTACK.length + '；良性模块误伤 ' + b + '/' + BENIGN.length +
  '；gate 非pass ' + gCaught + '/' + ATTACK.length + '；gate 良性承重误伤 ' + gBenign + '/' + BENIGN.length);
