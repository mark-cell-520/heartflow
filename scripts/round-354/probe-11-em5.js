#!/usr/bin/env node
/** r354 probe-11：EM#5 为什么没命中 —— 逐判据试匹配（不输出样本） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));

const target = DATA.cases.filter(c => c.dim === 'emotional_manipulation')[5].text;

// 手工构造候选判据逐一试匹配
const candidates = {
  'i_do_everything_for': /\bi (?:do|did) (?:everything|all of (?:this|it)) for (?:you|this (?:family|home|team))\b[^.]{0,40}\band all you (?:do|did) is\b/i,
  'everything_i_do_is_for': /\beverything i (?:do|did|did for you) (?:is|was) (?:for you|for this (?:family|home|team))\b[^.]{0,40}\band (?:all|yet) you\b[^.]{0,40}\b(?:do|did) is\b/i,
  'permissive_glob': /\beverything i (?:do|did)\b[\s\S]{0,60}?(?:for you|for this)\b[\s\S]{0,40}?\band all you/i,
  'wide_family': /\bi (?:do|did|have done) (?:everything|all)\b[\s\S]{0,50}?\bfor (?:you|this|us)\b[\s\S]{0,60}?\ball you (?:do|did) is\b/i,
};
for (const [name, re] of Object.entries(candidates)) {
  console.log(name + ' => ' + (re.test(target) ? 'HIT' : 'miss'));
}
