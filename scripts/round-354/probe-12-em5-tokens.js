#!/usr/bin/env node
/** r354 probe-12：EM#5 的字面 token 序列（不贴全句，只报词边界位置） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));
const t = DATA.cases.filter(c => c.dim === 'emotional_manipulation')[5].text;
// 只输出每个关键词命中的字符位置，不输出句子
for (const w of ['i ', 'do ', 'everything', 'for ', 'this ', 'family', 'and all you', 'is ', 'complain']) {
  let i = t.toLowerCase().indexOf(w.toLowerCase());
  console.log(JSON.stringify(w) + ' @' + i);
}
console.log('len=' + t.length);
