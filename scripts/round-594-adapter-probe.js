// r594 探针 v5：对比 heartflow_lesson_bank (adapter) 是否真能检索
// 只报数字与根因，不贴样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { LessonBankAdapter } = require(path.join(ROOT, 'src/cortex/lesson-bank-adapter.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();

const lb = new LessonBankAdapter({ rootPath: path.join(ROOT, 'data'), silent: true });
console.log(JSON.stringify({
  adapterMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(lb)),
  bankLen: lessonBank.lessons.length,
  probes: ['版本号纪律', 'memory', '纪律', '假升级'].map(q => {
    let r;
    try { r = lb.search ? lb.search(q) : null; } catch (e) { return { q, err: e.message }; }
    return { q, n: Array.isArray(r?.results) ? r.results.length : (Array.isArray(r) ? r.length : null) };
  }),
}, null, 2));
