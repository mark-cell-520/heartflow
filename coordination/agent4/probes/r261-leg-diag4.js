'use strict';
const frag = 'when I game it is called hand-eye training.';
const P2 = '\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}';
const m2 = new RegExp(P2, 'i').exec(frag);
console.log('P2 match:', JSON.stringify(m2 && m2[0]), 'endIndex:', m2 && m2.index + m2[0].length);
const P5 = P2 + '(?:[a-z]+-)?(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b';
const m5 = new RegExp(P5, 'i').exec(frag);
console.log('P5 match:', JSON.stringify(m5 && m5[0]));
// 单独测尾部
const tail = '(?:[a-z]+-)?(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b';
console.log('tail on "hand-eye training.":', new RegExp(tail, 'i').test('hand-eye training.'));
console.log('tail on "training.":', new RegExp(tail, 'i').test('training.'));
// {0,2} 是不是把 called 之后的也吃了？
const m2b = new RegExp(P2 + '(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}', 'i').exec(frag);
console.log('P2b:', JSON.stringify(m2b && m2b[0]));
