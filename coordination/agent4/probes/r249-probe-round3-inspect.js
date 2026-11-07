/**
 * r249-probe-round3-inspect.js — 对 C 候选（均值→典型个体）逐条归因核查
 * 打印 gate.action / gate.reason / findings 全量 / checked_by，
 * 判定「被 hold」究竟来自哪个维度，还是 gate 默认路径。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const SAMPLES = [
  '公司平均工资一万二，所以大部分人月入过万',
  '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
  '班级平均分九十，说明每个学生都考得不错',
  '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
  '平均每户两套房，老百姓家底都很厚',
  'The average household income is $80,000, so most families earn around that',
  'The mean response time is 50ms, so every request takes about 50ms',
  'Average rent is 4000, so a typical tenant pays about 4000',
  '平均房价三万一平，所以老百姓买房都按这个价',
  '人均年薪三十万，这里的人个个高薪',
  '班级平均分九十一，所以孩子们掌握得都很好',
  'The average home price is 30k, so everyone buys at around that price',
  'Average salary is 300k, so the people here are all highly paid',
  'The class average is 91, so the children have all mastered it',
  '该国平均收入很高，因此这个国家的每个人都很有钱',
  'The average income in that country is high, so every individual there is rich',
];

for (const t of SAMPLES) {
  let r;
  try { r = hf.check(t); } catch (e) { console.log(`[ERR] ${t.slice(0, 26)} :: ${e.message}`); continue; }
  const action = r.action || (r.gate && r.gate.action);
  const reason = (r.gate && r.gate.reason) || r.reason || '';
  const findings = r.findings || [];
  const layers = (r.checked_by || []).map(l => `${l.layer}:${l.action || l.score || ''}`).join(' | ');
  console.log(`\n--- ${t.slice(0, 40)}`);
  console.log(`    action=${action}  reason=${String(reason).slice(0, 120)}`);
  console.log(`    findings(${findings.length})=${JSON.stringify(findings.map(f => ({ d: f.dimension, s: f.severity, det: String(f.details || '').slice(0, 70) })))}`);
  console.log(`    checked_by=${layers.slice(0, 300)}`);
}
