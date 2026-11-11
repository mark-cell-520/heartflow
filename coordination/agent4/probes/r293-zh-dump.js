const { ZH_SIGNALS } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
for (const fam of Object.keys(ZH_SIGNALS)) {
  console.log('##', fam);
  for (const p of ZH_SIGNALS[fam]) console.log('   ', String(p));
}
