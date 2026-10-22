// r595 有效指标：跨主题区分度（不同查询 top1 内容是否不同）
// 说明：bank 里 159 条是同族副本（字段全同），recall@5 无度量意义。
// 有意义的指标是「检索器能否按查询内容返回不同主题的教训」。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();
const lessons = lessonBank.lessons;

// 用 bank 中不同主题的真实词做查询
const probes = [];
const seenTopic = new Set();
for (const l of lessons) {
  const m = String(l.content || '').match(/[a-z][a-z0-9_-]{4,}/g) || [];
  for (const w of m) {
    if (seenTopic.has(w)) continue;
    seenTopic.add(w);
    probes.push(w);
  }
  if (probes.length >= 25) break;
}

const results = probes.map(p => {
  const top = lr.retrieve(p, 3);
  return { p, top1: (top[0] || {}).content ? top[0].content.slice(0, 40) : null, rel: top[0] ? top[0]._relevance : 0, n: top.length };
});

const distinctTop1 = new Set(results.map(r => r.top1)).size;
console.log('probes =', results.length);
console.log('distinct top1 =', distinctTop1);
console.log('queries with 0 results =', results.filter(r => r.n === 0).length);
console.log('results =', JSON.stringify(results.map(r => ({ p: r.p, t: r.top1, rel: Number((r.rel||0).toFixed(3)) })), null, 1));
