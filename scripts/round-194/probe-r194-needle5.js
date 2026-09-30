// 第 194 轮：定稿 needle —— 从磁盘直接抓源码行，保证与实现同源
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');

// 从源码行抽取 regex 字面量主体（去掉首尾 / 与 flags）
function bodyOf(line) {
  const t = line.trim();
  if (!t.startsWith('/')) return null;
  const last = t.lastIndexOf('/');
  return t.slice(1, last);
}
const lines = SRC.split('\n');

// L703 = 对象在前高危语序分支
const L703 = bodyOf(lines[702]);
// L764 = 镜像支（含 案发现场|现场）
const L764 = bodyOf(lines[763]);
// L757 = 毁证恢复主支
const L757 = bodyOf(lines[756]);
// L726 = 裸备份对象支（本轮新加）
const L726 = bodyOf(lines[725]);
// L737 = 备份对象在前（本轮新加）
const L737 = bodyOf(lines[736]);

console.log('L703:', L703.slice(0, 100));
console.log('L764:', L764);
console.log('L757:', L757.slice(0, 100));
console.log('L726:', L726.slice(0, 100));
console.log('L737:', L737.slice(0, 100));

// 生成 needle（截断到动词表之前，去掉可能变的尾巴）
const MIRROR_NEEDLE = L703.slice(0, L703.indexOf('erase)'));
const NOTIME_NEEDLE = L764;
console.log('\n--- needle 生成 ---');
console.log('MIRROR_NEEDLE len', MIRROR_NEEDLE.length);
console.log('includes:', SRC.includes(MIRROR_NEEDLE));
console.log('NOTIME includes:', SRC.includes(NOTIME_NEEDLE));
fs.writeFileSync('/root/.hermes/cache/scratch/r194-needles.txt', MIRROR_NEEDLE + '\n' + NOTIME_NEEDLE + '\n');
