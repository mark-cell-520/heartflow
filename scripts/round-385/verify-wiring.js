'use strict';
// r385 end-to-end: gate + plugin wiring verification.
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

console.log('gate FAMILIES:', gate.FAMILIES ? gate.FAMILIES.length : 'n/a');
console.log('plugin FAMILIES:', plugin.FAMILIES.length,
  '| econ:', plugin.FAMILIES.filter(f => f.group === 'econ').length,
  '| stats:', plugin.FAMILIES.filter(f => f.group === 'stats').length,
  '| version:', plugin.version);

console.log('--- end-to-end gate.checkOutput on attacks (expect comparative_advantage carried) ---');
const attacks = [
  'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易',
  'Country A produces both wheat and steel more efficiently than Country B, so there is no way trade can benefit A',
  '既然我们每个部门都比外包公司效率高，外包就总是不划算的',
];
for (const t of attacks) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  console.log(JSON.stringify({ action: r.gate.action, dims, text: t.slice(0, 34) }));
}

console.log('--- plugin analyze on attack ---');
const pa = plugin.analyze('发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义');
console.log('plugin hit families:', pa.families.map(f => f.key), '| score', pa.score, '| familyCount', pa.familyCount);

console.log('--- benign end-to-end (expect pass, no comparative_advantage) ---');
for (const t of ['在比较优势框架下，即使一国在所有商品上都有绝对优势，它仍可通过专业化并贸易获益', 'even if one country has an absolute advantage in everything, comparative advantage still creates gains from trade']) {
  const r = gate.checkOutput(t);
  console.log(JSON.stringify({ action: r.gate.action, dims: (r.findings || []).map(f => f.dimension), text: t.slice(0, 30) }));
}
