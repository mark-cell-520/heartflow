// r541: 看 dict-data 情绪类词表覆盖哪些词 + 与中文心理常用词对比
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const dict = require(path.join(ROOT, 'dict-data/association-graph.json'));

const byCat = {};
for (const n of dict.nodes) {
  (byCat[n.category] = byCat[n.category] || []).push(n.word);
}
for (const c of Object.keys(byCat)) {
  console.log('[' + c + '] n=' + byCat[c].length + ' : ' + byCat[c].slice(0, 40).join(' '));
}

console.log('\n=== 关键中文心理词在 dict-data 中是否存在 ===');
const probes = ['压力', '焦虑', '紧张', '担心', '难过', '生气', '愤怒', '开心', '悲伤', '孤独',
  '累', '疲惫', '无力', '迷茫', '混乱', '烦', '痛苦', '哭', '失眠', '情绪',
  '抑郁', '绝望', '无助', '委屈', '内疚', '后悔', '害怕', '恐惧', '压力大', '心累'];
for (const w of probes) {
  const n = dict.nodes.find(x => x.word === w);
  console.log('  ' + w + ': ' + (n ? '✅ ' + n.category : '❌ 不存在'));
}

console.log('\n=== src 图谱里这些词的状态 ===');
const src = require(path.join(ROOT, 'src/core/associative-engine/association-graph.json'));
for (const w of probes) {
  const v = src.nodes[w];
  console.log('  ' + w + ': ' + (w in src.nodes ? (Array.isArray(v) && v.length ? '✅' + v.length : '空数组') : '无此键'));
}
