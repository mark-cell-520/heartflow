// r595 最小复现 prioritySort NaN
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const lr = new LessonRetrievalEngine();
lr._ensureLoaded();
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));

const WEEK = 7 * 24 * 3600 * 1000;
const now = Date.now();
function diag(l) {
  const base = l.importance * Math.log((l.frequency || 1) + 1);
  const ls = l.lastSeen || l.createdAt || now;
  const age = Math.min(1, (now - ls) / WEEK);
  const t = age * WEEK;
  const decay = require(path.join(ROOT, 'src/formula/formula-safe.js')).getFormulaSafe().ebbinghausRetention(t, WEEK, () => Math.exp(-age * 2));
  return { base, age: Number(age.toFixed(4)), decay: Number(decay.toFixed(4)), score: base * (0.6 + 0.4 * decay), imp: l.importance, f: l.frequency };
}

const target = lessonBank.lessons[11];
console.log('target diag =', JSON.stringify(diag(target)));
console.log('target.base NaN?', Number.isNaN(diag(target).base));

// 全库统计 base NaN 数
let nan = 0;
for (const l of lessonBank.lessons) if (Number.isNaN(diag(l).score)) nan++;
console.log('NaN score lessons =', nan, 'of', lessonBank.lessons.length);

// 真实跑一次 sort 看比较器返回
const arr = lessonBank.lessons.slice(0, 6);
const week = WEEK;
let nanCmp = 0;
[...arr].sort((a, b) => {
  const ba = a.importance * Math.log((a.frequency || 1) + 1);
  const bb = b.importance * Math.log((b.frequency || 1) + 1);
  const la = Math.min(1, (Date.now() - (a.lastSeen || a.createdAt || Date.now())) / week);
  const lb = Math.min(1, (Date.now() - (b.lastSeen || b.createdAt || Date.now())) / week);
  const da = require(path.join(ROOT, 'src/formula/formula-safe.js')).getFormulaSafe().ebbinghausRetention(la * week, week, () => Math.exp(-la * 2));
  const db = require(path.join(ROOT, 'src/formula/formula-safe.js')).getFormulaSafe().ebbinghausRetention(lb * week, week, () => Math.exp(-lb * 2));
  const d = (bb * (0.6 + 0.4 * db)) - (ba * (0.6 + 0.4 * da));
  if (Number.isNaN(d)) nanCmp++;
  return d;
});
console.log('NaN comparator returns in 6-lesson sort =', nanCmp);
console.log('sample importance/frequency types =', JSON.stringify({ imp: typeof target.importance, f: typeof target.frequency }));
