'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src', 'index.js');
const source = fs.readFileSync(SRC, 'utf8');
const BS = String.fromCharCode(92);
const lines = source.split('\n');
const startLine = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let endLine = -1;
for (let i = startLine + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { endLine = i; break; } }
const arr = eval('[' + lines.slice(startLine + 1, endLine).join('\n') + ']');
const U89c9 = BS + 'u89c9' + BS + 'u609f';
const U_budai = BS + 'u4e0d' + BS + 'u662f';
const U_shao = BS + 'u5c11' + BS + 'u5e74' + BS + 'u6c14';
const idx = arr.findIndex(p => p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1 && p.source.indexOf(U_shao) !== -1);
console.log('matched arr index =', idx, 'of', arr.length);
const pat = arr[idx];
const samples = [
  '成长不是变得世故，是对世界依然保持觉悟。',
  '成熟不是终于抵达，是学会与初心对话。',
  '强大不是没有软肋，是依然选择修行。',
  '幸福不是拥有一切，是心里还有格局。',
  '孤独不是无人陪伴，是眼界无人能懂。',
  '沉默不是无话可说，是胸怀自有山河。',
  '从容不是不急，是心里有慈悲。',
  '自由不是想去哪就去哪，是心里自在。',
  '成熟不是会说话，是懂得边界。',
  '少年不是没有伤痕，是眼里还有光。',
  '真正的成熟，不是变得世故，是对世界依然保持热爱。',
  '自由不是逃离，是内心真正的自在。',
  '沉默不是妥协，是一种胸襟与格局。',
];
for (const t of samples) {
  console.log(pat.test(t), t);
}
// 打印选中条目的 source 前 400 字符
console.log('---SOURCE---');
console.log(pat.source.slice(0, 500));
