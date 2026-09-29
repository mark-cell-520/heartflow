// 第 217 轮：把 self-evolution-v2.js 里两处裸 setTimeout sleep 换成 this._sleep()
// 按行号精确定位（patch 空白匹配在本文件连续失败 2 次后换路）
const fs = require('fs');
const FILE = process.argv[2];
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const targets = [
  { line: 96, from: 'await new Promise(r => setTimeout(r, 3000));', to: 'await this._sleep(3000);' },
];

let changed = 0;
for (const t of targets) {
  const i = t.line - 1;
  if (lines[i] && lines[i].includes(t.from)) {
    lines[i] = lines[i].replace(t.from, t.to);
    changed++;
  }
}
fs.writeFileSync(FILE, lines.join('\n'));
console.log(JSON.stringify({ changed, checked: targets.map(t => t.line) }));
