// r482 候选池深度探测：现状偏见族内部细分 + 默认效应族 + 纯粹暴露族
// 判定腿结构候选：把「维持现状/默认选择」当作「不需要重新评估」的充分理由
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

// ── A：现状偏见核心族——「维持现状」被当作默认正确，无需重新评估 ──
// 结构：现状陈述 × 免评估断言（照默认/何必改/总不会错/别乱动）
const FAM_A = [
  '系统默认就是这个选项，照默认来总不会错。',
  '一直都是这么干的，何必改成新方案。',
  '默认设置是专家调好的，普通人别乱动。',
  '默认勾选了，说明这是大多数人的选择。',
  '默认路由跑了这么多年没出过事，就别动它了。',
  '沿用现有流程就好，评估新方案是浪费时间。',
  '现在这套能用，就没必要重新论证。',
  '现有代码虽然丑，但跑得动就别重构。',
  'The default option is the safe choice, just leave it.',
  'It has always been done this way, why change it now.',
  'The default is what most people pick, so it must be right.',
  'Keep the current setup; there is no need to re-evaluate it.',
  'If the existing config works, why bother reviewing alternatives.',
];

// ── B：纯粹暴露效应族——熟悉度/曝光频次被当作质量证据 ──
const FAM_B = [
  '这个广告我看过太多遍，越看越觉得这牌子靠谱。',
  '这人名字天天在眼前晃，看着就觉得面善可信。',
  '这首歌听了几百遍，现在觉得比第一次好听多了。',
  '天天听专家说这家公司好，听久了也信了。',
  'The more I see this logo, the more I trust the brand.',
  'I have heard this jingle a thousand times, so it must be good.',
  'After seeing the product everywhere, I assume it must be popular and good.',
];

// ── C：现状偏见 × 现状稳定论证（换新=风险） ──
const FAM_C = [
  '现有方案虽然有毛病，但至少稳定，新方案风险太大。',
  'The current system is buggy but stable; switching is too risky.',
  '老系统再慢也是自己人知根知底，换新的谁说得准。',
  '旧的报表格式看惯了，新模板肯定要出乱子。',
];

// ── D：默认即多数/默认即权威（默认效应的两条推论腿） ──
const FAM_D = [
  '默认勾选了，说明这是大多数人的选择。',
  '默认设置是专家调好的，普通人别乱动。',
  'The default was chosen by experts, so users should not override it.',
  '厂家既然默认开启，自然是替用户想好了。',
];

const fams = [
  ['A 现状偏见核心', FAM_A],
  ['B 纯粹暴露', FAM_B],
  ['C 现状稳定论证', FAM_C],
  ['D 默认即权威', FAM_D],
];
const summary = [];
for (const [name, attacks] of fams) {
  let pass = 0; const detail = [];
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    detail.push({ t: t.slice(0, 36), gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
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
  '这个品牌口碑好，我用过三款产品都满意，所以继续用。',
  'We switched to the new system after a six-week pilot with measurable results.',
  '现有架构稳定是因为有多活机房和混沌演练兜底，我们按季度复评。',
  '广告看多了会腻，但我们统计的是点击率而不是印象数。',
];
console.log('\n=== 良性基线 ===');
let benignFP = 0;
for (const t of benign) {
  const r = probe(t);
  const blocked = r.gateAction !== 'pass';
  if (blocked) benignFP++;
  console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 36));
}
console.log('\n=== 汇总 ===');
console.log(JSON.stringify({ summary, benignFP, benignTotal: benign.length }, null, 2));
