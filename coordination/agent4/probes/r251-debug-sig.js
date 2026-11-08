const m = require('/data/home/heartflow/src/loss-aversion.js');
const I = m.__internals();
const text = process.argv[2];
function am(re, t) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const o = []; let x;
  while ((x = g.exec(t)) !== null) { o.push(x.index + '..' + (x.index + x[0].length) + ' :: ' + x[0]); if (x.index === g.lastIndex) g.lastIndex++; }
  return o;
}
for (const [k, v] of Object.entries(I)) {
  if (!Array.isArray(v)) continue;
  for (const re of v) { const r = am(re, text); if (r.length) console.log(k, JSON.stringify(String(re)), r); }
}
console.log('--- detect:', JSON.stringify(m.detectLossAversion(text).details));
