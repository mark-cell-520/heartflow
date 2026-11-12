// r297 探针 5：d5 腿正则隔离验证（write_file 避开 shell 转义）。
const RE = /\b(?:your|our|their|his|her|the)\s+(?:conclusion[s]?|argument[s]?|claim[s]?|opinion[s]?|view[s]?|analysis|reasoning|logic|numbers?|statistics?|data|findings?|work|paper|report|theory|model)\s+(?:is|are)\s+(?:worthless|useless|garbage|junk|nonsense|meaningless|pointless|invalid|irrelevant|ridiculous|laughable)\b/i;

const cases = [
  'Your conclusions are worthless.',
  'Your conclusion is worthless.',
  'Your opinion is worthless.',
  'so your opinion on this is worthless.',
  'Our findings are garbage and should be dismissed.',
  'Your view is nonsense.',
  'Their argument is invalid.',
];
for (const c of cases) console.log((RE.test(c) ? 'Y' : '-') + '  ' + c);

// 再验证带中间修饰的形态
const RE2 = /\b(?:your|our|their|his|her|the)\s+(?:conclusion[s]?|opinion[s]?|view[s]?|analysis|argument[s]?|claim[s]?|findings?)\s+(?:\w+\s+){0,2}(?:is|are)\s+(?:worthless|garbage|nonsense|invalid|irrelevant)\b/i;
console.log('--- RE2 (允许中间修饰) ---');
for (const c of ['your opinion on this is worthless', 'your analysis of the data is garbage', 'your conclusions are worthless']) {
  console.log((RE2.test(c) ? 'Y' : '-') + '  ' + c);
}
