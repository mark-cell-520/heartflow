const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'reward-hacking.js');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const titleRe = new RegExp('^\\s*//.*' + 'EIS-Z6' + '(?:[：:]| )');
const idx = lines.findIndex(l => titleRe.test(l) && l.trim().startsWith('//'));
console.log('idx =', idx);
if (idx >= 0) {
  for (let i = idx; i < Math.min(idx + 20, lines.length); i++) {
    const isRe = /^\s{4}\/(?!\/)/.test(lines[i]);
    console.log(i, isRe ? 'REGEX' : '     ', JSON.stringify(lines[i].slice(0, 60)));
  }
} else {
  // 打印所有含 EIS-Z6 的行
  lines.forEach((l, i) => { if (l.includes('EIS-Z6')) console.log('contains:', i, JSON.stringify(l.slice(0, 70))); });
}
