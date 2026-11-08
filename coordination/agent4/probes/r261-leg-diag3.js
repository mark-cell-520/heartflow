'use strict';
const frag = 'when I game it is called hand-eye training.';
const P1 = '\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+';
const P2 = P1 + '(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}';
const P3 = P2 + '(?:[a-z]+-)?';
const P4 = P2 + '(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b';
const P5 = P2 + '(?:[a-z]+-)?(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b';
for (const [n, p] of [['P1', P1], ['P2', P2], ['P3', P3], ['P4', P4], ['P5', P5]]) {
  console.log(n, new RegExp(p, 'i').test(frag));
}
// 检查 \w* 是否吞掉后续
console.log('game\\w* on "game it":', /game\w*/.exec('game it')[0]);
// 检查 is 匹配位置
const m = new RegExp(P1, 'i').exec(frag);
console.log('P1 match:', JSON.stringify(m && m[0]));
