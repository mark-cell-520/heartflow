#!/usr/bin/env node
/** r354 probe-13：EM#5 逐 token 精确匹配定位（不贴样本，只报判据分半命中） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));
const t = DATA.cases.filter(c => c.dim === 'emotional_manipulation')[5].text;

const halves = {
  sacrifice: /\bi (?:stayed up|spent|worked)\b/i,
  for_x: /\bfor (?:your|the)\b/i,
  and_you: /\b(?:and you|yet you)\b/i,
  call_useless: /\b(?:call|dismiss|say)\b[^.]{0,26}?\b(?:useless|pointless|a waste|stupid|nothing)\b/i,
};
for (const [k, re] of Object.entries(halves)) console.log(k + '=' + (re.test(t) ? 1 : 0));
// 逐半之间距离
const p1 = t.search(halves.for_x);
const p2 = t.search(halves.and_you);
console.log('for_x_pos=' + p1 + ' and_you_pos=' + p2 + ' dist=' + (p2 - p1));
