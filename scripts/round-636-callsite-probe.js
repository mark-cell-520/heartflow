// r636 调用点探针：确认候选实例是否在 pipeline 内被真正调用（而非仅 dispatch 不可达）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const list = process.argv.slice(2);
for (const k of list) {
  const pats = ['\\.' + k + '\\.', 'this\\.' + k, 'engine\\.' + k, 'hf\\.' + k, '==' + k, '\\[' + k + '\\]'];
  console.log('=== ' + k);
  for (const p of pats) {
    try {
      const g = execSync(`grep -rn --include=*.js -E "${p}" src/ | grep -v "core/heartflow.js" | grep -v "core/engine-constructor.js" | head -8`, { cwd: ROOT }).toString().trim();
      if (g) console.log('  [' + p + '] ' + g.split('\n').map(s => s.split(':').slice(0, 2).join(':')).join(' | '));
    } catch (e) { /* 无匹配 grep 返回 1 */ }
  }
}
