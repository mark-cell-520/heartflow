// r595 复测：用 bank 内真实出现的中文词/英文词做查询，判断 retrieve 是真死还是 probe 查询词选错
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();

const lessons = lessonBank.lessons;
console.log('bank total =', lessons.length);

// 取前若干条 lesson，用其内容里的真实子串做查询
function cjkWords(s) {
  // 抽取中文连续片段
  const m = String(s || '').match(/[\u4e00-\u9fff]{2,}/g) || [];
  return m;
}
function latinWords(s) {
  return String(s || '').toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) || [];
}

const cjkProbes = [];
const latProbes = [];
for (const l of lessons.slice(0, 40)) {
  for (const w of cjkWords(l.content).slice(0, 2)) cjkProbes.push(w.slice(0, 12));
  for (const w of latinWords(l.content).slice(0, 2)) latProbes.push(w);
}
// 去重
const uniq = a => [...new Set(a)].slice(0, 20);

const cjkRes = uniq(cjkProbes).map(p => ({ p, n: lr.retrieve(p, 5).length }));
const latRes = uniq(latProbes).map(p => ({ p, n: lr.retrieve(p, 5).length }));

console.log('CJK_PROBES total=', cjkRes.length, 'hit(>0)=', cjkRes.filter(r => r.n > 0).length);
console.log('LAT_PROBES total=', latRes.length, 'hit(>0)=', latRes.filter(r => r.n > 0).length);
console.log('CJK top10=', JSON.stringify(cjkRes.slice(0, 10)));
console.log('LAT top10=', JSON.stringify(latRes.slice(0, 10)));

// 英文路径基线：拿一条 lesson 的完整内容做查询（应高相关）
if (lessons.length) {
  const c = lessons[0].content || '';
  console.log('SELF_QUERY_len=', c.length, 'hits=', lr.retrieve(c, 5).length);
}
