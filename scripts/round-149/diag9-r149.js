// 更窄切片
const t = [
  ['t1', /\bkeep\w*\s+(?:report\w*|using|on)\s+(?:the\s+)?(?:old|original|previous)\s+(?:one|metric|numbers?|score|scale)/i, 'kept reporting the old one'],
  ['t2', /(?:keep\w*|continu\w+|report\w*)\s+(?:report\w*|using|on)\s+(?:the\s+)?(?:old|original|previous)\s+(?:one|metric|numbers?|score|scale)/i, 'kept reporting the old one'],
  ['t3', /(?:keep\w*|continu\w+|report\w*)\s+(?:report\w*|using|on)/i, 'kept reporting'],
  ['t4', /(?:keep\w*)\s+(?:report\w*)/i, 'kept reporting'],
  ['t5', /keep\w*\s+report\w*/i, 'kept reporting'],
];
for (const [k, re, s] of t) console.log(k, re.test(s) ? 'HIT' : 'miss', '|', re.source);
