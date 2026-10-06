// r541: 查 压力 为何仍空 + associateWord 返回结构
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LexicalAssociator } = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));
const dict = require(path.join(ROOT, 'dict-data/association-graph.json'));

const la = new LexicalAssociator(ROOT);

console.log('=== dict-data 里是否有「压力」 ===');
const pn = dict.nodes.filter(n => n.word === '压力');
console.log('dict nodes 命中心词「压力」:', pn.length, pn.map(n => n.id + '/' + n.category).join(','));
const pIds = new Set(pn.map(n => n.id));
const pe = dict.edges.filter(e => pIds.has(String(e.source)) || pIds.has(String(e.target)));
console.log('含「压力」的边:', pe.length);
for (const e of pe.slice(0, 6)) {
  const s = dict.nodes.find(n => String(n.id) === String(e.source));
  const t = dict.nodes.find(n => String(n.id) === String(e.target));
  console.log('   ', s && s.word, '->', t && t.word, 'w=' + e.weight);
}

console.log('\n=== src 图谱里是否有「压力」（含空数组） ===');
console.log('graph nodes 有「压力」键吗:', '压力' in la.graph.nodes);
console.log('值:', JSON.stringify(la.graph.nodes['压力']));

console.log('\n=== associateWord 返回结构 ===');
const r = la.associateWord('压力');
console.log('typeof:', typeof r, '| Array?', Array.isArray(r), '| keys:', r && typeof r === 'object' ? Object.keys(r) : r);
if (r && typeof r === 'object' && !Array.isArray(r)) {
  for (const k of Object.keys(r)) {
    const v = r[k];
    console.log('  .' + k + ':', Array.isArray(v) ? 'arr len=' + v.length : JSON.stringify(v).slice(0, 120));
  }
  if (Array.isArray(r.associations)) console.log('  associations[0..2]:', JSON.stringify(r.associations.slice(0, 3)));
  if (Array.isArray(r.words)) console.log('  words:', JSON.stringify(r.words));
  if (r.result) console.log('  result:', JSON.stringify(r.result).slice(0, 300));
}

console.log('\n=== associateSequence 全字段 ===');
const sq = la.associateSequence('我现在压力很大，心里很乱，不知道该怎么办。');
for (const k of Object.keys(sq)) {
  const v = sq[k];
  console.log('  ' + k + ':', Array.isArray(v) ? 'arr len=' + v.length + ' ' + JSON.stringify(v).slice(0, 220) : JSON.stringify(v).slice(0, 180));
}
