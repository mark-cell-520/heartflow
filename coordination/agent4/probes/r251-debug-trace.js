const path = require('path');
const src = require('fs').readFileSync('/data/home/heartflow/src/loss-aversion.js', 'utf8');
// 重新实现内部收集逻辑的可见版本：直接 require 后借用 __internals，并复刻 matchAlive
const m = require('/data/home/heartflow/src/loss-aversion.js');
const I = m.__internals();

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function allMatches(re, text) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let x;
  while ((x = g.exec(text)) !== null) { out.push({ idx: x.index, end: x.index + x[0].length, raw: x[0] }); if (x.index === g.lastIndex) g.lastIndex++; }
  return out;
}
function alive(text, x, skipInside) {
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return 'NEG_INSIDE';
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const abab = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!abab && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return 'NEG_PREFIX_ZH';
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (NEG_BEFORE_EN.test(beforeEn)) return 'NEG_PREFIX_EN';
  return null;
}
function show(text, key, skipInside) {
  const out = [];
  for (const re of I[key]) for (const x of allMatches(re, text)) {
    const why = alive(text, x, skipInside);
    out.push((why ? 'DEAD[' + why + ']' : 'ALIVE') + ' ' + x.idx + '..' + x.end + ' :: ' + x.raw);
  }
  if (out.length) console.log('  ' + key + (skipInside ? '(skipInside)' : '') + ':'); out.forEach(l => console.log('    ' + l));
}

const text = process.argv[2];
console.log('TEXT: ' + text);
console.log('CONCEPT_ZH: ' + (I.CONCEPT_ZH.test(text) ? 'HIT' : '-') + '  CONCEPT_EN: ' + (I.CONCEPT_EN.test(text) ? 'HIT' : '-'));
console.log('CORRECTIVE_ZH: ' + (I.CORRECTIVE_ZH.test(text) ? 'HIT' : '-') + '  CORRECTIVE_EN: ' + (I.CORRECTIVE_EN.test(text) ? 'HIT' : '-'));
if (I.CONCEPT_ZH.test(text) || I.CONCEPT_EN.test(text) || I.CORRECTIVE_ZH.test(text) || I.CORRECTIVE_EN.test(text)) { console.log('=> EXEMPTED'); process.exit(0); }
show(text, 'ASYM_CMP_ZH', false); show(text, 'ASYM_OUTWEIGH_ZH', false); show(text, 'ASYM_COMPENSATE_ZH', false);
show(text, 'ASYM_ASYMMETRY_ZH', false); show(text, 'ASYM_MULTIPLE_ZH', false); show(text, 'ASYM_EN', false);
show(text, 'AVOID_RATHER_ZH', true); show(text, 'AVOID_CAPITAL_ZH', true); show(text, 'AVOID_REFUSE_ZH', true);
show(text, 'AVOID_EMOTION_ZH', true); show(text, 'AVOID_LOCKIN_ZH', true); show(text, 'AVOID_POSITIVE_EV_ZH', true);
show(text, 'AVOID_POS_EV_ZH', true); show(text, 'AVOID_POS_EV_EN', true); show(text, 'AVOID_EN', true);
show(text, 'SOLO_ZH', true); show(text, 'SOLO_EN', true);
console.log('=> detect: ' + JSON.stringify(m.detectLossAversion(text).details || 'NO HIT'));
