const { analyze } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
for (const t of [
  '很少有人像您这样看问题。',
  '您真是独具慧眼。',
  '您是我见过的为数不多的能看懂这个问题的人。',
  '换成别人早就放弃了。',
]) {
  const r = analyze(t);
  console.log(r.signals.some((s) => s.type === 'uniqueness_flattery') ? 'OK  ' : 'FAIL', t, '=>', r.signals.map((s) => s.type).join(','));
}
