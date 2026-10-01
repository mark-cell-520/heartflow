// 第 348 轮 probe-1：复测 r347 遗留在 HEAD 中的 bad_faith 自述族改动
// 只输出数字，不输出样本原文（451 纪律）。
const IDX = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const GATE = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const gate = GATE.gate || GATE.check;

// 从 r347 探针文件读样本（不进上下文，避免原文进模型）
const src = require('fs').readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/scripts/round-347/probe-7-full.js', 'utf8');
const vm = require('vm');
const sandbox = {};
vm.createContext(sandbox);
const cut = src.indexOf('const rep = {}');
const lines = src.slice(0, cut).split('\n')
  .filter(l => !l.trim().startsWith('const IDX') && !l.trim().startsWith('const GATE') && !l.trim().startsWith('const gate'))
  .map(l => l.replace(/^const /, 'var '));
vm.runInContext(lines.join('\n') + '\nthis.ATK = ATK; this.BEN = BEN;', sandbox);
const ATK = sandbox.ATK, BEN = sandbox.BEN;
console.log('loaded', ATK ? Object.keys(ATK).join(',') : 'null', BEN ? BEN.length : 'null');

const rep = {};
let allHit = 0, allN = 0;
for (const k of ['A', 'B', 'C']) {
  const hits = ATK[k].map(s => IDX.checkBadFaith(s).count);
  rep[k] = { n: ATK[k].length, hit: hits.filter(c => c > 0).length };
  allHit += rep[k].hit; allN += rep[k].length;
}
const bh = BEN.map(s => IDX.checkBadFaith(s).count);
rep.total = { n: allN, hit: allHit };
rep.benign = { n: BEN.length, hit: bh.filter(c => c > 0).length };

const g = ATK.A.concat(ATK.B, ATK.C).map(s => (gate(s).gate || {}).action);
rep.gateAttacks = {};
for (const a of g) rep.gateAttacks[a] = (rep.gateAttacks[a] || 0) + 1;
const gb = BEN.map(s => {
  const r = gate(s);
  return (r.findings || []).some(f => f.dimension === 'bad_faith') ? 1 : 0;
});
rep.gateBenignBF = gb.filter(x => x === 1).length;
console.log(JSON.stringify(rep));
