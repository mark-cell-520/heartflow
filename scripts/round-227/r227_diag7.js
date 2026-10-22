'use strict';
// 用模块自身运行时行为诊断（不 eval 源码）：通过 checkAppealToAuthority 逐条二分
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
const cases = [
  'Trust me, I am the expert here.',
  'Because I said so, that is final.',
  'My authority on this is final.',
  'The manager already approved it.',
  'I have the rank to decide this.',
  '听我的，我是这方面的专家。',
  '作为负责人，这件事我定了，照办就行。',
];
for (const t of cases) {
  const r = idx.checkAppealToAuthority(t);
  const types = (r.signals || []).map(s => s.type);
  console.log('count=' + r.count + ' score=' + r.score.toFixed(2) + ' types=' + types.join(','));
}
