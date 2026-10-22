// r594 探针 v4：验证 _computeIDF 的 df/idf 是否全为 0（疑似死链路）
// 只报数字与根因，不贴样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();

const q = '版本号纪律';
const idf = lr._computeIDF(q);
const terms = lr._tokenize(q);
const out = {};
for (const t of terms) out[t] = { df: idf.get(t), type: typeof idf.get(t) };

// 手工重算 df：term 在几条 lesson 的 content/context 里出现
const manual = terms.map(t => ({
  t,
  df_by_substring: lessonBank.lessons.filter(l => ((l.content||'') + (l.context||'')).includes(t)).length,
}));

console.log(JSON.stringify({
  terms,
  idfEntries: out,
  idfMapSize: idf.size,
  manualDf: manual,
  bankLen: lessonBank.lessons.length,
}, null, 2));
