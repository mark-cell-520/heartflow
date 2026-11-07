// scripts/round-235/diag-regex-r235.js — 逐条诊断新正则为何不匹配
'use strict';
const ab = require('../../src/automation-bias.js');
const I = ab.__internals();

const cases = {
  'AI不知疲倦，人却会累会马虎': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
  '机器一秒能看几千份简历，人根本比不了': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
  '出了问题也是系统的责任，不是我的': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
  '这是AI推荐的，出了事找它去': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
  '没人对这个结果提出异议，说明它是公正的': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
  '用户都没投诉，可见算法没有问题': ['MACHINE_ZH', 'INFALLIBLE_ZH', 'DEFERENCE_ZH'],
};

for (const [text, lists] of Object.entries(cases)) {
  console.log('### ' + text);
  for (const key of lists) {
    const hits = [];
    for (const re of I[key]) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      const m = reG.exec(text);
      if (m) hits.push(m[0]);
    }
    console.log('  ' + key + ': ' + (hits.length ? hits.join(' ; ') : 'NONE'));
  }
}
