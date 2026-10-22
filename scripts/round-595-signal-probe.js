// r595：同分项可用的区分信号盘点
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();
const lessons = lessonBank.lessons;

// confidence_gap 命中集合
const ks = lr.keywordSearch('confidence_gap', lessons);
console.log('keywordSearch hits =', ks.length);
const fields = ['importance', 'frequency', 'accessCount', 'lastSeen', 'createdAt', 'type', 'trigger', 'context', 'tags'];
const stats = {};
for (const f of fields) {
  const vals = new Set(ks.map(l => JSON.stringify(l[f])));
  stats[f] = vals.size;
}
console.log('distinct values among 159 hits =', JSON.stringify(stats));

// 这些命中项与查询的其他关联信号
console.log('context 非空数 =', ks.filter(l => l.context && l.context.length).length);
console.log('trigger 分布 =', JSON.stringify(ks.reduce((m, l) => { m[l.trigger || 'none'] = (m[l.trigger || 'none'] || 0) + 1; return m; }, {})));

// 关键：这些 lesson 的 content 是否真的与查询等长相关？取一个完整 content 看
console.log('sample content =', JSON.stringify(ks[0].content));
console.log('sample content 长度分布 =', JSON.stringify({ min: Math.min(...ks.map(l => (l.content || '').length)), max: Math.max(...ks.map(l => (l.content || '').length)) }));

// 目标 lesson 的相对位置线索：accessCount/frequency
console.log('accessCount 分布 =', JSON.stringify(ks.reduce((m, l) => { m[l.accessCount || 0] = (m[l.accessCount || 0] || 0) + 1; return m; }, {})));
