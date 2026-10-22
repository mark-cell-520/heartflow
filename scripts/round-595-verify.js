// r595 验收：修复前后对比 —— 相关度主导是否生效
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();

// 断言 1：keywordSearch 已按相关度降序，retrieve 必须保持该降序（不被优先级打乱）
const ks = lr.keywordSearch('confidence_gap', lessonBank.lessons);
const rt = lr.retrieve('confidence_gap', 10);
console.log('A1 keywordSearch top rel =', ks.slice(0, 3).map(l => Number(l._relevance.toFixed(3))));
console.log('A1 retrieve   top rel =', rt.slice(0, 3).map(l => Number(l._relevance.toFixed(3))));
const mono = rt.every((l, i) => i === 0 || rt[i - 1]._relevance >= l._relevance);
console.log('A1 retrieve 相关度单调不升 =', mono);

// 断言 2：构造一个「高相关低优先级」vs「低相关高优先级」的对照，验证相关度主导
const fake = [
  { id: 'hi', content: 'alpha match', importance: 1, frequency: 1, lastSeen: '2026-10-01T00:00:00.000Z', _relevance: 0.9, type: 'x' },
  { id: 'lo', content: 'alpha match', importance: 10, frequency: 9, lastSeen: '2026-10-07T00:00:00.000Z', _relevance: 0.2, type: 'x' },
];
const sorted = lr.relevanceFirstSort(fake).map(l => l.id);
console.log('A2 高相关低优先级 vs 低相关高优先级 → 首位 =', sorted[0], '（应为 hi）');

// 断言 3：ISO 字符串时间字段不得让优先级分数变 NaN
const ps = lr.prioritySort([
  { id: 'a', importance: 5, frequency: 1, lastSeen: '2026-10-01T00:00:00.000Z' },
  { id: 'b', importance: 5, frequency: 1, lastSeen: new Date(Date.now() - 3600000).toISOString() },
]);
console.log('A3 prioritySort 返回数 =', ps.length, '首位(应更近) =', ps[0].id, '（应为 b）');

// 断言 4：无 _relevance 输入时退化为 prioritySort（向后兼容）
const bare = lr.relevanceFirstSort([
  { id: 'a', importance: 1, frequency: 1 },
  { id: 'b', importance: 10, frequency: 1 },
]);
console.log('A4 无相关度时首位 =', bare[0].id, '（应为 b，即优先级行为保留）');

// 断言 5：prioritySort 非数组输入
console.log('A5 非数组输入 =', JSON.stringify(lr.prioritySort(null)), JSON.stringify(lr.prioritySort(undefined)));

// 断言 6：空 query 不应崩
console.log('A6 空 query retrieve =', JSON.stringify(lr.retrieve('', 3)));
