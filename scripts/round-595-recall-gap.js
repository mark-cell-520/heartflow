// r595 缺口量化：中文 vs 英文的 retrieval recall@5 对比
// 方法：对每条 lesson 取其内容中的真实子串做查询，看能否把该 lesson 检索回来
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();
const lessons = lessonBank.lessons;

function evalRecall(pick, label) {
  let total = 0, hit = 0;
  const misses = [];
  lessons.forEach((l, idx) => {
    const sub = pick(l);
    if (!sub) return;
    total++;
    const res = lr.retrieve(sub, 5);
    const ok = res.some(r => (r.content || '') === (l.content || ''));
    if (ok) hit++; else misses.push({ idx, sub: sub.slice(0, 30) });
  });
  console.log(`${label}: recall@5 = ${hit}/${total} = ${(hit / Math.max(1, total) * 100).toFixed(1)}%`);
  return { total, hit, misses };
}

// 中文：取内容中最长的连续中文片段（真实存在的词块）
const cjk = evalRecall(l => {
  const m = String(l.content || '').match(/[\u4e00-\u9fff]{3,}/g) || [];
  if (!m.length) return null;
  return m.sort((a, b) => b.length - a.length)[0].slice(0, 10);
}, 'CJK_word_block ');

// 中文：跨词块的概念查询（取两个不相邻中文片段拼接，模拟真实概念检索）
const cjkX = evalRecall(l => {
  const m = String(l.content || '').match(/[\u4e00-\u9fff]{2,}/g) || [];
  if (m.length < 2) return null;
  return m[0].slice(0, 4) + ' ' + m[1].slice(0, 4);
}, 'CJK_cross_term ');

// 英文：取最长的 latin 词
const lat = evalRecall(l => {
  const m = String(l.content || '').toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) || [];
  if (!m.length) return null;
  return m.sort((a, b) => b.length - a.length)[0];
}, 'LAT_word       ');

// 英文：跨词查询
const latX = evalRecall(l => {
  const m = String(l.content || '').toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) || [];
  if (m.length < 2) return null;
  return m[0] + ' ' + m[1];
}, 'LAT_cross_term ');

console.log('CJK_cross misses =', JSON.stringify(cjkX.misses.slice(0, 6)));
console.log('LAT_cross misses =', JSON.stringify(latX.misses.slice(0, 6)));
