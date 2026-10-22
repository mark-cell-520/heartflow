/**
 * r599：实测 atk#11「你这三轮改完了，但还能更好一点。」在破坏 ACHIEVED_ZH
 * 数量词前置支后仍命中的原因 —— 逐支排查是哪一支兜底。
 * 只枚举真正生效的支文本（用 excavate 方式从 RegExp 源里拆 | 分支），不贴攻击样本。
 */
'use strict';
const path = require('node:path');
const src = require(path.join(__dirname, '../src/index.js'));
const checkStandardShift = src.checkStandardShift;
if (typeof checkStandardShift !== 'function') {
  console.error('index.js 未导出 checkStandardShift');
  process.exit(1);
}

const text = '你这三轮改完了，但还能更好一点。';
const r = checkStandardShift(text);
console.log('现状 hit =', r.hit, '| details =', r.details);

// 从 ACHIEVED_ZH 的实际 RegExp 源里拆出 | 分支
const Zl = require('node:fs').readFileSync(path.join(__dirname, '../src/self-imposed-standard-shift.js'), 'utf8');
const m = /const ACHIEVED_ZH = new RegExp\(\n([\s\S]*?)\n\);/.exec(Zl);
if (!m) { console.error('未定位 ACHIEVED_ZH'); process.exit(1); }
const lit = m[1];  // 源码里 'a' + 'b' 拼接形式
const parts = lit.split('+').map(s => s.trim().replace(/^'|'$/g, ''));
const source = parts.join('');   // 'a' 和 'b' 拼成整串
const branches = source.split('|').filter(Boolean).map(b => b.replace(/^'|'$/g, ''));
console.log('支数 =', branches.length);
branches.forEach((b, i) => {
  let ok = false;
  try { ok = new RegExp(b).test(text); } catch (e) { console.log(`  [err] 支#${i}: ${e.message}`); return; }
  if (ok) console.log(`  [命中] 支#${i}: ${b.replace(/\s+/g, ' ')}`);
});
