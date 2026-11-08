const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const t = '同样的数目，赔一块比挣一块难受多了，所以先保本';
console.log('W_ZH=0 hit:', detectLossAversion(t, { W_ZH: 0 }).hit);
console.log('W_EN=0 hit:', detectLossAversion(t, { W_EN: 0 }).hit);
console.log('W_ZH=0 details:', JSON.stringify(detectLossAversion(t, { W_ZH: 0 }).details));
console.log('W_EN=0 details:', JSON.stringify(detectLossAversion(t, { W_EN: 0 }).details));
