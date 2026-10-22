/** r598：按源码实际字符序列重放 ACHIEVED_ZH 数量词前置支的变异守卫替换，找出测试里 from 串为何匹配不上 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const orig = fs.readFileSync(path.join(__dirname, '../src/self-imposed-standard-shift.js'), 'utf8');

// 源码里该支的实际两行（含真实反斜杠数量）
const srcLine = /'\|\(\?:你\|你们\)\?\(\?:都\|全\)\?[^\n]*\n  '\(\?:改\|修\|做\|写\|讲\|说\)\(\?:完\|好\)\(\?:了\)\?'/.exec(orig);
console.log('源码实际支文本 =', JSON.stringify(srcLine && srcLine[0]));

// 测试文件里写的 from 串（双反斜杠在 JS 字符串里表示一个字面反斜杠）
const t = fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift.test.js'), 'utf8');
const seg = t.slice(t.indexOf('ACHIEVED_ZH 数量词前置支'));
const fromLit = /const broken = orig\.replace\(\n    ("(?:[^"\\]|\\.)*"),/.exec(seg);
console.log('测试 from 字面量 =', JSON.stringify(fromLit && fromLit[1]));
const fromVal = JSON.parse(fromLit[1]); // 求值为真正的 JS 字符串
console.log('测试 from 求值  =', JSON.stringify(fromVal));
console.log('两者相等?', fromVal === (srcLine && srcLine[0]));
