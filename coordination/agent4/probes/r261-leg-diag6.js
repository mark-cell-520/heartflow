'use strict';
console.log('t1:', /(?:[a-z]+-){0,3}training\b/i.test('hand-eye training.'));
console.log('t2:', /(?:[a-z]+-){0,3}(?:passion|dedication|love|my\s+calling|commitment|craft|serious\s+work|drive|focus|recovery|training|investment)\b/i.test('hand-eye training.'));
console.log('t3:', /(?:[a-z]+-){0,3}/i.exec('hand-eye training.')[0]);
const tail = '(?:[a-z]+-){0,3}(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b';
console.log('t4:', new RegExp(tail, 'i').test('hand-eye training.'));
const P = '\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}';
console.log('t5 P+tail on frag:', new RegExp(P + tail, 'i').test('when I game it is called hand-eye training.'));
// 尾词换成 dedication 对照
console.log('t6 dedication:', new RegExp(P + '(?:passion|dedication|training)\\b', 'i').test('when I game it is called dedication.'));
// 检查 \b 与 training. 
console.log('t7:', /\btraining\b/.test('training.'));
