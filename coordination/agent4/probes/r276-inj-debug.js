// r276 注入调试：定位删条后仍命中的真实腿
const { detectPlanningFallacy } = require('/data/home/heartflow/src/planning-fallacy.js');
const P = require('/data/home/heartflow/src/planning-fallacy.js').__internals();
const { detectOmissionBias } = require('/data/home/heartflow/src/omission-bias.js');
const O = require('/data/home/heartflow/src/omission-bias.js').__internals();
const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const L = require('/data/home/heartflow/src/loss-aversion.js').__internals();
const drop = (arr, m) => arr.filter(re => !m.test(re.source));

const s = 'I doubled the team size, so delivery can only get faster.';
console.log('pf base:', JSON.stringify(detectPlanningFallacy(s)));
console.log('pf drop doubled:', JSON.stringify(detectPlanningFallacy(s, { WILL_EFFORT_EN: drop(P.WILL_EFFORT_EN, /doubled/) })));
console.log('pf drop only:', JSON.stringify(detectPlanningFallacy(s, { EST_DURATION_EN: drop(P.EST_DURATION_EN, /only/) })));

const s2 = 'Not acting only costs time; acting wrongly is a real sin.';
console.log('ob base:', JSON.stringify(detectOmissionBias(s2)));
console.log('ob drop E5:', JSON.stringify(detectOmissionBias(s2, { SOLO_EN: drop(O.SOLO_EN, /costs/) })));

const s3 = 'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.';
console.log('la base:', JSON.stringify(detectLossAversion(s3)));
console.log('la drop capital:', JSON.stringify(detectLossAversion(s3, { AVOID_EN: drop(L.AVOID_EN, /capital/) })));

const s4 = 'Last time was a fluke; I have now mastered every step, so no more overruns.';
console.log('pf4 base:', JSON.stringify(detectPlanningFallacy(s4)));
console.log('pf4 drop overruns:', JSON.stringify(detectPlanningFallacy(s4, { EST_PROMISE_EN: drop(P.EST_PROMISE_EN, /overruns/) })));
