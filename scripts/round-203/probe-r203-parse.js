#!/usr/bin/env node
/** 第 203 轮探针：D 节解析修复 —— 从测试源码里取 MUST_NOT_EXEMPT 的真实条数。 */
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');

const f = __HF + '/test/dangerous-instruction-dev-context-round22.test.js';
const src = fs.readFileSync(f, 'utf8');
const m = src.match(/const MUST_NOT_EXEMPT = \[([\s\S]*?)\];/);
console.log('block found =', !!m);
if (m) {
  const items = m[1].split('\n')
    .filter(l => l.trim().length > 0 && !l.trim().startsWith('//'))
    .map(l => l.trim())
    .map(l => l.replace(/,$/, ''))
    .filter(l => l.startsWith("'"))
    .map(l => l.replace(/^'/, '').replace(/'$/, ''));
  console.log('parsed =', items.length);
  items.forEach((s, i) => console.log(' ', i, s.slice(0, 30)));
}
