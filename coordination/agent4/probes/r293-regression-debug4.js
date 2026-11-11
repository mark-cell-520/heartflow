const { analyze, ZH_SIGNALS } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const t = '我太笨了，这么简单都不懂。';
console.log(JSON.stringify(analyze(t)));
console.log('self_dep pats:', ZH_SIGNALS.self_deprecation.map((p) => String(p)));
for (const p of ZH_SIGNALS.self_deprecation) console.log(p.test(t), String(p));
