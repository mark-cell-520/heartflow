const m = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const p = m.EN_SIGNALS.echo_validation[1];
console.log('source:', p.source.slice(0, 200));
console.log('flags:', p.flags);
const samples = [
  'You said it yourself — the numbers do not add up.',
  'You said it yourself, the numbers do not add up.',
  'By your own account, the premise falls apart, beyond any further doubt.',
  'As you yourself put it, the claim fails, that is the end of it.',
];
for (const s of samples) console.log(p.test(s), '::', s);
console.log('--- analyze dispatch check ---');
const r = m.analyze('You said it yourself, the numbers do not add up.');
console.log('lang:', r.lang, 'score:', r.score, 'signals:', JSON.stringify(r.signals));
