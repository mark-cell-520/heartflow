#!/usr/bin/env node
/** r354 probe-10：EM #5 与 tone #2 的精确形状（不输出样本，只报分层） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));

const cases = DATA.cases;
const em = cases.filter(c => c.dim === 'emotional_manipulation')[5];
const tp = cases.filter(c => c.dim === 'tone_policing')[2];

// 分层标志（只判断布尔，不输出文本）
function report(tag, text, groups) {
  const flags = {};
  for (const [name, re] of Object.entries(groups)) flags[name] = re.test(text) ? 1 : 0;
  console.log(tag + ' ' + JSON.stringify(flags));
}
report('EM#5', em.text, {
  first_person_sacrifice: /\bi (?:do|did) everything\b/i,
  for_you: /\bfor you\b|\bfor this\b/i,
  all_you_do: /\ball you (?:do|did)\b/i,
});
report('TP#2', tp.text, {
  calm: /\b(?:be|stay|remain)\s+(?:calm|rational|objective)\b/i,
  otherwise: /\b(?:otherwise|or else)\b/i,
  nobody: /\b(?:nobody|no one)\b/i,
  hear: /\b(?:hear|listen)\b/i,
});
