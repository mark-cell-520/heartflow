// r594 探针 v2：验证「中文零命中」根因 = _tokenize 不含 CJK 切分
// 只报数字与根因，不贴样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();

const t = lr._tokenize('版本号纪律 memory');
console.log(JSON.stringify({
  tokens_versions: lr._tokenize('版本号纪律'),
  tokens_english: lr._tokenize('memory'),
  bankTotal: lessonBank.lessons.length,
  sampleContentKeys: lessonBank.lessons[0] ? Object.keys(lessonBank.lessons[0]) : [],
  cjkRatioInBank: (() => {
    let cjk = 0, tot = 0;
    for (const l of lessonBank.lessons) {
      const s = (l.content || '');
      for (const ch of s) { tot++; if (/[\u4e00-\u9fff]/.test(ch)) cjk++; }
    }
    return tot ? +(cjk / tot).toFixed(3) : 0;
  })(),
  // 单字命中测试：如果整串零命中但单字命中，说明就是切分问题
  singleCharHits: '版本号纪律'.split('').map(ch => ({ ch, n: lr.retrieve(ch, 3).length })),
}, null, 2));
