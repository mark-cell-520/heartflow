// r626 诊断 v2：先摸清 ALLOWED_ROUTES 的真实形态，再做接线判定。
'use strict';
process.on('unhandledRejection', (e) => { console.error('UNHANDLED_REJECTION:', e && e.stack || e); });
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();

function shape(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array[' + v.length + ']';
  if (v instanceof Set) return 'Set[' + v.size + ']';
  return typeof v;
}
console.log('ctor.AR=' + shape(HeartFlow.ALLOWED_ROUTES));
const AR = HeartFlow.ALLOWED_ROUTES instanceof Set ? [...HeartFlow.ALLOWED_ROUTES] : [];
console.log('AR_resolved_len=' + AR.length);
const arKeys = new Set(AR.map((r) => r.split('.')[0]));
console.log('AR_keys=' + arKeys.size);
console.log('sr_in_arKeys=' + arKeys.has('strategicRestraint'));
console.log('sr_routes=' + AR.filter((r) => r.startsWith('strategicRestraint')).length);
console.log('has_modules_key=' + (!!hf._modules['strategicRestraint']));
const proto = Object.getPrototypeOf(hf.strategicRestraint);
const methods = Object.getOwnPropertyNames(proto).filter((m) => m !== 'constructor' && typeof hf.strategicRestraint[m] === 'function');
console.log('methods=' + methods.join(','));
console.log('DIAG_DONE');

// dispatch 可达性实测（真实口径）
let ok = 0, notAllowed = 0, threw = 0;
for (const m of methods) {
  try { hf.dispatch('strategicRestraint.' + m, {}); ok++; }
  catch (e) {
    const msg = String((e && e.message) || e);
    if (/route not allowed/i.test(msg)) notAllowed++;
    else { threw++; console.log('THREW ' + m + ': ' + msg.slice(0, 80)); }
  }
}
console.log('dispatch_ok=' + ok + ' notAllowed=' + notAllowed + ' otherThrew=' + threw);
process.exit(0);
