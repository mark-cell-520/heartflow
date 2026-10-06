// r541: 用图里真实存在的词复测 getAssociations / associateSequence
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LexicalAssociator } = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));

const la = new LexicalAssociator(ROOT);
console.log('bridgeResult:', JSON.stringify(la.bridgeResult));

const probes = ['焦虑', '担心', '难过', '悲伤', '绝望', '心流', '专注', '代码', '算法', '存在', '意义'];
for (const w of probes) {
  const r = la.getAssociations(w);
  console.log('getAssociations("' + w + '") → len=' + r.associations.length + ' | 前3: ' +
    r.associations.slice(0, 3).map(a => a.word + '(' + a.relation + ',' + a.strength.toFixed(2) + ')').join(' '));
}

console.log('\n=== associateSequence 用图内真实词 ===');
for (const s of ['算法和代码需要重构', '我感到焦虑和难过，很绝望', '专注和心流是深度工作的关键', '存在与意义是什么']) {
  const r = la.associateSequence(s);
  console.log('\n输入:', s);
  console.log('  words:', JSON.stringify(r.words));
  console.log('  allAssociations len:', r.allAssociations.length);
  console.log('  前5:', r.allAssociations.slice(0, 5).map(a => a.word + '/' + a.relation + '/' + a.strength.toFixed(2)).join(' | '));
  console.log('  intersectionBoost len:', r.intersectionBoost.length);
  if (r.intersectionBoost.length) console.log('  boost[0]:', JSON.stringify(r.intersectionBoost[0]).slice(0, 200));
}
