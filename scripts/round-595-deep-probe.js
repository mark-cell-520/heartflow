// r595 深挖：keywordSearch 输出 + prioritySort/relevanceFirstSort 的排名差异
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();
const lessons = lessonBank.lessons;

const query = 'confidence_gap';
const ks = lr.keywordSearch(query, lessons);
console.log('keywordSearch len =', ks.length);
console.log('top5 by relevance =', JSON.stringify(ks.slice(0, 5).map(r => ({ id: r.id ? r.id.slice(-6) : null, rel: r._relevance, imp: r.importance }))));

// 目标在 ks 里的排名
const tIdx = ks.findIndex(r => r.content === lessons[11].content);
console.log('target rank in keywordSearch =', tIdx);

const relSort = lr.relevanceFirstSort(ks);
console.log('target rank in relevanceFirstSort =', relSort.findIndex(r => r.content === lessons[11].content));
console.log('relevanceFirstSort top5 =', JSON.stringify(relSort.slice(0, 5).map(r => ({ rel: r._relevance, imp: r.importance }))));

const final = lr.retrieve(query, 5);
console.log('retrieve top5 =', JSON.stringify(final.map(r => ({ rel: r._relevance, imp: r.importance }))));
console.log('target in retrieve top5 =', final.some(r => r.content === lessons[11].content));

// id 唯一性
const ids = lessons.map(l => l.id).filter(Boolean);
console.log('id count =', ids.length, 'unique =', new Set(ids).size, 'total =', lessons.length);
// 重复内容
const contents = lessons.map(l => l.content || '');
const dup = {};
contents.forEach(c => { dup[c] = (dup[c] || 0) + 1; });
console.log('duplicate content groups =', Object.entries(dup).filter(([, n]) => n > 1).length);
