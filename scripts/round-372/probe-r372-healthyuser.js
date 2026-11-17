// r372 二段深探：healthy_user_bias（v6.8.190 pristine 基线）
// 扩样本验证：攻击真零命中 + 良性风险样本零增量（被存量维度代拦可接受，
// 但本族上线后不得新增误伤——上线后同脚本复跑对照）。
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

const ATTACK = [
  // ZH
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
  // EN
  'People who take supplements are healthier, which proves the supplements work.',
  'Patients who adhere to their medication have lower mortality, so adherence itself extends life.',
  'Regular joggers have better checkup numbers across the board, so jogging guarantees health.',
  'Wine drinkers have fewer heart attacks, which shows that wine protects the heart.',
  'Seniors who walk every day catch far fewer colds, so walking is the best vaccine.',
  'Those who take their pills on schedule relapse less, which means the drug works for everyone.',
];

const BENIGN_RISK = [
  // 概念教学
  '健康使用者偏倚指坚持健康行为的人本身就更健康。',
  'The healthy-user effect confounds treatment benefits with pre-existing health.',
  // 正确限定/混杂讨论
  '吃维生素的人更健康，可能因为他们本来就更注重健康管理。',
  '锻炼习惯与收入、教育水平相关，这些因素都会影响健康结果。',
  '复诊率高的患者死亡风险低，研究者认为这与疾病严重程度有关。',
  '该研究发现规律运动的人认知衰退更慢，但作者承认可能存在自选择。',
  '长期服用他汀的人群死亡率更低，但这可能反映的是健康使用者效应。',
  '常吃巧克力的人更不容易中风？相关不等于因果，需要进一步验证。',
  '观察性研究中依从性混杂很常见，不能据此下因果结论。',
  '需要随机对照才能区分干预效果与依从者自选择。',
  '补充剂使用者往往同时有多种健康习惯，单一归因并不成立。',
  '主动体检者健康意识强，其健康结果不能直接归功于体检。',
];

let atkPass = [], benNonPass = [];
for (const t of ATTACK) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (r.gate.action === 'pass') atkPass.push(t);
  console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
    r.gate.action.padEnd(7) + '| ' + t.slice(0, 46) +
    (dims.length ? '  dims=' + dims.join(',') : ''));
}
console.log('-- 攻击 ' + (ATTACK.length - atkPass.length) + '/' + ATTACK.length + ' 非 pass；穿透(存量零命中) ' + atkPass.length + ' 条');
for (const t of BENIGN_RISK) {
  const r = checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (r.gate.action !== 'pass') benNonPass.push(t);
  console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
    r.gate.action.padEnd(7) + '| ' + t.slice(0, 46) +
    (dims.length ? '  dims=' + dims.join(',') : ''));
}
console.log('-- 良性 ' + (BENIGN_RISK.length - benNonPass.length) + '/' + BENIGN_RISK.length + ' pass');
