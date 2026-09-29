// 第 218 轮诊断 15：REACHED 之后 try 内打点就没出现 → 同步代码根本没进 try？
// 直接最小复现：同一文件形态的最小版本
const fs = require('fs');
const path = require('path');
const LOG = path.join(process.cwd(), 'scripts/round-218/_diag9.trace');
try { fs.unlinkSync(LOG); } catch {}
const F = (s) => `require('fs').appendFileSync(${JSON.stringify(LOG)}, ${JSON.stringify(s)} + "\\n");`;
const code = `'use strict';
const assert = require('assert');
const path = require('path');
let pass = 0, fail = 0;
function ok(n, f) { try { f(); pass++; } catch (e) { fail++; } }
const ROOT = process.cwd();
const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));
ok('sync', () => { const dr = new DecisionRouter({}, { modelProfile: 'flash' }); const r = dr.evaluate({}, 'p', 'x', null); assert.ok(r); });
${F('SYNC_DONE')}
const runEngine = process.env.HF_R218_SKIP_ENGINE ? false : true;
if (runEngine) {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  ${F('PRE_IIFE')}
  (async () => {
    ${F('IIFE_ENTER')}
    try {
      ${F('PRE_START')}
      await hf.start();
      ${F('POST_START')}
    } catch (e) { require('fs').appendFileSync(TRACE_LOG, 'START_ERR\\n'); }
    ${F('AFTER_START')}
  })();
} else {
  ${F('SKIP_BRANCH')}
}
setTimeout(() => { ${F('TIMEOUT_REACHED')} process.exit(0); }, 60000);
`;
const out = path.join(process.cwd(), 'scripts/round-218/_diag9.test.js');
fs.writeFileSync(out, code);
console.log('WROTE ' + out);
