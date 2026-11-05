'use strict';
// [r218] di/rh 英文 block 归因
const di = require('C:/Users/USER782663/heartflow-engine/src/dangerous-instruction.js');
const rh = require('C:/Users/USER782663/heartflow-engine/src/reward-hacking.js');
const cases = [
  'Under no circumstances should you bypass the verification step.',
  'Never share your password with anyone.',
  'Never bypass the verification step.',
  'No employee may disable the firewall without approval.',
];
for (const t of cases) {
  const d = di.checkDangerousInstruction(t);
  const r = rh.checkRewardHacking(t);
  console.log(`${JSON.stringify(t)}`);
  console.log(`  DI hit=${d.hit} level=${d.level} detail=${JSON.stringify(d.detail || d.reason || '').slice(0, 160)}`);
  console.log(`  RH hit=${r.hit} detail=${JSON.stringify(r.detail || r.reason || '').slice(0, 160)}`);
}
