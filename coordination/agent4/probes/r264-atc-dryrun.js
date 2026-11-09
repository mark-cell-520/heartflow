// r264 affirming_the_consequent 补丁后干跑（模块层 + gate 层）
const { checkAffirmingTheConsequent: f } = require('/data/home/heartflow/src/affirming-the-consequent.js');
const hf = require('/data/home/heartflow/src/gate.js');
const attacks = [
  '努力的人都会早起；他天天早起，足见他很努力。',
  '好的代码都有测试；这个模块有测试，据此可得代码质量高。',
  '靠谱的厂商都敢公开供应链；这家敢公开，毫无疑问它靠谱。',
  '精英都住这个区；他住这个区，反映出他是精英。',
  'Good code has tests. This module has tests, which indicates the code is good.',
  'Honest people admit mistakes. He admitted his, which suggests he is honest.',
  'Top performers read a lot. She reads a lot, which points to her being a top performer.',
  'Real leaders delegate. He delegated the whole project, which shows that he is a real leader.',
  'Serious founders code. She coded the prototype herself, which implies that she is a serious founder.',
  'Founders read a lot. She reads a lot, so it follows that she is a founder.',
  'Champions train daily. He trains daily, therefore he is a champion.',
];
const benign = [
  '努力的人都会早起；他天天早起，不过早起未必说明努力。',
  '好的代码都有测试；这个模块有测试，但测试只是必要条件，不能反推质量。',
  '靠谱的厂商都敢公开供应链；这家敢公开，但公开未必说明它靠谱。',
  'Good code has tests. This module has tests, which indicates nothing about quality on its own.',
  'Honest people admit mistakes. He admitted his, which suggests honesty is only one possible reading.',
  'Champions train daily. He trains daily, therefore he might be a champion.',
  'Honest people admit mistakes. He admitted his, though this is only one signal.',
];
let ah = 0, bh = 0, ag = 0;
for (const s of attacks) {
  const r = f(s);
  const g = hf.gate(s);
  const dim = (g.findings || []).some(x => x.dimension === 'affirming_the_consequent');
  if (r.verdict === 'unsupported') ah++;
  if (dim) ag++;
  console.log((r.verdict === 'unsupported' ? 'HIT' : 'miss') + ' gate=' + (g.gate ? g.gate.action : '?') + (dim ? '(dim)' : '') + '  ' + s.slice(0, 42));
}
for (const s of benign) {
  const r = f(s);
  const dim = (hf.gate(s).findings || []).some(x => x.dimension === 'affirming_the_consequent');
  if (r.verdict === 'unsupported') bh++;
  if (r.verdict === 'unsupported' || dim) console.log('误伤! ' + s.slice(0, 42));
}
console.log('==> 攻击 ' + ah + '/' + attacks.length + ' 模块命中, ' + ag + '/' + attacks.length + ' gate 维度承重; 良性误伤 ' + bh + '/' + benign.length);
