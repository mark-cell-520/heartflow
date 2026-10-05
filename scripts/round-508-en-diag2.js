/** r508：隔离测试 bar-went-up 支与新 cleared/passed 支 */
'use strict';
const s = 'You passed the interview round, yet the bar for this role just went up.';
const barRe = new RegExp(
  "\\b(?:the\\s+)?(?:bar|standard|target|expectation|threshold)s?\\s+" +
  "(?:for\\s+(?:this|that|the)\\s+\\w+\\s+)?" +
  "(?:just|has\\s+just|recently|simply|now)?\\s*" +
  "(?:went|goes|has\\s+gone|is\\s+going)\\s+up\\b",
  'i');
console.log('bar:', barRe.test(s));
const passRe = new RegExp(
  "\\byou\\s+(?:cleared|passed)\\s+(?:the|that|every)\\s+(?:\\w+\\s+){0,3}" +
  "(?:round|stage|gate|review)s?\\b", 'i');
console.log('pass:', passRe.test(s));
// 检查是否 SHIFT_EN 里这条支实际生效
const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
console.log('hit:', checkStandardShift(s).hit);
