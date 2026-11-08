// r260 腿级诊断：对 MISS 样本逐腿打印匹配情况
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const I = require(path.join(ROOT, 'src', 'omission-bias.js')).__internals();

function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push(m[0] + '@' + m.index);
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}
function legReport(label, list, text) {
  const found = [];
  for (const re of list) for (const m of allMatches(re, text)) found.push(m);
  console.log('  ' + label + ': ' + (found.length ? found.join(' | ') : '(无)'));
}
function exemptions(text) {
  const flags = [];
  if (I.CONCEPT_ZH.test(text) || I.CONCEPT_EN.test(text)) flags.push('CONCEPT');
  if ((I.LEGAL_ZH.test(text) && I.LEGAL_ACT_ZH.test(text)) || (I.LEGAL_EN.test(text) && I.LEGAL_ACT_EN.test(text))) flags.push('LEGAL');
  if (I.DUAL_ZH.test(text) || I.DUAL_EN.test(text)) flags.push('DUAL');
  if (flags.length) console.log('  !! 豁免命中: ' + flags.join(','));
}

const MISSES = [
  ['ZH', '见死不救总比亲手杀人轻。'],
  ['ZH', '保持中立没有错，错的是那些行动的人。'],
  ['ZH', '他只是视而不见，不应该被追责。'],
  ['ZH', '虽然造成了损失，但相比主动破坏，我们这顶多算是旁观。'],
  ['EN', 'He did not do anything, so how can you blame him?'],
  ['EN', 'Letting someone die is not as bad as killing them yourself.'],
  ['EN', 'At least we did not actively harm anyone.'],
  ['EN', 'We knew about the problem but we did not lift a finger.'],
  ['EN', 'Not acting is not the same as doing harm.'],
  ['EN', 'We just stood by and watched it happen.'],
  ['EN', 'They failed to report the incident, but the responsibility is not theirs.'],
  ['EN', 'After all, we did not interfere in their affairs.'],
  ['EN', 'Doing nothing cannot be held against us.'],
  ['EN', 'They neglected to act, but at least they did not make it worse.'],
];
for (const [lang, t] of MISSES) {
  console.log('[' + lang + '] ' + t);
  if (lang === 'ZH') {
    legReport('OMIT_ZH', I.OMIT_ZH, t);
    legReport('EXCULP_ZH', I.EXCULP_ZH, t);
  } else {
    legReport('OMIT_EN', I.OMIT_EN, t);
    legReport('EXCULP_EN', I.EXCULP_EN, t);
  }
  exemptions(t);
}
