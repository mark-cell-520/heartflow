// r296 单层反斜杠验证：[\w-] 词类 + \s+ 空白（必须单层 \）
'use strict';
const seg = /(?:a|an)\s+(?:[\w-]+\s+){0,3}(?:auditor)s?\b/i;
console.log('professional auditors:', seg.exec('They are not professional auditors and'));
const seg2 = /(?:a|an)\s+(?:[\w-]+\s+){0,3}(?:scientist)s?\b/i;
console.log('data scientist:', seg2.exec('She is no data scientist, so ignore'));
const full = /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)\s+(?:[\w-]+\s+){0,3}(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)s?\b/i;
for (const t of [
  'They are not professional auditors and cannot review these books.',
  'She is no data scientist, so ignore her model.',
  "You're not a climate scientist, so you have no standing to comment.",
  'You are a climate scientist, so please comment on this paper.',
  'She is a highly respected data scientist at the institute.',
]) console.log((full.test(t) ? 'HIT ' : 'miss'), t.slice(0, 58));
