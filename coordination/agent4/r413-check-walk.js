// 核对 run-all 收集逻辑与磁盘一致性
'use strict';
const fs = require('fs');
const path = require('path');
function collect(d) {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === 'archive') continue;
      out.push(...collect(f));
    } else if (e.name.endsWith('.test.js') && e.name !== 'run-all.test.js') {
      out.push(path.relative(d, f).split(path.sep).join('/'));
    }
  }
  return out.sort();
}
const files = collect('test');
console.log('磁盘测试文件数:', files.length);
console.log('含 round-413-special-pleading-same-label.test.js:', files.includes('round-413-special-pleading-same-label.test.js'));
console.log('含 round-412-etymological-inference-norm.test.js:', files.includes('round-412-etymological-inference-norm.test.js'));
console.log('含 round-411-diff-ack-negation.test.js:', files.includes('round-411-diff-ack-negation.test.js'));
