/** r599：确认 LessonBankAdapter.search 的返回形状与真实命中能力 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { LessonBankAdapter } = require(path.join(ROOT, 'src/cortex/lesson-bank-adapter.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();

const lb = new LessonBankAdapter(lessonBank);
console.log('lessonBank.query 可用:', typeof lessonBank.query === 'function');
console.log('lessonBank.total:', lessonBank.lessons ? lessonBank.lessons.length : 'n/a');
console.log('adapter._enrichedIndex 长度:', lb._enrichedIndex.length);

const probes = ['心虫', '升级', '版本号', '记忆', 'user requirement', 'level'];
for (const q of probes) {
  const r = lb.search(q, { limit: 5 });
  const isArr = Array.isArray(r);
  const n = isArr ? r.length : ((r || {}).lessons || []).length;
  // 单独测各条腿
  const native = (typeof lessonBank.query === 'function' && lessonBank.query(q)) || [];
  let enr = 0;
  try {
    const kw = String(q || '').toLowerCase();
    enr = lb._enrichedIndex.filter(it =>
      `${it.content || ''} ${it.context || ''} ${(it.tags || []).join(' ')}`.toLowerCase().includes(kw)).length;
  } catch (e) { enr = 'ERR ' + e.message; }
  console.log(JSON.stringify({ q, retType: isArr ? 'array' : typeof r, total: n, nativeLeg: native.length, enrichedLeg: enr }));
}
