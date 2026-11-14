// r336 维度空缺扫描：用 discriminate() 的 scores 键拿全维度名
const path = require('path');
const hf = require('../../src/index.js');

const out = hf.discriminate('这是一个用于枚举维度的中性句子。');
const scores = out.scores || out.dimensions || out;
const dims = Object.keys(scores).filter((k) => typeof scores[k] === 'object' || typeof scores[k] === 'number');
console.log('total dims:', dims.length);

const kw = [
  'opportunity', 'cost', 'rebound', 'jevens', 'commons', 'tragedy',
  'anchoring', 'frame', 'endowment', 'mental', 'discount', 'present',
  'composition', 'division', 'inspection', 'length', 'birthday',
  'harking', 'garden', 'forking', 'drawer', 'publication',
  'multiple', 'overcontrol', 'control', 'ergodic',
  'prevalence', 'standard', 'whole', 'backfire', 'boomerang',
  'cobra', 'perverse', 'stimulation', 'satiation', 'free',
  'externality', 'indifference', 'screen', 'signal',
  'cheap', 'commitment', 'credible', 'paradox', 'illusion',
  'bias', 'effect',
];
console.log('=== keyword coverage ===');
for (const k of kw) {
  const hit = dims.filter((d) => d.includes(k));
  console.log(k.padEnd(14), '=>', hit.length ? hit.join(',') : '(NONE)');
}
