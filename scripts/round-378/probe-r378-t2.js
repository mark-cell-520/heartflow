const mod = require('../../src/relative-risk-individual-transfer.js');
const I = mod.__internals();
const t = '群体的相对风险降到三成，落到每个人头上也是三成';
// 手工复现主判据
const gl = I.findGroupLeg(t, true, {});
console.log('group idxs=', gl.idxs, 'lens=', gl.lens);
const iv = I.findIndivLeg(t, true, {}, gl.idxs);
console.log('indiv best=', iv);
console.log('concession tail/lead:', I.CONCESSION_ZH.test(t.slice(iv, iv+30)), I.CONCESSION_ZH.test(t.slice(Math.max(0,iv-20), iv)));
console.log('INFER_ZH:', I.INFER_ZH.test(t));
console.log('between window:', JSON.stringify(t.slice(gl.lens[gl.lens.length-1] + gl.idxs[gl.idxs.length-1], iv)));
