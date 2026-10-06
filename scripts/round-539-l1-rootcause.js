// r539: 定位 L1 对联图加载后 associations 仍为空的真实原因
const path = require('path');
const ROOT = process.cwd();

// 复现 engine 内部构造路径
const e = new (require(path.join(ROOT, 'src/archive/associative-engine.js')).AssociativeEngine)(ROOT);

console.log('engine.projectRoot =', e.projectRoot);
console.log('lexicalAssociator.projectRoot =', e.lexicalAssociator.projectRoot);
console.log('lexicalAssociator.graphFile =', e.lexicalAssociator.graphFile);
console.log('graph nodes =', Object.keys(e.lexicalAssociator.graph.nodes || {}).length);
console.log('_frequencyMap keys =', Object.keys(e.lexicalAssociator.graph._frequencyMap || {}).length);

// 手动跑 associateWord 看 getAssociations 返回
const w = '代码';
console.log('\n--- 直接测 associateWord("代码") ---');
const r = e.lexicalAssociator.associateWord(w, {});
console.log('return keys =', Object.keys(r));
console.log('associations len =', (r.associations || []).length);
console.log('associations sample =', JSON.stringify((r.associations || []).slice(0, 5)));

console.log('\n--- getAssociations("代码") ---');
const g = e.lexicalAssociator.getAssociations(w, {});
console.log('keys =', Object.keys(g));
console.log('associations len =', (g.associations || []).length);
console.log('sample =', JSON.stringify((g.associations || []).slice(0, 5)));

console.log('\n--- 手动 associateSequence("这绝对是唯一正确的方案") ---');
const s = e.lexicalAssociator.associateSequence('这绝对是唯一正确的方案');
console.log('words =', JSON.stringify(s.words));
console.log('allAssociations len =', s.allAssociations.length);
console.log('wordFrequencies keys =', Object.keys(s.wordFrequencies));

console.log('\n--- 换英文测 associateSequence("I am coding a function") ---');
const s2 = e.lexicalAssociator.associateSequence('I am coding a function');
console.log('words =', JSON.stringify(s2.words));
console.log('allAssociations len =', s2.allAssociations.length);

console.log('\n--- 单个词直测（绕过 sequence 的 length>1 过滤）---');
for (const word of ['代码', '函数', '算法', 'class', 'function', 'run']) {
  const rr = e.lexicalAssociator.getAssociations(word, {});
  console.log('  ' + word + ' → associations=' + (rr.associations || []).length);
}
