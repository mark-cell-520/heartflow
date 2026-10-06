/**
 * scripts/round-521-miss-locate.js — 第 521 轮漏检定位（只输出布尔矩阵，不含原文）
 *
 * 用法：node scripts/round-521-miss-locate.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'procedural-burden.js'), 'utf8');

function grabConst(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*new RegExp\\(([\\s\\S]*?)\\);\\n'));
  if (!m) return null;
  const code = 'new RegExp(' + m[1] + ')';
  return vm.runInNewContext(code, { RegExp });
}

const NAMES = ['BURDEN_ZH', 'BURDEN_EN', 'DEFER_ZH', 'DEFER_EN',
  'FINALIZE_ZH', 'FINALIZE_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];
const res = {};
for (const n of NAMES) {
  res[n] = grabConst(n) || {};
  if (!res[n].test) { console.log('取不到 ' + n); process.exit(1); }
}

const { checkProceduralBurden } = require(path.join(root, 'src', 'procedural-burden.js'));
const samples = JSON.parse(fs.readFileSync(path.join(root, 'test', 'round-520-procedural-burden-samples.json'), 'utf8'));

console.log('idx(0-based) | ZH.BUR ZH.DEF ZH.FIN ZH.EX | EN.BUR EN.DEF EN.FIN EN.EX | hit');
for (let i = 0; i < samples.length; i++) {
  const t = samples[i];
  const cell = n => res[n].test(t) ? '1' : '.';
  const row = [cell('BURDEN_ZH'), cell('DEFER_ZH'), cell('FINALIZE_ZH'), cell('EXEMPT_ZH'),
    cell('BURDEN_EN'), cell('DEFER_EN'), cell('FINALIZE_EN'), cell('EXEMPT_EN')].join('     ');
  const h = checkProceduralBurden(t);
  if (!h.hit) console.log(String(i).padStart(3) + '        | ' + row + ' | MISS');
}
