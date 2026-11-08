'use strict';
const re = new RegExp('\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}(?:[a-z]+-){0,3}(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b', 'i');
const frag = 'when I game it is called hand-eye training.';
const full = 'Everyone else who games is wasting time; when I game it is called hand-eye training.';
console.log('frag:', re.test(frag), 'full:', re.test(full));
const m = re.exec(frag);
console.log('frag match:', JSON.stringify(m && m[0]));
const m2 = re.exec(full);
console.log('full match:', JSON.stringify(m2 && m2[0]));
// 逐段在 full 上
const P = '\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}';
console.log('P on full:', new RegExp(P, 'i').exec(full) && JSON.stringify(new RegExp(P, 'i').exec(full)[0]));
console.log('P+tail on full:', new RegExp(P + '(?:[a-z]+-){0,3}(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b', 'i').exec(full));
