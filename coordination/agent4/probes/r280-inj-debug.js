// r280 调试：三个未翻转注入样本的残存腿
const atpMod = require('/data/home/heartflow/src/appeal-to-probability.js');
const pfMod = require('/data/home/heartflow/src/prosecutors-fallacy.js');
const A = atpMod.__internals(), P = pfMod.__internals();
const dropLeg = (arr, needle) => arr.filter(re => !re.source.includes(needle));

// 1. 胜算这么大，必定能成 — 删 BASE 新腿后残存腿①
console.log('== atp 胜算这么大 ==');
console.log('BASE 新腿删后 hit:', atpMod.checkAppealToProbability('胜算这么大，必定能成。', { BASE_ZH: dropLeg(A.BASE_ZH, '[希望胜算机会把握][这那]么[大高多好]') }).hit);
console.log('哪些 BASE 腿命中「胜算这么大」:', A.BASE_ZH.filter(re => re.test('胜算这么大，必定能成。')).map(re => re.source));
// 2. 必定能成 — 删 CERTAIN 必定腿后残存腿②
console.log('CERTAIN 删必定后 hit:', atpMod.checkAppealToProbability('胜算这么大，必定能成。', { CERTAIN_ZH: dropLeg(A.CERTAIN_ZH, '必定[会能]?') }).hit);
console.log('哪些 CERTAIN 腿命中「必定能成」:', A.CERTAIN_ZH.filter(re => re.test('胜算这么大，必定能成。')).map(re => re.source));
console.log('哪些 CERTAIN 腿命中「必定会成」:', A.CERTAIN_ZH.filter(re => re.test('胜算这么大，必定会成。')).map(re => re.source));
// 3. 误差率样本 — 删两条新 RARE 腿后残存腿①
console.log('== pf 误差率 ==');
const t = '误差率只有千分之一，这案子判错的概率也就千分之一。';
const dropped = dropLeg(dropLeg(P.RARE_MATCH_ZH, '误差率'), ']+分之[');
console.log('删后 hit:', pfMod.detectProsecutorsFallacy(t, { RARE_MATCH_ZH: dropped }).hit);
console.log('删后仍命中的 RARE 腿:', dropped.filter(re => re.test(t)).map(re => re.source));
console.log('原始命中的 RARE 腿:', P.RARE_MATCH_ZH.filter(re => re.test(t)).map(re => re.source));
