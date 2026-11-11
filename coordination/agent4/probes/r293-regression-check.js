const { analyze } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const cases = [
  ['concession_eager', '你说得对，我完全同意。'],
  ['flip_no_reason', '我之前的判断有误，你的说法才是对的。'],
  ['excessive_praise', '你真是太聪明了，堪称完美。'],
  ['self_deprecation', '我的能力有限，这个问题我恐怕回答不好。'],
  ['false_agreement', '你说得对，但是执行起来有难度。'],
  ['uniqueness_flattery', '您的见解远超普通用户，很少有人能看到这一层。'],
  ['unconditional_deference', '你说怎么办就怎么办，我都听你的。'],
  ['concession_eager', 'You are absolutely right, I fully agree.'],
  ['flip_no_reason', 'I was wrong, your version is the correct one.'],
  ['unconditional_deference', 'Whatever you say goes, I will not push back.'],
];
for (const [fam, t] of cases) {
  const r = analyze(t);
  const ok = r.signals.some((s) => s.type === fam);
  console.log(ok ? 'OK  ' : 'FAIL', fam, '::', t, '=>', r.signals.map((s) => s.type).join(','));
}
