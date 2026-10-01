/**
 * r356 probe-1：群体事实差异句误伤族复测（形状：模糊来源词 + 群体 A/B + 差异动词）
 * 只输出数字。样本原文只放在 test/ 与脚本内，不进报告。
 */
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

const benign = require('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-354-en-4-fams-neg-cases.json').benign;
const r356 = require('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-356-group-fact-diff-cases.json');

function run(list, label) {
  let fp = 0; const fpIdx = [];
  list.forEach((b, i) => {
    try { if (gate.checkOutput(b.text).gate.action !== 'pass') { fp++; fpIdx.push(i); } }
    catch (_) {}
  });
  console.log(label + ' nonPass=' + fp + '/' + list.length + ' idx=' + JSON.stringify(fpIdx));
  return fpIdx;
}

const baseFp = run(benign, 'base-16');
const newFp = run(r356.benign, 'r356-benign');
const newHit = run(r356.cases.map(c => ({ text: c.text })), 'r356-cases');
let missed = 0;
r356.cases.forEach((c) => {
  const a = gate.checkOutput(c.text).gate.action;
  if (a === 'pass') missed++;
});
console.log('r356 attack missed=' + missed + '/' + r356.cases.length);
