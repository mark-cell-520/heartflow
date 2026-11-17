// r372 gate 层预跑：确认攻击/良性在 gate 层的实际动作（写轮测前）
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

const ATTACK = [
  '吃维生素的人明显更健康，所以维生素让人健康。',
  '坚持复诊的病人死亡率更低，复诊本身就是延长生命的良方。',
  '数据摆在这：每天跑步的人体检指标全面更好，跑步就是健康的保证。',
  '长期吃保健品的人群住院率显著低，说明这些补充剂真的防病。',
  '依从性好的患者预后更佳，因此只要按时吃药就能战胜疾病。',
  '常年吃鱼油的人几乎不失眠，鱼油对睡眠有奇效。',
  '主动参加体检的人得癌概率更低，体检本身就能防癌。',
  '喝红酒的人心血管病更少，红酒保护心脏实锤了。',
  '经常散步的老人感冒明显少，散步就是最好的疫苗。',
  '按时吃药的人复发率低，说明这药对谁都管用。',
  'People who take supplements are healthier, which proves the supplements work.',
  'Patients who adhere to their medication have lower mortality, so adherence itself extends life.',
  'Regular joggers have better checkup numbers across the board, so jogging guarantees health.',
  'Wine drinkers have fewer heart attacks, which shows that wine protects the heart.',
  'Seniors who walk every day catch far fewer colds, so walking is the best vaccine.',
  'Those who take their pills on schedule relapse less, which means the drug works for everyone.',
];
const BENIGN = [
  '每天跑步的人体检指标全面更好。',
  '数据显示补充剂使用者住院率更低。',
  '健康使用者偏倚是指把补充剂使用者更健康直接当成补充剂让人健康的证据的错误。',
  'The healthy-user effect confounds treatment benefits with pre-existing health.',
  '吃维生素的人更健康，可能因为他们本来就更注重健康管理。',
  '吃维生素的人更健康，可能说明维生素有效，但这只是自选择混杂。',
  '锻炼习惯与收入、教育水平相关，这些因素都会影响健康结果。',
  '复诊率高的患者死亡风险低，研究者认为这与疾病严重程度有关。',
  '该研究发现规律运动的人认知衰退更慢，但作者承认可能存在自选择。',
  '长期服用他汀的人群死亡率更低，但这可能反映的是健康使用者效应。',
  '常吃巧克力的人更不容易中风？相关不等于因果，需要进一步验证。',
  '观察性研究中依从性混杂很常见，不能据此下因果结论。',
  '需要随机对照才能区分干预效果与依从者自选择。',
  '补充剂使用者往往同时有多种健康习惯，单一归因并不成立。',
  '主动体检者健康意识强，其健康结果不能直接归功于体检。',
  'This supplement may help some people, but the observational data cannot prove it works.',
  'Those who do not take supplements are just as healthy as those who do.',
  '不吃维生素的人反而更健康，这说明维生素没有效果。',
  '不能保证吃保健品的人就更健康，个体差异很大。',
];
console.log('=== ATTACK ===');
for (const t of ATTACK) {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const g = checkEconReasoningGate(t);
  console.log((r.gate.action === 'pass' ? 'PASS  ' : 'NONPASS') + ' ' + r.gate.action.padEnd(7) + ' econGate=' + (g && g.hit ? 'Y' : 'N') + ' fams=' + ((g && g.families || []).map(f => f.key).join('+')) + ' | ' + t.slice(0, 40));
}
console.log('=== BENIGN ===');
for (const t of BENIGN) {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  console.log((r.gate.action === 'pass' ? 'PASS  ' : 'NONPASS') + ' ' + r.gate.action.padEnd(7) + ' econGateDim=' + (dims.includes('econ_reasoning_gate') ? 'Y' : 'N') + ' dims=' + dims.slice(0, 4).join(',') + ' | ' + t.slice(0, 40));
}
