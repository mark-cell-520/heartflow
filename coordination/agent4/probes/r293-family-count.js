const m = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
for (const k of ['EN_SIGNALS', 'ZH_SIGNALS', 'JA_SIGNALS', 'KO_SIGNALS', 'AR_SIGNALS', 'HI_SIGNALS', 'ES_SIGNALS']) {
  console.log(k, Object.keys(m[k]).length, Object.keys(m[k]).join(','));
}
console.log('WEIGHTS', Object.keys(m.WEIGHTS).length, Object.keys(m.WEIGHTS).join(','));
