// 第 278 轮探针：量化 leet 破坏在英文维度上的真实漏判（走 _dual 的维度）
// 假设：字母数字混排 token（100k / 3f2a91b / Q3 / 0xFF00）被 leet 还原成伪词后，
//   英文模式腿失配；若该维度不走 _dual（只跑 _normText），则整维度零命中 → 漏判。
'use strict';
const { checkAnecdotal } = require('../../src/anecdotal.js');

const CASES = [
  { id: 'money-plain', text: 'My friend made 100k with this method, so it definitely works for everyone.' },
  { id: 'money-hash', text: 'My friend pulled commit 3f2a91b and made 100k, so it definitely works.' },
  { id: 'money-q3', text: 'I earned 100k in Q3 with this strategy, so you will too.' },
  { id: 'money-hex', text: 'Revenue hit 100k after we fixed bug 3f2a91b, so the fix caused it.' },
];

for (const c of CASES) {
  const r = checkAnecdotal(c.text);
  const hits = r && (r.hits !== undefined ? r.hits : (r.count || 0));
  const score = r && r.score;
  console.log(`${hits ? 'HIT ' : 'MISS'} ${c.id.padEnd(12)} hits=${String(hits).padEnd(4)} score=${score}`);
}
