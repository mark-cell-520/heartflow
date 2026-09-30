// 第 154 轮探针 7：归因最后 1 条未命中（A2 R141 原池：锚点+单英文动词，无代词小句）
// 并确认该形状在 r142 纪律下是否本来就该单族不评分。
'use strict';
const path = require('path');
const { detect } = require(path.join(__dirname, '..', '..', 'src', 'shield', 'ai-writing-tell.js'));

const A2 = '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。';
const r = detect(A2);
console.log('A2 findings:');
for (const f of r.findings) console.log(`  dim=${f.dimension} sev=${f.severity} trig="${f.trigger}" zhEnSrc=${f.zhEnSrc || '-'}`);
console.log(`score=${r.score} fams=${r.familiesHit} co=${r.coOccurrence}`);
console.log('\n=r142 反向确认样本（SINGLE_FAMILY[0]）：折叠纪律下锚点支与 tier-attributive');
console.log('同属 zh-en-mixing 一票 → 设计上单族不评分，改判据会破纪律，不动。');

// r142 的那条同形样本
const S = '综上所述，我们需要 comprehensively evaluate 这个方案的优劣。';
const r2 = detect(S);
console.log(`\nr142 SINGLE_FAMILY[0] 复测: score=${r2.score} co=${r2.coOccurrence}（阈值守卫要求 score=0）`);
