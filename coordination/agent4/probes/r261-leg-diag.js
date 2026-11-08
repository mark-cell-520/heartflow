'use strict';
const { __internals } = require('/data/home/heartflow/src/special-pleading.js');
const I = __internals();
const t = 'Everyone else who games is wasting time; when I game it is called hand-eye training.';
const w = 'game';
const src = I.SELF_POS_EN.source;
console.log('FULL SRC:', src);
const re = new RegExp(src.split('%W%').join(w), 'i');
console.log('built:', re.source);
console.log('test:', re.test(t));
// 逐段
const frag = 'when I game it is called hand-eye training.';
console.log('seg1 I:', /\bI\b/i.test(frag));
console.log('seg2 game:', /\bI\b[^.]{0,40}?game\w*/i.test(frag));
console.log('seg3 is:', /\bI\b[^.]{0,40}?game\w*[^.]{0,30}?\b(?:is|are|it'?s)\s+/i.test(frag));
console.log('seg4 called:', /\bI\b[^.]{0,40}?game\w*[^.]{0,30}?\b(?:is|are|it'?s)\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\s+){0,2}/i.test(frag));
console.log('seg5 pos:', /(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\s+){0,2}(?:[a-z]+-)?(?:passion|dedication|love|my\s+calling|commitment|craft|serious\s+work|drive|focus|recovery|training|investment)\b/i.test('called hand-eye training'));
