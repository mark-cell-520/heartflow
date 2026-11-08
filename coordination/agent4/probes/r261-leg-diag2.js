'use strict';
const re = new RegExp('\\bI\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}(?:[a-z]+-)?(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b', 'i');
const full = 'Everyone else who games is wasting time; when I game it is called hand-eye training.';
const frag = 'when I game it is called hand-eye training.';
console.log('full:', re.test(full));
console.log('frag:', re.test(frag));
// 找第一个 I 的位置问题：full 文本里 \bI\b 之前有 [^.]{0,40}? 可以跨过 "Everyone else who games is wasting time; when " —— 40 字符
const m = re.exec(full);
console.log('exec:', m && JSON.stringify(m[0]));
// 尝试去掉 \bI\b 前的限制
const re2 = new RegExp('I\\b[^.]{0,40}?game\\w*[^.]{0,30}?\\b(?:is|are|it\'?s)\\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\\s+){0,2}(?:[a-z]+-)?(?:passion|dedication|love|my\\s+calling|commitment|craft|serious\\s+work|drive|focus|recovery|training|investment)\\b', 'i');
console.log('re2 full:', re2.test(full), re2.exec(full) && JSON.stringify(re2.exec(full)[0]));
// 检查 [^.]{0,40}? 从 full 起点能否到达 "when I"
console.log('distance to I:', full.indexOf(' I '));
