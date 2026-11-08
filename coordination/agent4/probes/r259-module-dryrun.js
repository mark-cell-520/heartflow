// r259 module-level diag — 直调 src/appeal-tradition.js 看新路由命中情况
const m = require('/data/home/heartflow/src/appeal-tradition.js');
const I = m.__internals();
const tests = [
  '这是百年老字号的古法工艺，肯定靠谱。',
  '古圣先贤早就把道理说透了，照做就行。',
  '土办法虽然上不了台面，但几代人验证过。',
  '家风祖训历来如此，不能到我这里变了。',
  '旧俗如此，入乡随俗，别计较。',
  '这个配方是清宫里传出来的，能有问题吗。',
  '古法炮制的中药，比机器加工的强。',
  'It is a century-old recipe handed down through the family.',
  'The old ways worked fine for my grandfather, so they are fine for me.',
  'It is a tried-and-true method, proven over the centuries.',
  'The status quo has served us well, so do not rock the boat.',
  'It is our heritage — an ancestral practice nobody should touch.',
  'Old-school craftsmanship beats anything modern.',
  'It is folk wisdom passed down from time immemorial.',
  '这个先例不能开，坏了规矩以后没法管。',
  '祖上的规矩碰不得，别在这件事上破例。',
  '一切维持现状就好，不要节外生枝。',
  '都由厂里老职工定夺，新来的少插嘴。',
  '先人的法度不容置喙，执行便是。',
  '别标新立异了，老老实实按老法子来。',
  'We must not rock the boat on this one.',
  'Do not fix what is not broken — keep the status quo.',
  'Leave well enough alone; that is not for us to change.',
  'Keep the established order intact, no matter what.',
];
function spans(list, s) {
  const out = [];
  for (const b of list) {
    const g = new RegExp(b.source, b.flags.indexOf('g') >= 0 ? b.flags : b.flags + 'g');
    let mm; while ((mm = g.exec(s)) !== null) { if (mm[0].length === 0) { g.lastIndex++; continue; } out.push(b.source.slice(0, 28) + '=>' + mm[0]); }
  }
  return out;
}
const tb = [].concat(Object.values(I.TRAD_ZH_BRANCHES), Object.values(I.TRAD_EN_BRANCHES));
const sb = [].concat(Object.values(I.SUPP_ZH_BRANCHES), Object.values(I.SUPP_EN_BRANCHES));
const cb = [].concat(Object.values(I.CONCL_ZH_BRANCHES), Object.values(I.CONCL_EN_BRANCHES));
for (const t of tests) {
  const r = m.checkAppealToTradition(t);
  const s = t.split(/[。！？；!?;\n]+/).filter(Boolean)[0] || t;
  console.log((r.hit ? '[HIT ] ' : '[miss] ') + JSON.stringify(t));
  if (!r.hit) {
    console.log('   trad: ' + JSON.stringify(spans(tb, s)));
    console.log('   supp: ' + JSON.stringify(spans(sb, s)));
    console.log('   concl: ' + JSON.stringify(spans(cb, s)));
  }
}
