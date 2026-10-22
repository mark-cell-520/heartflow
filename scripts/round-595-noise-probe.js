// r595：0.07 分噪声的来源 + 阈值行为
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();
const lessons = lessonBank.lessons;

for (const q of ['profile', 'supervisorctl', 'status']) {
  const idf = lr._computeIDF(q);
  const target = lessons.find(l => (l.content || '').includes('执行明确指令时'));
  console.log(JSON.stringify({
    q,
    idf: [...idf].map(([k, v]) => [k, Number(v.toFixed(3))]),
    targetRel: Number(lr._relevanceScore(q, target, idf).toFixed(4)),
    targetNgram: Number(lr._ngramScore(q, target).toFixed(4)),
    targetTerms: lr._tokenize((target.content || '')),
    queryTerms: lr._tokenize(q),
  }));
}
// 全库 rel 分布
const ks = lr.keywordSearch('profile', lessons);
console.log('profile hits =', ks.length, 'scores =', JSON.stringify([...new Set(ks.map(l => Number(l._relevance.toFixed(3))))]));
