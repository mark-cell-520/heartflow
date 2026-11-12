// r296 正则调试：逐条验证候选正则（避免 shell/node -e 转义干扰）
'use strict';
const cases = [
  "You're not a climate scientist, so you have no standing to comment on this paper.",
  'He is not an industry expert, so his review carries no weight.',
  'They are not professional auditors and cannot review these books.',
  'She is no data scientist, so ignore her model.',
  'Outsiders like him should not lecture us on how this industry works.',
  'He lacks the expertise to evaluate this clinical trial design.',
  'She has no expertise to judge the methodology.',
];

// 候选 1：复合职业名身份否定（放宽主语连接）
const C1 = /\b(?:you'?re|you\s+are|he'?s|he\s+is|she'?s|she\s+is|they'?re|they\s+are|we'?re|we\s+are)\s+(?:not|no)\s+(?:a|an)\s+[\w-]{1,24}\s+(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)\b/i;
// 候选 1b：主语可省（Not a scientist himself, he cannot comment）
const C1b = /\b(?:not|no)\s+(?:a|an)\s+[\w-]{1,24}\s+(?:scientist|researcher|analyst|expert|specialist|economist|statistician|engineer|doctor|lawyer|academic|scholar|practitioner|professional|historian|journalist|clinician|auditor|manager|founder)\s+(?:himself|herself|themselves|yourself)/i;
// 候选 2：outsider 复数
const C2 = /\boutsiders?\b/i;
// 候选 3：lack(s)/has no <资格名词>
const C3 = /\b(?:lacks?|lacking|has\s+no|have\s+no|without)\s+(?:any\s+|the\s+|enough\s+)?(?:expertise|experience|standing|qualification[s]?|authority|credibility|training|background)\b/i;

console.log('case                                                     | C1  C1b C2  C3');
for (const t of cases) {
  console.log(
    t.slice(0, 58).padEnd(58), '|',
    (C1.test(t) ? 'HIT' : ' . '), ' ',
    (C1b.test(t) ? 'HIT' : ' . '), ' ',
    (C2.test(t) ? 'HIT' : ' . '), ' ',
    (C3.test(t) ? 'HIT' : ' . ')
  );
}
