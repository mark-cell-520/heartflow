// 第 278 轮探针：直接对比「原文 vs 归一化」在 anecdotal 维度上的差异
// 若归一化把 100k 破坏成 iook，则原文命中而归一化不命中 → _dual 会取原文，零影响；
// 但若某维度不走 _dual（只吃 _normText），就整维度失配。这里先确认 normalize 的破坏事实。
'use strict';
const tn = require('../../src/text-normalizer.js');

const CASES = [
  'My friend made 100k with this method, so it definitely works for everyone.',
  'I earned 100k in Q3 with this strategy, so you will too.',
  'Revenue hit 100k after we fixed bug 3f2a91b, so the fix caused it.',
  'The team shipped 3f2a91b on 2026-11-10 and everything broke.',
  'We tested 0xFF00 and 0x00FF masks on the Q3 build.',
  'Version v6.8.159 changed the API, and 99% of users upgraded.',
  'Sales rose from 50 to 100k in one quarter, a 200% jump.',
];

for (const c of CASES) {
  const r = tn.normalize(c);
  const norm = r.normalized !== undefined ? r.normalized : r;
  const applied = (r.applied || []).join(',');
  const diff = norm !== c;
  console.log(`${diff ? 'CHANGED' : 'same   '} [${applied}]`);
  if (diff) {
    console.log(`   原: ${c}`);
    console.log(`   归: ${norm}`);
  }
}
