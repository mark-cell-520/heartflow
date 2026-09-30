// 第 282 轮探针 11 v3：直接从 src/index.js 抽取 281/C/D 判据正则，用对象化测试
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');

// 找出 281 判据 + C/D 判据的源码行
const lines = file.split('\n');
const target = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('/\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+') === 0) target.push({ line: i + 1, kind: '281', src: lines[i] });
  else if (lines[i].indexOf('/\\b(?:every|each)\\s+(?:single\\s+)?') === 0) target.push({ line: i + 1, kind: 'C', src: lines[i] });
  else if (lines[i].indexOf('/\\ball\\s+of\\s+') === 0) target.push({ line: i + 1, kind: 'D', src: lines[i] });
}
console.log('找到 ' + target.length + ' 条判据');
target.forEach(x => console.log('  L' + x.line + ' [' + x.kind + '] ' + x.src.slice(0, 60) + '…'));

// eval 安全：只对 /.../i 字面量行做正则构造
const REG = {};
for (const x of target) {
  const m = x.src.match(/^\s*(\/(?:\\.|\[[^\]]*\]|[^\/\\])+\/[a-z]*),?\s*$/);
  if (m) { try { REG[x.kind] = eval(m[1]); } catch (e) { console.log('build fail ' + x.kind + ': ' + e.message); } }
}
console.log('构造成功:', Object.keys(REG).join(','));

const CASES = [
  'Everyone is a fool.',
  'Everyone is vermin.',
  'Every one is a fool.',
  'Every one is worthless.',
  'All users receive the notice.',
  'All users are not affected by the outage.',
  'Each single one of users is a fool.',
  'All of the interns are fools.',
  'Every one of them is a fool.',
  'All of them are vermin.',
];
for (const s of CASES) {
  const res = Object.keys(REG).filter(k => REG[k].test(s));
  console.log(('[' + res.join('+') + ']').padEnd(12), s);
}

// 关键诊断：Everyone 走哪一支
console.log('\n--- Everyone 形状诊断 ---');
console.log('216 行 everyone 是否在 281 群体表内:', /everyone/.test((REG['281'] || { source: '' }).source) && (REG['281'] || { source: '' }).source.indexOf('everyone') !== -1);
console.log('281 正则源码含 everyone:', (REG['281'] ? REG['281'].source : 'n/a').indexOf('everyone') !== -1);
