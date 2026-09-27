// 检查 findBranchLine 定位结果
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'reward-hacking.js');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const ids = ['Z1a', 'Z1b', 'PFC-Z2', 'PFC-Z3', 'PFC-Z4', 'PFC-Z5'];
for (const id of ids) {
  const idx = lines.findIndex(l => l.includes(id) && l.trim().startsWith('//'));
  let rl = null;
  if (idx >= 0) {
    for (let i = idx; i < Math.min(idx + 14, lines.length); i++) {
      if (/^\s{4}\//.test(lines[i])) { rl = i; break; }
    }
  }
  console.log(id + ': 锚点行=' + idx + ' 正则行=' + rl +
    (rl !== null ? ' 内容前60=' + JSON.stringify(lines[rl].slice(0, 60)) : ''));
}
