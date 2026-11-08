const m = require('/data/home/heartflow/src/fundamental-attribution-error.js');
const I = m.__internals();
const texts = [
  '她升不上去完全是情商低，跟公司文化没关系',
  '他这次迟到，是他态度的问题，别扯什么交通',
  'He is late because he is irresponsible; that is no excuse',
  '我这次失败纯粹是因为我懒，别找借口',
];
for (const t of texts) {
  const r = m.detectFundamentalAttributionError(t, null);
  console.log(JSON.stringify(t), '=>', r.hit ? 'HIT' : 'miss', r.hit ? r.evidence.join(' ;; ') : '');
}
console.log('\n--- 逐腿诊断 ---');
function all(re, text) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let x;
  while ((x = g.exec(text)) !== null) { out.push(x[0] + '@' + x.index); if (x.index === g.lastIndex) g.lastIndex++; }
  return out;
}
for (const t of texts) {
  console.log('\nTEXT:', t);
  for (const [n, re] of Object.entries(I)) {
    if (!(re instanceof RegExp)) continue;
    const ms = all(re, t);
    if (ms.length) console.log('  ', n, '=>', ms.join(' | '));
  }
}
