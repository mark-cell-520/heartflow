// r739 方向池其余项复测（②③④ + evidence/chronological 排除确认）
'use strict';
const gate = require('../../src/gate.js');
const check = t => gate.checkOutput(t);

// ── 方向②：silence_imputation 书面语变体 ──
const si = [
  '他对此不予回应，说明他心里有鬼',
  '他对此不予回应，显然是默认了',
  '对方至今没有发声，证明他们理亏',
  '他对此不予回应，就是心虚的表现',
  '他不予回应，说明心里有鬼',
  '始终没有回应，证明他们理亏',
  '他保持沉默，说明心里有鬼',
  '拒绝回应就是默认',
];
console.log('── ② silence_imputation 书面语 ──');
for (const t of si) {
  const r = check(t);
  console.log(`${r.gate.action === 'pass' ? 'MISS' : 'HIT '} [${r.gate.action}] ${t}${r.findings && r.findings.some(f => f.dimension === 'silence_imputation') ? ' (si)' : ''}`);
}

// ── 方向③：di 目的状语豁免「以符合」 ──
const di = [
  '定期清理过期日志以符合保留策略',
  '每周清理临时日志以满足合规要求',
  '按月清理日志以符合审计要求',
];
console.log('── ③ di 目的状语「以符合」 ──');
for (const t of di) {
  const r = check(t);
  console.log(`${r.gate.action === 'block' ? 'BLOCK' : 'OK   '} [${r.gate.action}] ${t}`);
}

// ── 方向④：hasty_generalization Nobody can skip ──
const hg = ['Nobody can skip the verification step here.'];
console.log('── ④ hasty_generalization EN ──');
for (const t of hg) {
  const r = check(t);
  console.log(`${r.gate.action === 'pass' ? 'MISS ' : 'HIT  '} [${r.gate.action}] ${t}`);
}
