const m = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/disjunctive-fallacy.js');
const t9 = 'Either you agree with the plan or you are against progress';
console.log('D1en:', m.DISJ_EN.test(t9), 'EXCLen:', m.EXCLUDE_INFER_EN.test(t9));
const r = /\byou(?:'re| are)\s+[^.!?;]{2,50}?\s+or\s+(?:you(?:'re| are)\s+)?(?:against|anti-|opposing)\s+[^.!?;]{2,40}\b/i;
console.log('A9 leg:', r.test(t9));
// 诊断: you are against 中 you 后无内容——[^.!?;]{2,50}? 至少要 2 字符
const r2 = /\byou(?:'re| are)\s+[^.!?;]{2,50}?\s+or\b/i;
console.log('前半腿 you...or:', r2.test(t9));
const r3 = /\byou\s+are\s+against\s+progress\b/i;
console.log('后半腿:', r3.test(t9));
