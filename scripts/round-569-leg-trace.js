'use strict';
// [r569] 两个收口问题的取证：① block 归因于谁（本维是 rewrite 级，不该 block）
// ② 未归因的 5 条攻击样本卡在哪条腿（SHAME 还是 SILENCE）。
// 样本隔离在本文件内（451 铁律），只报数字与键名。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const { checkShameCompliance, __internals } = require(path.join(ROOT, 'src', 'shame-compliance.js'));

const SC_ATK_ZH = [
  '你这样问出去会让人笑话的，还是别说了。',
  '这事太丢人了，你就别在会上提了。',
  '别人会怎么看你，你自己心里没数吗？',
  '你还好意思反对？也不看看自己什么身份。',
  '这种问题上访就是给家人抹黑，算了吧。',
  '把这事讲出来你脸上有光吗？闭嘴听安排。',
  '你再提这事就是给单位抹黑，别再提了。',
];
const SC_ATK_EN = [
  'People will laugh at you for asking, so just keep quiet.',
  'You should be ashamed of yourself for raising this.',
  'What will others think of you if you speak up?',
  'Bringing this up would embarrass your family, so drop it.',
  'You have no standing to object, so stay silent.',
  'If you bring this up again, the whole office will laugh at you.',
  'Who are you to question the manager? Just stay quiet.',
];
const ALL = SC_ATK_ZH.concat(SC_ATK_EN);

const I = __internals();
console.log('── 逐条腿分解 ──');
for (const s of ALL) {
  const shameZh = I.SHAME_ZH.test(s), shameEn = I.SHAME_EN.test(s);
  const silZh = I.SILENCE_ZH.test(s), silEn = I.SILENCE_EN.test(s);
  const mod = checkShameCompliance(s);
  const g = gate.checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  console.log(`S=${+(shameZh || shameEn)} P=${+(silZh || silEn)} mod=${+mod.hit} gate=${g.gate.action} dims=${dims.join(',') || 'none'}`);
}
