// r398 诊断：为什么 4 条攻击未由新族承重
'use strict';
const { checkRedHerring, __internals } = require('/data/home/heartflow/src/red-herring.js');
const I = __internals();
const samples = [
  '他被质疑论文数据造假，但导师是领域内的权威专家。',
  '市民抱怨房价太高，但开发商强调他们上缴了巨额税收。',
  'She criticized the restaurant for poor hygiene, but the owner emphasized how many students he had funded.',
  '他说这家餐馆卫生差，老板立刻强调自己资助了多少学生。',
];
for (const t of samples) {
  const r = checkRedHerring(t);
  console.log(JSON.stringify(r), '|', t.slice(0, 24));
  const cands = I.MARKERS
    .filter((m) => m.kind === 'concede' || m.kind === 'narrate')
    .map((m) => ({ m, x: m.re.exec(t) }))
    .filter((c) => c.x);
  for (const c of cands) {
    const idx = c.x.index;
    const before = t.slice(0, idx).trim();
    const after = t.slice(idx + c.x[0].length).trim();
    const crit = I.CRITICISM_ZH.some((re) => re.test(before)) || I.CRITICISM_EN.some((re) => re.test(before));
    const merit = I.MERIT_ZH.some((re) => re.test(after)) || I.MERIT_EN.some((re) => re.test(after));
    const exc = I.EXCUSE_ZH.some((re) => re.test(after)) || I.EXCUSE_EN.some((re) => re.test(after));
    const addr = I.ADDRESS_ZH.some((re) => re.test(after)) || I.ADDRESS_EN.some((re) => re.test(after));
    console.log('   ', c.m.kind, JSON.stringify(c.x[0]), 'crit=' + crit, 'merit=' + merit, 'excuse=' + exc, 'addr=' + addr);
    console.log('      before=', JSON.stringify(before), 'after=', JSON.stringify(after));
  }
}
