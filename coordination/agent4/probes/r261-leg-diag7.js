'use strict';
const frag = 'when I game it is called hand-eye training.';
const P = '\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}';
const tests = [
  ['P + hand-eye training literal', P + 'hand-eye\\s+training\\b'],
  ['P + [a-z-]+training', P + '[a-z\\-]+training\\b'],
  ['P + [a-z]+-{0,3}training', P + '[a-z]+(?:-){0,3}training\\b'],
  ['P + (?:[a-z]+-){1}training', P + '(?:[a-z]+-){1}training\\b'],
  ['P + (?:[a-z]+-){0,3}training', P + '(?:[a-z]+-){0,3}training\\b'],
  ['P + .*training', P + '.*training\\b'],
];
for (const [n, p] of tests) console.log(n, new RegExp(p, 'i').test(frag));
// P 的 exec 到底停在哪
const m = new RegExp(P, 'i').exec(frag);
console.log('P exec:', JSON.stringify(m[0]), 'idx', m.index, 'end', m.index + m[0].length, '剩余:', JSON.stringify(frag.slice(m.index + m[0].length)));
