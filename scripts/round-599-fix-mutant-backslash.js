/**
 * r599：修 test/round-507-standard-shift.test.js 变异守卫 from 串的反斜杠层数。
 * 实测（mutant-diag + 本脚本首轮测量）：
 *   源码  ACHIEVED_ZH 数量词前置支 = 4 个反斜杠字符 + d+（JSON 显示 8）
 *   测试  from 字面量              = 8 个反斜杠字符 + d+（本脚本实测 len=7 → 8）
 *   → 需要把测试文件里两处 run 从 8 个缩到 4 个，与源码对齐。
 * 两处 run 长度相同且各出现一次，因此按「长度 8 的 run → 长度 4」逐一改。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const p = path.join(__dirname, '../test/round-507-standard-shift.test.js');
const t = fs.readFileSync(p, 'utf8');

const re = /\\+d\+/g;
let m;
const runs = [];
while ((m = re.exec(t)) !== null) {
  runs.push({ len: m[0].length - 2, index: m.index }); // len = 反斜杠字符数
}
console.log('实测各处反斜杠 run 长度:', JSON.stringify(runs));

const targets = runs.filter(r => r.len === 8);
if (targets.length !== 2) {
  console.error(`预期 2 处长度 8 的 run，实际 ${targets.length} 处，拒绝盲改`);
  process.exit(1);
}

const bad = '\\'.repeat(8) + 'd+';
const good = '\\'.repeat(4) + 'd+';
const parts = t.split(bad);
if (parts.length !== 3) {
  console.error(`出现 ${parts.length - 1} 次，预期 2 次，拒绝盲改`);
  process.exit(1);
}
fs.writeFileSync(p, parts.join(good));
console.log('已修复 2 处: 反斜杠 run 8 -> 4（与源码对齐）');
