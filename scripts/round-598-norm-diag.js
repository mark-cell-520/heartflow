/** r598：样本 #8 未命中原因定位 —— 检查归一化是否改写了文本 */
'use strict';
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
const tn = require('../src/text-normalizer.js');

const s = '进度已经差不多了，但用新的一套算，你还没完成。';
console.log('原句模块层 hit =', checkStandardShift(s).hit);
const n = tn.normalize(s);
console.log('归一化后:', JSON.stringify(n.normalized));
console.log('归一化后模块层 hit =', checkStandardShift(n.normalized || s).hit);
console.log('含「差不多」位置 =', (n.normalized || s).indexOf('差不多'));
console.log('句首 6 字 =', JSON.stringify((n.normalized || s).slice(0, 8)));

// 直接测试 ACHIEVED_ZH 各支对样本的独立命中
const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/self-imposed-standard-shift.js'), 'utf8');
const mod = require('../src/self-imposed-standard-shift.js');
console.log('--- 手动拆解 ---');
console.log('进度侧:', /(?:进度|工作量|任务|活|活儿|事情)(?:已经)?(?:差不多|基本|大致|快)(?:了|啦)/.test(s));
