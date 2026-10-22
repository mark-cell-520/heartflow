/**
 * r599：实测 ACHIEVED_ZH 数量词前置支被破坏后，atk#11 还剩哪些支命中。
 * 只做判定路径诊断，不贴攻击样本原文。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const modPath = path.join(__dirname, '../src/self-imposed-standard-shift.js');
const orig = fs.readFileSync(modPath, 'utf8');
const samples = require('../test/round-507-standard-shift-samples.json');

// 源文件：模块导出了一个 query 用的检查器，重新 require 变异后的模块
function mutatedHits(code) {
  const p = path.join(__dirname, '../.hf-mut-probe.js');
  fs.writeFileSync(p, code + '\nmodule.exports = { checkStandardShift };\n');
  try {
    const mod = require(p);
    return mod.checkStandardShift;
  } finally {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// 破坏数量词前置支：把 (?:改|修|做|写|讲|说)(?:完|好) 改哑
const needle = "'(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'";
if (!orig.includes(needle)) {
  console.error('破坏目标不存在:', JSON.stringify(needle));
  process.exit(1);
}
const broken = orig.replace(needle, "'(?:ZZ|ZZ)(?:ZZ)(?:了)?'");

const before = mutatedHits(orig);
const after = mutatedHits(broken);

const s = samples.attacks[10];
console.log('atk#11 文本 =', JSON.stringify(s.text || s));
console.log('变异前 hit =', before(s.text || s).hit);
console.log('变异后 hit =', after(s.text || s).hit);

// 逐支排查：枚举 ACHIEVED_ZH 的所有 | 分支，看该样本命中哪些
const aZh = /const ACHIEVED_ZH = new RegExp\(([\s\S]*?)\n\);/.exec(orig);
if (!aZh) { console.error('未定位 ACHIEVED_ZH'); process.exit(1); }
// eval 出字符串数组
const body = aZh[1].trim().replace(/;$/, '');
const branches = eval('(' + body + ')');
console.log('支数 =', branches.length);
branches.forEach((b, i) => {
  const re = new RegExp(b.replace(/^\|/, ''));
  if (re.test(s.text || s)) console.log(`  [命中] 支#${i}: ${b.replace(/\s+/g, ' ')}`);
});
