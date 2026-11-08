const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const t = '同样的数目，赔一块比挣一块难受多了，所以先保本';
console.log('default:', JSON.stringify(detectLossAversion(t).details));
console.log('W_ZH=0 :', JSON.stringify(detectLossAversion(t, { W_ZH: 0 }).details || 'NO HIT'));
console.log('count  :', detectLossAversion(t).count);
const NO_AVOID = { AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [], AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [] };
console.log('NO_AVOID+W0:', JSON.stringify(detectLossAversion(t, Object.assign({ W_ZH: 0 }, NO_AVOID)).details || 'NO HIT'));
