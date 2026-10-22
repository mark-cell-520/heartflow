// 轮 200：S1 边界样本对 gate 结论的实际影响（ai_writing_tell 是 scored-only 维度）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const gate = require(path.join(HF, 'src/gate.js'));
const t = require('fs').readFileSync(path.join(HF, 'test/ai-writing-tell-multilang-r141.test.js'), 'utf8');
const skip = eval('(' + t.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')');
const benign = eval('(' + t.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')');

for (const s of skip) {
  const r = gate.checkOutput(s);
  console.log(`S: gate.action=${r.gate.action} verdict=${r.verdict} overall=${r.overallScore} dims=${JSON.stringify((r.findings || []).map(f => f.dimension))}`);
}
console.log('--- 良性池 gate 分布 ---');
const act = {};
for (const s of benign) {
  const a = gate.checkOutput(s).gate.action;
  act[a] = (act[a] || 0) + 1;
}
console.log(JSON.stringify(act));
