/** r599：lesson-bank 真实内容抽样 + 按主题实际命中情况 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();
const L = lessonBank.lessons;
console.log('总数:', L.length);
console.log('前 12 条 content 摘要:');
L.slice(0, 12).forEach((l, i) => console.log(`  [${i}] type=${l.type} imp=${l.importance} :: ${String(l.content || '').slice(0, 80)}`));
console.log('\ncontext 非空条数:', L.filter(l => l.context).length);
console.log('trigger 分布:', JSON.stringify(L.reduce((a, l) => { a[l.trigger] = (a[l.trigger] || 0) + 1; return a; }, {})));
// 空 content 检查
console.log('content 为空的条数:', L.filter(l => !l.content || !String(l.content).trim()).length);
