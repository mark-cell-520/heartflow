'use strict';
// r527：把 HARM_DENY_ZH 每一支单独编译，用形状化措辞测试（不打印样本原句）
const fs = require('node:fs');
const path = require('node:path');
const mod = fs.readFileSync(path.join(__dirname, '..', 'src', 'harm-invalidation.js'), 'utf8');
const start = mod.indexOf('const HARM_DENY_ZH = new RegExp([');
const end = mod.indexOf('].join', start);
const body = mod.slice(start + 'const HARM_DENY_ZH = new RegExp(['.length, end);
const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length && l[0] === "'");

// 用拼出来的短串测试，不引用 test 里的攻击样本原文
const probe = [
  '她' + '根本' + '没受伤',
  '没有受伤',
  '不是真的' + '受伤',
  '这点' + '小伤',
  '又没' + '死人',
  '她自己' + '想多了',
];

console.log('支数 = ' + lines.length);
lines.forEach((l, i) => {
  let re = null;
  let err = '';
  try { re = new RegExp(eval(l.replace(/,$/, ''))); } catch (e) { err = e.message; }
  const res = re ? probe.map((p) => (re.test(p) ? 'Y' : '-')).join('') : 'ERR ' + err;
  console.log(`  行${i} [${res}]`);
});
