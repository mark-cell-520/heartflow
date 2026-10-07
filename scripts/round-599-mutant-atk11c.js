/**
 * r599：找出 atk#11 在数量词前置支被破坏后仍命中的**其他**支。
 * 方法：直接编辑源码副本，把数量词前置支整行注释掉 → 破坏问题支 → 逐支枚举
 * ACHIEVED_ZH 的顶层备选（按源码里每行 ' + 开头拆，一个源行 = 一支备选）。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');

const modPath = path.join(__dirname, '../src/self-imposed-standard-shift.js');
const orig = fs.readFileSync(modPath, 'utf8');

const text = require('../test/round-507-standard-shift-samples.json').attacks[10];
console.log('样本:', JSON.stringify(text));

// 1) 现行命中
const cur = require('../src/index.js').checkStandardShift(text);
console.log('现行 hit =', cur.hit);

// 2) 按源行拆支（行以 "  '" 开头且含 ' +' 结尾 = 一支），跳过注释行
const aZh = /const ACHIEVED_ZH = new RegExp\(\n([\s\S]*?)\n\);/.exec(orig);
const lines = aZh[1].split('\n');
const branches = [];
for (const ln of lines) {
  const s = ln.trim();
  if (s.startsWith('//')) continue;
  const m = /^'((?:[^']|\\')*)'$/.exec(s.replace(/\s*\+$/, ''));
  if (m) branches.push(m[1]);
}
console.log('源行支数（非注释）=', branches.length);
branches.forEach((b, i) => {
  const f = b.replace(/^\|/, '');
  let ok = false, err = '';
  try { ok = new RegExp(f).test(text); } catch (e) { err = e.message; }
  console.log(`  ${ok ? '命中' : (err ? 'err ' : '--  ')} 支行#${i}: ${f.slice(0, 70).replace(/\s+/g, ' ')}${err ? ' | ' + err : ''}`);
});

// 3) 关键验证：把数量词前置支的两个源行整行哑化后，样本是否还命中
const needle = "  '|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'";
if (!orig.includes(needle)) { console.error('针不匹配，无法做变异'); process.exit(1); }
const brokenSrc = orig.replace(needle, "  '|(?:ZZZ_IMPOSSIBLE)'");
const tmp = path.join(__dirname, '../.hf-mut-probe2.js');
fs.writeFileSync(tmp, brokenSrc);
const mutMod = require(tmp);
fs.unlinkSync(tmp);
const after = mutMod.checkStandardShift(text);
console.log('破坏数量词支后 hit =', after.hit);
if (after.hit) {
  console.log('=> 该支不是独占支，测试断言「独占」不成立（需要换样本或换支）');
} else {
  console.log('=> 该支是独占支，测试断言成立');
}
