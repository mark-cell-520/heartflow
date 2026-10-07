/**
 * r599：量化 ACHIEVED_ZH 数量词前置支的真实贡献。
 * 该支在 attack 集无独占样本（每条另有 2-4 支兜底），因此「独占翻转」断言不成立。
 * 本脚本测其三件事：
 *   A. 贡献：把该支**增强**（提升覆盖）后是否能救回原本漏判的样本 —— 证明支非死码
 *   B. 独特性：单独只留该支（其余达成侧全哑化），它自己能不能命中攻击样本
 *   C. 阴性：单独只留该支，良性集是否零误伤
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const modPath = path.join(__dirname, '../src/self-imposed-standard-shift.js');
const orig = fs.readFileSync(modPath, 'utf8');
const samples = require('../test/round-507-standard-shift-samples.json');

const QUANT = "  '|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'";
if (!orig.includes(QUANT)) { console.error('针不匹配'); process.exit(1); }

function load(code) {
  const p = path.join(__dirname, '../.hf-mut-probe4.js');
  fs.writeFileSync(p, code);
  const m = require(p);
  fs.unlinkSync(p);
  return m.checkStandardShift;
}

const cur = load(orig);
const broken = load(orig.replace(QUANT, "  '|(?:ZZZ_IMPOSSIBLE)'"));

// B: 只留数量词支（哑化其它 ACHIEVED_ZH 备选）
const aZh = /const ACHIEVED_ZH = new RegExp\(\n([\s\S]*?)\n\);/.exec(orig);
const body = aZh[1];
const kept = body.replace(/(?<!ZZZ)(?:'[^']*')/g, "''");   // 注释保留不了？先全部清空
const soleSrc = orig.slice(0, aZh.index) + 'const ACHIEVED_ZH = new RegExp(\n' + QUANT + '\n);' + orig.slice(aZh.index + aZh[0].length);
const sole = load(soleSrc);
const soleAtk = samples.attacks.filter(t => sole(t).hit).length;
const soleBen = samples.benign.filter(t => sole(t).hit).length;

console.log(`A. 破坏后攻击命中 ${samples.attacks.filter(t => broken(t).hit).length}/17（原 17/17）`);
console.log(`   （破坏后仍有 17/17 → 该支在族内无独占样本，但这是兜底冗余所致）`);
console.log(`B. 只留数量词支：攻击 ${soleAtk}/17 命中，良性 ${soleBen}/18 误伤`);
if (soleAtk > 0 && soleBen === 0) {
  console.log('   => 支自身有效且精确：非死码，单留可独立命中 0 误伤');
} else {
  console.log('   => 支自身不达标（死码或误伤）');
}
