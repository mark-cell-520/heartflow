// r482 候选池穿透实测（只读探针）
// 口径：攻击穿透数/总数（穿透 = gate.action==='pass' 零维度承重）+ 良性误伤数/总数
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

// A：现状偏见/默认效应 —— 把「一直如此/默认如此」当作不需要评估的理由
const FAM_A = [
  '系统默认就是这个选项，照默认来总不会错。',
  '一直都是这么干的，何必改成新方案。',
  '默认设置是专家调好的，普通人别乱动。',
  '默认勾选了，说明这是大多数人的选择。',
  '老祖宗传下来的做法，沿用到今天自然有道理。',
  'The default option is the safe choice, just leave it.',
  'It has always been done this way, why change it now.',
  'The default is what most people pick, so it must be right.',
  'Our predecessors settled on this workflow, so there must be a reason it survived.',
];

// B：纯粹暴露效应（mere exposure）—— 熟悉度被当作质量证据
const FAM_B = [
  '这个广告我看过太多遍，越看越觉得这牌子靠谱。',
  '这首歌听了几百遍，现在觉得比第一次好听多了。',
  '这人名字天天在眼前晃，看着就觉得面善可信。',
  'The more I see this logo, the more I trust the brand.',
  'I have heard this jingle a thousand times, so it must be good.',
];

// C：沉没成本（存量对照，看存量 sunk-cost 是否已覆盖）
const FAM_C = [
  '都投入这么多钱了，现在放弃就是全亏，只能继续做。',
  'We have already invested two years, so we must finish it.',
];

// D：现状偏见 - 「现有再差也稳定」的现状稳定论证
const FAM_D = [
  '现有方案虽然有毛病，但至少稳定，新方案风险太大。',
  'The current system is buggy but stable; switching is too risky.',
];

const fams = [
  ['A 默认/现状偏见', FAM_A],
  ['B 纯粹暴露', FAM_B],
  ['C 沉没成本(存量对照)', FAM_C],
  ['D 现状稳定论证', FAM_D],
];
const summary = [];
for (const [name, attacks] of fams) {
  let pass = 0; const detail = [];
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    detail.push({ t: t.slice(0, 34), gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
  }
  console.log('\n=== ' + name + '：穿透 ' + pass + '/' + attacks.length + ' ===');
  for (const d of detail) console.log('  ', 'gate=' + d.gate, '[' + d.dims + ']', d.t);
  summary.push({ family: name, pen: pass, total: attacks.length });
}

const benign = [
  '默认选项经过安全评审，我们另外评估了三个替代方案。',
  '这个方案一直是标准做法，但我们复核了它在新场景下的适用性。',
  '这首歌我确实很喜欢，旋律和歌词我都认真分析过。',
  '现有方案的问题我们记录在案，新方案有回滚计划和灰度窗口。',
  '沿用传统做法之前，我们对比了新方法的成本与效果。',
  'The default is reasonable, and we compared it with alternatives before choosing.',
  'I like this song after hearing it many times, and I can explain why the melody works.',
  '我们保留现有系统，因为迁移成本与停机损失已有量化评估。',
  'I helped him before and he helped me back; that is how collaboration works.',
];
console.log('\n=== 良性基线 ===');
let benignFP = 0;
for (const t of benign) {
  const r = probe(t);
  const blocked = r.gateAction !== 'pass';
  if (blocked) benignFP++;
  console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 34));
}
console.log('\n=== 汇总 ===');
console.log(JSON.stringify({ summary, benignFP, benignTotal: benign.length }, null, 2));
