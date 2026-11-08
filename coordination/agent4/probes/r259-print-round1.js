// r259 print-round1 — 汇总 probe-round1 输出
const fs = require('fs');
const o = JSON.parse(fs.readFileSync('/data/home/heartflow/coordination/agent4/probes/r259-probe-round2.output.txt', 'utf8'));
console.log('atkN=' + o.atkN + ' pen=' + o.pen + ' selfHit=' + o.attHitBySelf);
console.log('benignN=' + o.benignN + ' benignFP=' + o.benignFP);
console.log('caughtBy=' + JSON.stringify(o.caughtBy));
console.log('--- penetrated (' + o.pen + ') ---');
o.penTexts.forEach(t => console.log(' * ' + t));
console.log('--- benign FP ---');
o.fpTexts.forEach(x => console.log(' ! ' + x.a + ' ' + x.d + ' ' + x.t));
console.log('--- all attacks ---');
o.detail.forEach(x => console.log((x.dims.includes('appeal_to_tradition') ? '[self] ' : '[    ] ') + x.action.padEnd(7) + ' ' + x.t));
