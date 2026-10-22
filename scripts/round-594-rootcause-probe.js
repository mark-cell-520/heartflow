// r594 探针 v3：定位零命中的真正根因（不是 tokenize）
// 只报数字与根因，不贴样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();

const L = lessonBank.lessons;
console.log(JSON.stringify({
  bankLen: L.length,
  firstContentLen: L[0] ? (L[0].content || '').length : 0,
  allEmptyContent: L.filter(l => !l.content || !l.content.trim()).length,
  // 直接看 _relevanceScore 对同一 lesson 打几分
  probeScores: L.slice(0, 3).map(l => ({
    id: l.id,
    contentHead: (l.content || '').slice(0, 12),
    scoreForVersionWord: +lr._relevanceScore('版本号', l, lr._computeIDF('版本号')).toFixed(4),
    scoreForMemory: +lr._relevanceScore('memory', l, lr._computeIDF('memory')).toFixed(4),
  })),
  // 查询 'self_learned'（类型词）能否命中
  typeQueryHits: lr.retrieve('self_learned', 5).length,
  // 空查询命中数（判断是不是全被 filter 掉）
  emptyQueryHits: lr.retrieve('', 5).length,
  xyzHits: lr.retrieve('zzzznotexist', 5).length,
}, null, 2));
