/** r599：对比 heartflow_lesson_search 与 heartflow_lesson_bank 两条腿的实测行为 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { lessonRetrieval } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { LessonBankAdapter } = require(path.join(ROOT, 'src/cortex/lesson-bank-adapter.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));

if (typeof lessonRetrieval._ensureLoaded === 'function') lessonRetrieval._ensureLoaded();
else if (typeof lessonBank.load === 'function') lessonBank.load();

const lb = new LessonBankAdapter(lessonBank);
const probes = ['版本号纪律', 'memory', 'false', '假升级', '心虫', '蒸馏', '升级'];
const rows = [];
for (const q of probes) {
  let a = 0, b = 0, aErr = '', bErr = '';
  try { a = (lessonRetrieval.retrieve(q, 5) || []).length; } catch (e) { aErr = e.message; }
  try { b = ((lb.search(q, { limit: 5 }) || {}).lessons || []).length; } catch (e) { bErr = e.message; }
  rows.push({ q, searchLeg: a, bankLeg: b, aErr, bErr });
}
console.log(JSON.stringify({
  bankTotal: lessonBank.lessons.length,
  rows,
  agree: rows.filter(r => r.searchLeg === r.bankLeg).length + '/' + rows.length,
}, null, 2));
