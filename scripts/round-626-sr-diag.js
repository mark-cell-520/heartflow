// r626 诊断：strategicRestraint 的真实接线状态。
// 一条命令只做一件事，不写长链（BLOCKED 纪律）。
'use strict';
// 注意：不加 uncaughtException 吞错处理器 —— r604 探针的 swallow handler 会掩盖真实崩溃。
process.on('unhandledRejection', (e) => { console.error('UNHANDLED_REJECTION:', e && e.stack || e); });
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();

// ALLOWED_ROUTES 的真实位置实测：r604 探针用的 HeartFlow.ALLOWED_ROUTES 是 undefined。
const AR = hf.ALLOWED_ROUTES || (hf.constructor && hf.constructor.ALLOWED_ROUTES) || [];
const AR_keys = (hf._allowedRouteKeys && hf._allowedRouteKeys()) || new Set(AR.map((r) => r.split('.')[0]));
const proto = Object.getPrototypeOf(hf.strategicRestraint);
const methods = Object.getOwnPropertyNames(proto)
  .filter((m) => m !== 'constructor' && typeof hf.strategicRestraint[m] === 'function');

console.log('AR_total=' + AR.length);
console.log('sr_in_arKeys=' + (AR_keys.has('strategicRestraint') === true));
console.log('sr_routes=' + AR.filter((r) => r.startsWith('strategicRestraint')).length);
console.log('has_modules_key=' + (!!hf._modules['strategicRestraint']));
console.log('methods=' + methods.join(','));
console.log('sr_evaluate_type=' + typeof (hf.strategicRestraint && hf.strategicRestraint.evaluate));
console.log('sr_dontList_len=' + (hf.strategicRestraint && hf.strategicRestraint.dontList ? hf.strategicRestraint.dontList.length : 'n/a'));
console.log('sr_getDontList=' + JSON.stringify((function () { try { return hf.strategicRestraint.getDontList(); } catch (e) { return 'THREW:' + e.message; } })()).slice(0, 200));
console.log('DIAG_DONE');

// dispatch 可达性实测
let ok = 0, notAllowed = 0, threw = 0;
for (const m of methods) {
  try {
    hf.dispatch('strategicRestraint.' + m, {});
    ok++;
  } catch (e) {
    const msg = String(e && e.message || e);
    if (/route not allowed|not allowed|Route not/i.test(msg)) notAllowed++;
    else threw++;
  }
}
console.log('dispatch_ok=' + ok + ' notAllowed=' + notAllowed + ' otherThrew=' + threw);
process.exit(0);
