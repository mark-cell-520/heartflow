// scripts/round-370/probe-1-excluded.js
// 只输出序号与布尔值，不打印样本文本。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src', 'index.js');
const source = fs.readFileSync(SRC, 'utf8');
const lines = source.split('\n');
const startLine = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let endLine = -1;
for (let i = startLine + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { endLine = i; break; } }
const arr = eval('[' + lines.slice(startLine + 1, endLine).join('\n') + ']');
const BS = String.fromCharCode(92);
const U89c9 = BS + 'u89c9' + BS + 'u609f';
const U_budai = BS + 'u4e0d' + BS + 'u662f';
const U_shao = BS + 'u5c11' + BS + 'u5e74' + BS + 'u6c14';
const pat = arr.find(p => p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1 && p.source.indexOf(U_shao) !== -1);
console.log('pat found:', !!pat, 'count:', arr.length);

const samples = [
  '所有的成长不是不发布，是团队需要更多耐心。',
  '真正的成熟不是太慢，是流程缺少勇气。',
  '强大不是没优化，是评审人手不足边界。',
  '幸福不是不够，是策略缺少温度。',
  '孤独不是有问题，是采集链路有缺失善意。',
  '自由不是需要改，是时间不够真诚。',
  '沉默不是待确认，是环境光太强敬畏。',
  '少年不是不稳定，是运营的开始。'
];
samples.forEach((t, i) => {
  console.log(i + 1, pat.test(t));
});

// 逐条排查：把前瞻里各排除短语拆开，看命中窗口
console.log('--- lookahead alternation scan ---');
const m = pat.source.match(/\(\?!\[\^\\u3002\\uff01\\uff1f\\n\]\{0,8\}\((.*?)\)\)/);
if (!m) { console.log('no lookahead found'); process.exit(0); }
const alts = m[1].split('|');
alts.forEach((a, i) => {
  const re = new RegExp('^(?!' + '[^\\u3002\\uff01\\uff1f\\n]{0,8}(' + a + '))');
  let hits = 0;
  samples.forEach(t => { if (re.test(t)) hits++; });
  console.log('alt#' + (i + 1), 'src=' + a, 'isNegOnly', hits === samples.length);
});
