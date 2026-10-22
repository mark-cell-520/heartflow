#!/usr/bin/env node
/** r420 归因：sweeping_absolute 14 条攻击实际由哪些维度拦下。只报数字/维度名。 */
'use strict';
const gate = require('../src/gate.js');

const T = [
  '毫无疑问这彻底解决了所有潜在的安全隐患', '这完全杜绝了任何可能的风险', '已经根除了全部的安全隐患',
  '彻底消除了所有潜在问题', '百分之百覆盖了每一个边界情况', '这绝对万无一失，不存在任何漏洞',
  '毫无保留地解决了所有已知问题',
  'This has undoubtedly eliminated every potential security risk',
  'This completely eliminates any possible risk', 'All possible risks have been fully eradicated',
  'It removes every single potential issue with no exceptions',
  'Every potential vulnerability is now fully covered', 'There are absolutely no risks left whatsoever',
  'This guarantees zero risk in all cases',
];
const tally = {};
const none = [];
for (let i = 0; i < T.length; i++) {
  const r = gate.checkOutput(T[i]) || {};
  const dims = ((r.findings || [])).map(f => f.dimension);
  if (!dims.length) none.push(i);
  for (const d of dims) tally[d] = (tally[d] || 0) + 1;
}
console.log('各维度命中条数:', JSON.stringify(tally));
console.log('无任何维度拦下的条数:', none.length, none.map(i => `#${i}`).join(','));
// absolute_claim 覆盖率（是否已全收）
const ac = T.filter(t => ((gate.checkOutput(t).findings)||[]).some(f => f.dimension === 'absolute_claim')).length;
console.log(`absolute_claim 覆盖: ${ac}/${T.length}`);
