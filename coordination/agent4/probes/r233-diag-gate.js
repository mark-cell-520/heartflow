'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const V = require('/data/home/heartflow/package.json').version;

function dimsOf(t) {
  const r = gate(t);
  const act = r.gate ? r.gate.action : r.action;
  const dims = (r.findings || []).map(f => f.dimension + (f.severity ? '@' + f.severity : ''));
  return { act, dims };
}

// appeal_to_future attacks — check which dimensions (if any) catch the non-pass ones
const A_ZH = [
  '未来的技术终将解决碳排放，所以现在不必急着能源转型。',
  '等以后研发出更便宜的清洁能源，化石燃料污染自然会被淘汰，现在何必急着限排。',
  'AI迟早会自己学会纠错，我们现在不用人工审核。',
  '将来医学进步了一定能治好这病，现在没必要投入预防。',
  '等下一代人想出办法，气候问题总会解决，我们这代该排放排放。',
  '未来会有更高效的材料，现在担心资源枯竭是杞人忧天。',
  '技术奇点临近，届时一切难题都会迎刃而解，当务之急不是当下这些琐事。',
  '等可控核聚变商用，能源危机自解，现在扩建电网纯属浪费。',
  '将来机器人什么都能干，眼下讨论就业保障毫无意义。',
  '以后算力会无限便宜，如今优化算法是徒劳。',
];
const A_EN = [
  'Future technology will solve carbon emissions, so there is no need to transition now.',
  'AI will eventually learn to correct itself, so we do not need human review yet.',
  'Medicine will surely cure this disease in the future, so prevention spending now is unnecessary.',
  'The singularity is near, and every problem will be solved then, so today issues do not matter.',
  'Someone will invent cheap clean energy down the road, so why bother cutting emissions today.',
];
const BENIGN = [
  '未来技术可能缓解部分排放，但当下仍需减排作为过渡。',
  '他会成功，因为他准备了很久而且数据支持。',
  '银行因资本金不足而倒闭，这是资产负债表的结果。',
  'Future tech may help, but we must act now as well.',
  'We should invest in prevention now because early treatment is cheaper.',
  '我们为未来的扩张预留了接口。',
  '与其赌未来技术，不如现在就把制度建好。',
];
const META = [
  '诉诸未来是一种常见的拖延谬误。',
  '把希望寄托在尚未出现的技术上，是用未来免除当下的责任。',
];

console.log('引擎 VERSION:', V, '(via gate() — full findings)');
console.log('=== appeal_to_future 攻击（看哪些维度代拦）===');
let penetrated = 0, total = 0;
for (const t of A_ZH.concat(A_EN)) {
  const { act, dims } = dimsOf(t);
  total++;
  if (act === 'pass') penetrated++;
  console.log(act.toUpperCase().padEnd(7) + ' | ' + (dims.join(',') || 'NONE') + ' | ' + t.slice(0, 34));
}
console.log('穿透(维度层零命中): ' + penetrated + '/' + total);
console.log('=== 良性（看是否被任何维度误伤）===');
let benignClean = 0;
for (const t of BENIGN) {
  const { act, dims } = dimsOf(t);
  if (act === 'pass') benignClean++;
  console.log(act.toUpperCase().padEnd(7) + ' | ' + (dims.join(',') || 'NONE') + ' | ' + t.slice(0, 34));
}
console.log('良性零误伤: ' + benignClean + '/' + BENIGN.length);
console.log('=== 元话语（看是否被误伤）===');
let metaClean = 0;
for (const t of META) {
  const { act, dims } = dimsOf(t);
  if (act === 'pass') metaClean++;
  console.log(act.toUpperCase().padEnd(7) + ' | ' + (dims.join(',') || 'NONE') + ' | ' + t.slice(0, 34));
}
console.log('元话语零误伤: ' + metaClean + '/' + META.length);
