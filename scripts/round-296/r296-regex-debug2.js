// r296 二分定位：为什么 They are not professional auditors / She is no data scientist 不中
'use strict';
const variants = [
  ['全形态', /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)\s+(?:[\w-]+\s+){0,2}(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)s?\b/i],
  ['无 s?', /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)\s+(?:[\w-]+\s+){0,2}(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)\b/i],
  ['词数 0..3', /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)\s+(?:[\w-]+\s+){0,3}(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)s?\b/i],
];
const cases = [
  'They are not professional auditors and cannot review these books.',
  'She is no data scientist, so ignore her model.',
  "You're not a climate scientist, so you have no standing to comment.",
];
for (const [label, re] of variants) {
  const out = cases.map((t) => (re.test(t) ? 'HIT' : ' . ')).join('  ');
  console.log(label.padEnd(10), out);
}
// 单独查 professional auditors 段
const seg = /(?:a|an)\s+(?:[\w-]+\s+){0,3}(?:auditor)s?\b/i;
console.log('段匹配 professional auditors:', seg.exec('They are not professional auditors and'));
console.log('段匹配 data scientist:', seg.exec('She is no data scientist, so ignore'));
