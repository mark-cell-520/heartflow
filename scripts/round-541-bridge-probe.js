// r541: 直接测 LexicalAssociator（不走 AssociativeEngine）看桥接是否真的生效
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LexicalAssociator } = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));

const la = new LexicalAssociator(ROOT);
console.log('bridgeStats:', JSON.stringify(la.bridgeStats));
console.log('bridgeResult:', JSON.stringify(la.bridgeResult));
console.log('graph nodes count:', Object.keys(la.graph.nodes || {}).length);
const nonEmpty = Object.entries(la.graph.nodes || {}).filter(([k, v]) => Array.isArray(v) && v.length);
console.log('non-empty nodes:', nonEmpty.length, '/', Object.keys(la.graph.nodes).length);
console.log('sample non-empty:', nonEmpty.slice(0, 5).map(([k, v]) => k + '→' + v.length + '条').join(' | '));

console.log('\n--- 压力 的关联 ---');
console.log(JSON.stringify(la.graph.nodes['压力'] || []).slice(0, 400));
console.log('--- 焦虑 的关联 ---');
console.log(JSON.stringify(la.graph.nodes['焦虑'] || []).slice(0, 400));
console.log('--- 代码 的关联 ---');
console.log(JSON.stringify(la.graph.nodes['代码'] || []).slice(0, 300));

console.log('\n--- associateWord("压力") ---');
const a1 = la.associateWord('压力');
console.log('len=', a1.length, JSON.stringify(a1.slice(0, 3)));

console.log('\n--- associateSequence("我现在压力很大，心里很乱") ---');
const r = la.associateSequence('我现在压力很大，心里很乱，不知道该怎么办。');
console.log('keys:', Object.keys(r));
console.log('words:', JSON.stringify(r.words));
console.log('allAssociations len:', r.allAssociations.length);
console.log('allAssociations[0..4]:', JSON.stringify(r.allAssociations.slice(0, 5)));
console.log('wordFrequencies:', JSON.stringify(r.wordFrequencies));
console.log('intersectionBoost len:', r.intersectionBoost.length);
