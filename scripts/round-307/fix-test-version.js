// 测试内 VERSION 断言改为 rebase 后主线版本（6.8.176），并记录撞号
'use strict';
const fs = require('fs');
const p = '/data/home/heartflow/test/round-307-sorites-goal-dismissal.test.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  "check('H VERSION 未 bump（6.8.174，零 index.js 改动轮）', () => {\n  const pkg = require('../package.json');\n  assert.strictEqual(pkg.version, '6.8.174');\n});",
  "check('H VERSION 未 bump（6.8.176 主线基线，本轮零 index.js 改动不 bump）', () => {\n  const pkg = require('../package.json');\n  assert.strictEqual(pkg.version, '6.8.176');\n});"
);
s = s.replace('// r305 · sorites_fallacy', '// r307 · sorites_fallacy');
s = s.replace('// 攻击：单元增量对累积量', '// 攻击：单元增量对累积量');
fs.writeFileSync(p, s);
console.log('patched');
