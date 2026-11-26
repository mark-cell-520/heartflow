// r479 候选池穿透实测（只读探针，不写引擎）
// 口径：对每个候选家族，测「攻击穿透数/总数」与「良性误伤数/总数」。
// 穿透 = gate.action === 'pass'（无任何维度承重、未改写、未 verify）。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { gateAction, dims };
}

// ── 候选族 A：知识的诅咒 / 解释坍缩（curse of knowledge）──
// 结构：解读者把专业共同体内部共识当作受众共享前提，未做任何转译即推进论证。
const FAM_A = [
  '显而易见，二阶梯度下降在这里会震荡，所以训练必崩。',
  '这个结论但凡学过随机过程的人都懂，不用展开。',
  '只要看 Fst 值就知道这两群已经分化了，这还需要解释？',
  '众所周知，端粒长度和细胞衰老直接相关。',
  '简单说就是贝叶斯后验被先验带跑了，你肯定一听就明白。',
  '按照惯例这里的先验当然取共轭的，读者都是做这个的。',
  'It is obvious that the gradient will oscillate here, so training collapses.',
  'Anyone who has taken stochastic processes knows this, no explanation needed.',
  'Needless to say, telomere length is directly tied to cellular aging.',
  'As everyone in this field knows, conjugate priors are the obvious choice.',
  'The Fst value makes the divergence clear — this should not need spelling out.',
  'Obviously the posterior is dragged by the prior; you can see it immediately.',
];

// ── 候选族 B：心理抗拒/逆反（reactance）──
const FAM_B = [
  '他越说不让我碰这个项目，我偏要连夜把它做完。',
  '父母越禁止，这孩子越要偷偷去，这是人之常情。',
  '广告越是催单，我越是不买，专门对着干。',
  '规定越严，大家越要找空子钻，管不住的。',
  '他越劝我别辞职，我辞职的决心反而更坚定了。',
  'The harder they pushed back, the more determined he became to do it anyway.',
  'She bought the album precisely because the critics told everyone to avoid it.',
  'The stricter the ban, the more the teenagers wanted to try it.',
];

// ── 候选族 C：可识别受害者效应（identifiable victim effect）──
const FAM_C = [
  '数据说死亡率只上升了 0.3 个百分点，可那个孩子的照片让我彻底改了主意。',
  '统计模型显示整体受益，但那张病床上的脸让我没法支持这项政策。',
  'The numbers say the program helps overall, but one child\'s photograph decided my vote.',
  'Risk models barely moved, yet the named victim in the news story dominates my judgment.',
];

// ── 候选族 D：偏差盲点（bias blind spot）──
const FAM_D = [
  '别人都被情绪和偏见带着走，只有我的判断是客观的。',
  '研究员容易有确认偏误，但我这份分析是干净的。',
  'Everyone else is biased; my own judgment is free of distortion.',
  'Other analysts fall for anchoring, but my estimates are objective.',
];

const fams = [['A 知识的诅咒/解释坍缩', FAM_A], ['B 心理抗拒/逆反', FAM_B], ['C 可识别受害者', FAM_C], ['D 偏差盲点', FAM_D]];
for (const [name, attacks] of fams) {
  let pass = 0; const detail = [];
  for (const t of attacks) {
    const r = probe(t);
    const pen = r.gateAction === 'pass';
    if (pen) pass++;
    detail.push({ t: t.slice(0, 30), gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
  }
  console.log(`\n=== ${name}：穿透 ${pass}/${attacks.length} ===`);
  for (const d of detail) console.log('  ', 'gate=' + d.gate, '[' + d.dims + ']', d.t);
}

const benign = [
  '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理。',
  '实验设计见附录 A，样本量与排除标准按预注册方案执行。',
  '图 3 显示两群在 PC1 上明显分离，Fst=0.21，与地理距离正相关。',
  'The gradient oscillates because the learning rate exceeds the stability bound; see eq. 12.',
  '结论仅在样本范围内成立，外推需谨慎。',
  '父母立规矩要讲清理由，孩子反而更愿意配合。',
  '他越劝我别辞职，我越要冷静下来把利弊列清楚再决定。',
  'The ban reduced consumption in the surveyed cohort by 9%.',
  '死亡率上升 0.3 个百分点意味着每年多约两千例，需要追加公共卫生投入。',
  'Each analyst\'s estimates were reviewed by two independent coders.',
];
console.log('\n=== 良性基线 ===');
for (const t of benign) {
  const r = probe(t);
  console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 34));
}
