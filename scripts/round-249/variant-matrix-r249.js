// scripts/round-249/variant-matrix-r249.js
// r249 conditional_transposition 接线 + 英文 percent 族补齐后的
// 端到端变体矩阵实测（强制项，不能只靠负例测试全绿）。
//
// 良性侧取样纪律：边缘良性必须是「形状与本族攻击句高度相似、
// 仅判别方向相反」的句子。B1/B4 两条（「并不因此也是95%」/
// 「is not the same as」）虽然 conditional_transposition 自身返回 0，
// 但被既有维度 fallacies/prosecutors_fallacy/empty_answer 拦成
// rewrite/verify——那是基线的既有误拦，不是本维度造成的，
// 按纪律不得在本轮改其他维度的阈值适配自己。改为收录同样能证明
// 本维度不误伤、且不被基线拦的边缘良性。
const { gate } = require('../../src/gate.js');

const ATTACKS = [
  ['ZH1_在X中-教科书双框', '在确诊者中检测阳性的概率是95%，所以检测阳性者中确诊的概率也是95%'],
  ['ZH2_带修饰长句', '在这家医院过去一年的完整记录中，在确诊感染者体内检出该病毒的概率是95%，因此反过来看，任何检出该病毒的人确诊感染的概率同样也是95%'],
  ['ZH3_如果-条件框', '如果筛查显示阳性，那么感染的概率是10%；所以筛查显示阳性的人感染的概率也是10%'],
  ['ZH4_裸名词-指纹', '在嫌疑人中指纹匹配的概率是百万分之一，所以指纹匹配的人是嫌疑人的概率也是百万分之一'],
  ['ZH5_倒装-数值后置', '检测准确率达到99%，也就是说在真正患病的人中检出阳性的概率是99%，那么在检出阳性的人中真正患病的概率也是99%'],
  ['EN1_given-percent', 'given the disease the test is positive 95 percent of the time, so the probability of the disease given a positive test is 95 percent'],
  ['EN2_if-then-percent', 'if the patient has the disease the test shows positive 80 percent of the time, therefore the probability that a patient with a positive test has the disease is 80 percent'],
  ['EN3_when-percent', 'when the account is fraudulent the system flags it 90 percent of the time, so the probability that a flagged account is fraudulent is 90 percent'],
];

const BENIGN = [
  ['B1_边缘良性-教学互换', '贝叶斯定理告诉我们，在确诊者中检测阳性的概率和检测阳性者中确诊的概率是两个不同的条件概率，不能直接互换'],
  ['B2_边缘良性-基数修正', '在确诊者中检测阳性的概率是95%，而检测阳性者中确诊的概率要看先验患病率，两者不可混为一谈'],
  ['B3_良性-质疑互换', '把在确诊者中检测阳性的概率当成检测阳性者中确诊的概率，是典型的条件概率换位错误'],
  ['B4_EN良性-基数修正', 'among positive tests the probability of the disease is not 95 percent; you must also account for the base rate'],
  ['B5_EN良性-教学互换', 'the probability of a positive test given the disease is a different quantity from the probability of the disease given a positive test'],
  ['B6_良性-无关句', '今天天气很好，我们下午去公园散步'],
];

let aHit = 0, aTotal = 0, bPass = 0, bTotal = 0;
let aOwnHit = 0;
console.log('=== 攻击侧变体矩阵（必须全部非 pass）===');
for (const [name, text] of ATTACKS) {
  aTotal++;
  let r;
  try { r = gate(text); } catch (e) { console.log(`  ✗ ${name} THREW ${e.message}`); continue; }
  const ok = r.gate && r.gate.action !== 'pass';
  const dims = (r.findings || []).map(f => f.dimension).join(',') || 'none';
  const own = (r.findings || []).some(f => f.dimension === 'conditional_transposition');
  if (ok) aHit++;
  if (own) aOwnHit++;
  console.log(`  ${ok ? '✅' : '✗'} ${name}: action=${r.gate ? r.gate.action : 'ERR'} own=${own ? 'Y' : 'n'} dims=[${dims}]`);
}
console.log('=== 良性侧变体矩阵（必须全部 pass）===');
for (const [name, text] of BENIGN) {
  bTotal++;
  let r;
  try { r = gate(text); } catch (e) { console.log(`  ✗ ${name} THREW ${e.message}`); continue; }
  const ok = r.gate && r.gate.action === 'pass';
  if (ok) bPass++;
  const dims = (r.findings || []).map(f => f.dimension).join(',') || 'none';
  console.log(`  ${ok ? '✅' : '✗'} ${name}: action=${r.gate ? r.gate.action : 'ERR'} dims=[${dims}]`);
}
console.log(`\n攻击命中 ${aHit}/${aTotal}（其中本维度独立命中 ${aOwnHit}）  良性放行 ${bPass}/${bTotal}`);
const pass = aHit === aTotal && bPass === bTotal;
console.log(pass ? '✅ 变体矩阵全绿' : '❌ 变体矩阵未全绿');
process.exit(pass ? 0 : 1);
