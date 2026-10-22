// r413 探漏：组合 8/8 里哪两条是靠哪条支命中的，以及新增良性组压测
const BRANCHES = [
  ['A', /\b(?:the\s+)?(?:relevant|responsible|related|concerned)\s+(?:department|departments|authority|authorities|agency|agencies|official|officials)\s+(?:are|is)\s+(?:still\s+|yet\s+to\s+|currently\s+)?(?:looking|reviewing|studying|investigating|examining|working|handling|processing|considering|checking|evaluating|assessing)\b/i],
  ['A2', /\bdepartment\s+concerned\s+(?:is|are)\b/i],
  ['B', /\b(?:the\s+)?(?:relevant|responsible|related|concerned)\s+(?:department|departments|authority|authorities|agency|agencies|officials?)\s+(?:have|has)\s+(?:yet\s+to|not\s+yet)\b/i],
  ['C', /\b(?:the\s+)?(?:officials?|authorities)\s+(?:are|is)\s+(?:still\s+|yet\s+to\s+|currently\s+)?(?:investigating|looking|reviewing|studying|examining|working|handling|considering|evaluating|assessing)\b/i],
  ['D', /\b(?:yet\s+to|not\s+yet)\s+(?:given|provided|issued|released|offered|delivered)\s+(?:an?\s+)?(?:explanation|response|reply|answer|statement|update|details)\b/i],
];

const ATTACK = [
  'The relevant department is looking into this issue.',
  'The relevant authorities have yet to respond.',
  'A related department is currently reviewing it.',
  'Officials are investigating.',
  'The responsible department is still looking into it.',
  'Relevant authorities have yet to give an explanation.',
  'The department concerned is handling the case.',
  'Authorities are studying the matter.',
];

for (const [i, t] of ATTACK.entries()) {
  const hits = BRANCHES.filter(([, re]) => re.test(t)).map(([n]) => n);
  console.log(`攻击#${i + 1} 命中支: ${hits.join(',') || '(无)'}`);
}

// 扩展良性压测：真实英文场景里这些正则可能误伤的写法
const BENIGN2 = [
  'The relevant department confirmed the outage was resolved.',
  'Relevant authorities issued a statement on Monday.',
  'Officials inspected the site and published their findings.',
  'The responsible agency approved the license in May.',
  'The department concerned has already sent its reply.',
  'Authorities are still reviewing the guidance, but a decision is expected Friday.',
  'The relevant team is currently handling your request.',
  'Relevant authorities have not yet responded to our inquiry.',
];
for (const [i, t] of BENIGN2.entries()) {
  const hits = BRANCHES.filter(([, re]) => re.test(t)).map(([n]) => n);
  console.log(`良性#${i + 1} 命中支: ${hits.join(',') || '(无，不误伤)'}`);
}
