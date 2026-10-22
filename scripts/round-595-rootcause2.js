// r595 根因定位：为什么 bank 内真实词查询 recall@5 只有 ~7%
// 打印每个 lesson 的检索诊断：查询词、返回数、目标 lesson 的排名
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();
const lessons = lessonBank.lessons;

// 取一条"能命中自己的"和一条"命不中"的对比
function diag(idx, query) {
  const res = lr.retrieve(query, 5);
  const target = (lessons[idx].content || '');
  const rank = res.findIndex(r => (r.content || '') === target);
  // 重算目标的相关度
  const idf = lr._computeIDF(query);
  const rel = lr._relevanceScore(query, lessons[idx], idf);
  const ng = lr._ngramScore(query, lessons[idx]);
  console.log(JSON.stringify({
    idx, query: query.slice(0, 24),
    returned: res.length, rank,
    targetRelevance: Number(rel.toFixed(4)),
    targetNgram: Number(ng.toFixed(4)),
    combined: Number((rel * 0.7 + ng * 0.3).toFixed(4)),
    topScores: res.slice(0, 3).map(r => Number((r._relevance || 0).toFixed(4))),
  }));
}

// 找一个能命中自己的
const hits = [];
for (let i = 0; i < 40 && hits.length < 3; i++) {
  const m = String(lessons[i].content || '').match(/[a-z][a-z0-9_-]{3,}/g) || [];
  if (!m.length) continue;
  const q = m.sort((a, b) => b.length - a.length)[0];
  const res = lr.retrieve(q, 5);
  if (res.some(r => r.content === lessons[i].content)) hits.push([i, q]);
}
console.log('=== 命中案例 ===');
hits.forEach(([i, q]) => diag(i, q));

// 找命不中的
const miss = [];
for (let i = 0; i < 40 && miss.length < 4; i++) {
  const m = String(lessons[i].content || '').match(/[a-z][a-z0-9_-]{3,}/g) || [];
  if (!m.length) continue;
  const q = m.sort((a, b) => b.length - a.length)[0];
  const res = lr.retrieve(q, 5);
  if (!res.some(r => r.content === lessons[i].content)) miss.push([i, q]);
}
console.log('=== 未命中案例 ===');
miss.forEach(([i, q]) => diag(i, q));
