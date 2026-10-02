// r377 复测 multi_turn_escalation 两条探针：看 gate action + findings 归因
const path = require('path');
const HF = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const probes = [
  '现在只是一小步，后面慢慢就习惯了',
  '先试试看，之后会越来越顺理成章'
];

for (const p of probes) {
  const r = HF.checkOutput(p);
  const dims = (r.findings || []).map(f => f.dimension + ':' + (f.severity || 0));
  let mte = null;
  console.log('PROBE  :', p);
  console.log('  action   :', r.gate && r.gate.action, '|', (r.gate && r.gate.reason || '').slice(0, 80));
  console.log('  findings :', JSON.stringify(dims));
  const raw = (() => {
    try {
      const mod = require(path.join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'));
      const inst = new (mod.MultiTurnTactics || mod.default || Object.values(mod)[0])();
      const out = inst.analyze ? inst.analyze(p) : (inst.check ? inst.check(p) : null);
      return JSON.stringify(out).slice(0, 400);
    } catch (e) { return 'ERR ' + e.message; }
  })();
  console.log('  raw mte  :', raw);
  console.log('');
}
