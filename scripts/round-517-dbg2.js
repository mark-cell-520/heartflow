'use strict';
const { checkResponsibilityAbsolution } = require('../src/responsibility-absolution.js');
const t = '你不用担心后路，这条线我兜底，你只管往前推。';
console.log(JSON.stringify(checkResponsibilityAbsolution(t)));
const dbg = require('../src/responsibility-absolution.js');
// 手工拆 ABSORB 新支
const b = '(?:这条线|这事|这件事|这事上|这条路)[^。，]{0,6}我(?:来)?(?:兜底|兜着|担着)';
console.log('branch:', new RegExp(b).test(t));
// DISSUADE 支
const d = '(?:签个字|签字就行|直接签字|签了就行|照做|执行就行|直接干|直接照做|尽管做|放开手|往下推|往前走)';
console.log('dissuade:', new RegExp(d).test(t));
