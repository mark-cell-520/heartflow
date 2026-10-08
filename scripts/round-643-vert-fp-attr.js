// r643 归因：垂直场景 150 里唯一非 pass 的样本，判定它是本轮引入还是既存误报。
// 只照抄守卫同一条路径（gate），打印 action + top findings + 文本形状（截断 60 字）。
const path = require('path');
const repo = path.resolve(__dirname, '..');
const vb = require(path.join(repo, 'test/vertical-benign-benchmark.js'));
const main = require(path.join(repo, 'src/gate.js'));

const gate = (main.gate || main.check || main.pipeline);
const samples = [];
for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
  for (const text of list) samples.push({ text, cat });
}
console.log('samples:', samples.length, 'gateType:', typeof gate);
for (const s of samples) {
  let r = null;
  try { r = gate(s.text); } catch (e) { console.log('ERR', s.cat, e.message); continue; }
  const action = r && r.gate ? r.gate.action : (r && r.action);
  if (action !== 'pass') {
    const f = (r.findings || []).slice(0, 3).map(x => `${x.dimension}:${x.severity}`);
    console.log(JSON.stringify({ cat: s.cat, action, score: r.overallScore, findings: f, head: String(s.text).slice(0, 60) }));
  }
}
console.log('done');
