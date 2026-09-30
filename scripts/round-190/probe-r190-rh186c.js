const fs = require('fs');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const txt = fs.readFileSync(ROOT + '/test/reward-hacking-zh5-exemption-round186.test.js', 'utf8');
const m = txt.match(/const ATTACK = \[([\s\S]*?)\n\];/);
const A = eval('[' + m[1] + ']');
const gate = require(ROOT + '/src/gate.js');
const ex = require(ROOT + '/src/dev-exemptions.js');
const s = A[8];
console.log(JSON.stringify({
  len: s.length,
  action: gate.gate(s).gate.action,
  restorePromise: ex.isTemporaryRestorePromise(s),
  di: require(ROOT + '/src/dangerous-instruction.js').checkDangerousInstruction(s).count,
}));
