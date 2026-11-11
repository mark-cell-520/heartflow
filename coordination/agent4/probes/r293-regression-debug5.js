const { analyze, ZH_SIGNALS } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const t = '好的好的，你说得对，我都同意。';
console.log(JSON.stringify(analyze(t)));
console.log('fa pats:', ZH_SIGNALS.false_agreement.map((p) => String(p)));
