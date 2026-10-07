// r586：GUARD_EN 新支分组实测（只报匹配结果）
'use strict';
const s = 'With your experience, you may waive the checklist only with written approval.';
const cands = [
  ['still-remains', '\\b[^.?!]{0,40}\\b(?:still|remains?|remained|stays?|stayed)\\s+(?:mandatory|required|in\\s+force|in\\s+place|unchanged|non[\\s-]?negotiable|binding)\\b'],
  ['only-with', '\\b[^.?!]{0,60}\\b(?:only\\s+(?:with|if)|unless\\s+(?:approved|authori[sz]ed|verified|confirmed))\\b[^.?!]{0,40}\\b(?:approv|authori[sz]|sign[\\s-]?off|verify|confirm|permission)\\b'],
  ['only-with-nob', '[^.?!]{0,60}(?:only\\s+(?:with|if)|unless\\s+(?:approved|authori[sz]ed|verified|confirmed))[^.?!]{0,40}(?:approv|authori[sz]|sign[\\s-]?off|verify|confirm|permission)'],
  ['waive-if', '\\b(?:waive|waiver|exempt|exemption|skip|bypass)\\b[^.?!]{0,60}\\b(?:if|only\\s+if|unless)\\b[^.?!]{0,60}\\b(?:approv|authori[sz]|verify|confirm)\\b'],
  ['only-with-approval-simple', '\\bonly\\s+with\\b[^.?!]{0,40}\\bapprov'],
  ['may-waive-only', '\\b(?:may|can|could)\\s+(?:waive|skip|bypass)\\b[^.?!]{0,40}\\bonly\\s+(?:with|if)\\b'],
];
for (const [name, src] of cands) {
  let r = 'no-match';
  try { r = new RegExp(src, 'i').test(s) ? 'MATCH' : 'no-match'; } catch (e) { r = 'ERR ' + e.message; }
  console.log(name + ' -> ' + r);
}
console.log('len=' + s.length);
const idx = s.toLowerCase().indexOf('only');
console.log('onlyIdx=' + idx + ' apprIdx=' + s.toLowerCase().indexOf('approv') + ' gap=' + (s.toLowerCase().indexOf('approv') - idx));
