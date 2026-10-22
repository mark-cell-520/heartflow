// r595 终局定位：同分 159 条时 relevanceFirstSort 为何仍不进 top5
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
const target = ks.find(r => r.content === lessons[11].content);
console.log('target _relevance =', target._relevance, 'id =', target.id);

// 手动复现 prioritySort 的 score 计算
const WEEK = 7 * 24 * 3600 * 1000;
const now = Date.now();
function scoreOf(l) {
  const base = l.importance * Math.log((l.frequency || 1) + 1);
  const lastSeen = l.lastSeen || l.createdAt || now;
  const age = Math.min(1, (now - lastSeen) / WEEK);
  const decay = Math.exp(-age * 2);
  return base * (0.6 + 0.4 * decay);
}
const prio = lr.prioritySort(ks);
console.log('prioritySort top8 scores =', JSON.stringify(prio.slice(0, 8).map(l => ({ s: Number(scoreOf(l).toFixed(4)), imp: l.importance, f: l.frequency, isTarget: l.content === lessons[11].content }))));
console.log('target priority rank =', prio.findIndex(l => l.content === lessons[11].content));

// 检查 _formulaSafe.ebbinghausRetention 是否与本地 exp 相同
try {
  const { getFormulaSafe } = require(path.join(ROOT, 'src/formula/formula-safe.js'));
  const fs = getFormulaSafe();
  const age = 0.5;
  console.log('formulaSafe decay@0.5 =', fs.ebbinghausRetention(age * WEEK, WEEK, () => Math.exp(-age * 2)), ' local exp =', Math.exp(-age * 2));
} catch (e) { console.log('fs err', e.message); }

// 检查所有 159 条的 score 分布
const scores = ks.map(l => scoreOf(l));
const uniq = [...new Set(scores.map(s => s.toFixed(6)))];
console.log('unique priority scores among 159 =', uniq.length, JSON.stringify(uniq.slice(0, 5)));
console.log('target score =', scoreOf(target).toFixed(6));

// relevanceFirstSort 内部 prioRank map 的 key 冲突检查
const keys = ks.map(l => l.id || l.content || '');
console.log('key unique =', new Set(keys).size, 'of', keys.length);
