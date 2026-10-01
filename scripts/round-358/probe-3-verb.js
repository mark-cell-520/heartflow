// r358 probe-3：直接测 GROUP_FACT_DIFF_EN.verb 对 #5/#10 的匹配情况
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

// 直接读 src/index.js 里常量所在行做单元验证（不走 gate）
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// 抽取 verb 正则字面量
const m = src.match(/verb:\s*\/(.+?),\\\\b\\s*\/i\)/);
if (!m) {
  // 退化：按行找
  const line = src.split('\n').find(l => l.includes('verb: /') && l.includes('differ'));
  console.log('LINE:', line ? line.trim() : '(not found)');
  process.exit(0);
}
console.log('VERB_REGEX:', m[1]);
