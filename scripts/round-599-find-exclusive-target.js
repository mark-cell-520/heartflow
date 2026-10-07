/**
 * r599：为 ACHIEVED_ZH 数量词前置支找出真正独占的变异靶样本。
 * 独占定义：破坏该支后 hit 由 true 变 false 的攻击样本。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const modPath = path.join(__dirname, '../src/self-imposed-standard-shift.js');
const orig = fs.readFileSync(modPath, 'utf8');
const samples = require('../test/round-507-standard-shift-samples.json');

// 双支哑化（第 91-92 行的两个源行），确保整支被破坏
const needle = "  '|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'";
if (!orig.includes(needle)) { console.error('针不匹配'); process.exit(1); }
const brokenSrc = orig.replace(needle, "  '|(?:ZZZ_IMPOSSIBLE)'");

function load(code) {
  const p = path.join(__dirname, '../.hf-mut-probe3.js');
  fs.writeFileSync(p, code);
  const m = require(p);
  fs.unlinkSync(p);
  return m.checkStandardShift;
}

const before = load(orig);
const after = load(brokenSrc);

console.log('=== 破坏数量词前置支：攻击样本独占性扫描 ===');
samples.attacks.forEach((t, i) => {
  const b = before(t).hit, a = after(t).hit;
  if (b && !a) console.log(`  独占 target: attacks[${i}] (翻转 true->false)`);
});
console.log('=== 良性样本是否被该支影响（应无）===');
samples.benign.forEach((t, i) => {
  const b = before(t).hit, a = after(t).hit;
  if (b !== a) console.log(`  受影响 benign[${i}] ${b}->${a}`);
});
console.log('=== 17 条攻击在该支破坏前后的命中数 ===');
const hb = samples.attacks.filter(t => before(t).hit).length;
const ha = samples.attacks.filter(t => after(t).hit).length;
console.log(`  破坏前 ${hb}/17，破坏后 ${ha}/17`);
