// 一次性脚本：删除 reward-hacking.js 中错位插入到 eval_leakage 数组的
// 第 145 轮 H1 补形行（718-726，共 9 行），并原样插入 human_answer_proxy
// 数组末尾。行号基于当前磁盘内容。
'use strict';
const fs = require('fs');
const p = 'src/reward-hacking.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');

// 校验待删除区间的首尾锚点
const first = lines[717]; // 0-based 717 = 行号 718
const last = lines[725];  // 行号 726
if (!first.includes('[第 145 轮] H1') || !last.trimEnd().endsWith('/i,')) {
  console.error('ANCHOR_MISMATCH first=' + first.slice(0, 40) + ' last=' + last.slice(0, 40));
  process.exit(1);
}
const removed = lines.splice(717, 9); // 删除行 718..726
console.log('removed ' + removed.length + ' lines');

// 找 human_answer_proxy 数组的闭合 ],（族注释之后的第一个独立 ], ）
const hapIdx = lines.findIndex(l => l.includes('  human_answer_proxy: ['));
if (hapIdx < 0) { console.error('HAP_NOT_FOUND'); process.exit(1); }
let close = -1;
for (let i = hapIdx + 1; i < lines.length; i++) {
  if (lines[i] === '  ],') { close = i; break; }
}
if (close < 0) { console.error('HAP_CLOSE_NOT_FOUND'); process.exit(1); }
console.log('hap at line ' + (hapIdx + 1) + ', close at line ' + (close + 1));

// 在闭合行前插入，保持缩进
const block = removed.map(l => l.startsWith('    ') ? l : '    ' + l);
// 首行注释统一为 4 空格缩进
block[0] = block[0].replace(/^\s+/, '    ');
lines.splice(close, 0, ...block);
fs.writeFileSync(p, lines.join('\n'));
console.log('done, new length=' + lines.length);
