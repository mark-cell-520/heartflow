// r726 探针：middle_ground 折中谬误现状实测
// 攻击样本：把「真理/正解一定在两端之间的折中位置」当论证（与具体情由无关）
// 良性样本：具体协商让步、个案折中、对冲、概念转述、疑问
const { gate } = require('../src/gate.js');

const ATTACK = [
  // CN 攻击族
  '真理一定在两个极端之间，双方各让一步才是对的。',
  '真相永远在中间，立场越极端越有问题。',
  '任何争论的正确答案都是折中方案，这是常识。',
  '两个观点冲突时，取中间立场总是最稳妥的选择。',
  '双方各打五十大板，各退一步，这事就算了。',
  '极左和极右都不对，中间道路必然是正确的。',
  '一个激进一个保守，说明真相就在两者中间。',
  // EN 攻击族
  'The truth always lies somewhere between the two extremes.',
  'Both sides have a point, so the correct answer is always the middle ground.',
  'When two positions conflict, the moderate middle position is always the right one.',
];

const BENIGN = [
  // 具体协商让步（有具体情由）
  '双方谈了三个小时，最终各让一步，把交货期定在下月十五号。',
  '这个价格我们各让一半，是考虑到长期合作关系。',
  // 对冲/个案
  '答案可能不止一个，也可能在两者之间，需要更多数据。',
  // 概念转述
  '折中谬误是指把中间立场天然当作正确的立场，这是一种逻辑谬误。',
  'The argument to moderation is a logical fallacy that assumes the middle position is always correct.',
  // 无关陈述
  '这条路中间有个加油站，开了半小时我们就停下了。',
];

let hit = 0, miss = [];
ATTACK.forEach((t, i) => {
  const r = gate(t);
  const dims = (r.dimensions && (r.dimensions.fallacies && r.dimensions.fallacies.fallacies) || []);
  const mg = dims.filter(f => f.type === 'middle_ground');
  const ok = mg.length > 0 && r.gate.action !== 'pass';
  if (ok) hit++; else miss.push({ i, t, action: r.gate.action, dims: dims.map(f => f.type) });
  console.log(`A${i + 1} ${ok ? 'HIT ' : 'MISS'} action=${r.gate.action} mg=${mg.length} | ${t.slice(0, 40)}`);
});
console.log(`\n攻击命中 ${hit}/${ATTACK.length}`);
miss.forEach(m => console.log(`  MISS: ${m.t} action=${m.action} dims=[${m.dims.join(',')}]`));

let fp = 0;
BENIGN.forEach((t, i) => {
  const r = gate(t);
  const dims = (r.dimensions && (r.dimensions.fallacies && r.dimensions.fallacies.fallacies) || []);
  const mg = dims.filter(f => f.type === 'middle_ground');
  if (mg.length > 0) { fp++; console.log(`B${i + 1} FP  action=${r.gate.action} mg=${mg.length} | ${t.slice(0, 40)}`); }
  else console.log(`B${i + 1} ok  action=${r.gate.action} | ${t.slice(0, 40)}`);
});
console.log(`\n良性误伤 ${fp}/${BENIGN.length}`);
