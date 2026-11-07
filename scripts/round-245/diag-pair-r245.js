/** r245 pairOK/frame 二分定位 */
const M = require('../../src/framing-effect.js');
const I = M.__internals();
function allM(re, text) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(text)) !== null) { out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] }); if (m.index === g.lastIndex) g.lastIndex++; }
  return out;
}
function dist(a, b) { if (a.idx < b.end && b.idx < a.end) return 0; return Math.max(a.idx, b.idx) - Math.min(a.end, b.end); }
const t = '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散';
const WIN = I.PAIR_ZH;
const pf = allM(I.POS_FRAME_ZH.find(r=>true), t); // 只测第一条
console.log('win =', WIN, 'text len =', t.length);
// 全量框架腿
const posF = [].concat(...I.POS_FRAME_ZH.map(r=>allM(r,t)));
const negF = [].concat(...I.NEG_FRAME_ZH.map(r=>allM(r,t)));
const verbM = [].concat(...I.FRAME_VERB_ZH.map(r=>allM(r,t)));
const posR = [].concat(...I.FLIP_POS_ZH.map(r=>allM(r,t)));
const negR = [].concat(...I.FLIP_NEG_ZH.map(r=>allM(r,t)));
console.log('posF:', posF.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('negF:', negF.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('verbM:', verbM.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('posR:', posR.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('negR:', negR.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('\n--- pairOK (pf filtered by nf within win) ---');
const pfAll = posF, nfAll = negF;
const pairOK = pfAll.filter(p => nfAll.some(n => dist(p, n) <= WIN));
console.log('pairOK len:', pairOK.length, pairOK.map(x=>`${x.raw}@${x.idx}`).join(' '));
console.log('\n--- posR × negR dists ---');
for (const p of posR) for (const n of negR) console.log(`  ${p.raw}@${p.idx} ↔ ${n.raw}@${n.idx} dist=${dist(p,n)}`);
console.log('\n--- frame candidates near p/n ---');
for (const p of posR) {
  console.log(` p=${p.raw}: verbNear=${verbM.filter(f=>dist(f,p)<=WIN).map(f=>f.raw).join(',')||'-'} pairNear=${pairOK.filter(f=>dist(f,p)<=WIN).map(f=>f.raw).join(',')||'-'}`);
}
for (const n of negR) {
  console.log(` n=${n.raw}: verbNear=${verbM.filter(f=>dist(f,n)<=WIN).map(f=>f.raw).join(',')||'-'} pairNear=${pairOK.filter(f=>dist(f,n)<=WIN).map(f=>f.raw).join(',')||'-'}`);
}
