/**
 * r292 探针 18：精确定位那条 18 字回归样本
 * 探针 17 报的形状: 17 个 C + 全角逗号 + 7 个 C = 25 字符（shape slice 24）
 * 但因去重顺序，lang-coverage-fill 可能不是它的真来源。
 * 本探针：不猜，直接把该句从 lang-coverage-fill 的四句中文里逐句试。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

function fwPunctFold(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[\uFF0C\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\uFF0D\uFF5E]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

const f = path.join(ROOT, 'test/lang-coverage-fill.test.js');
const src = fs.readFileSync(f, 'utf8');
// 抓该文件里全部单引号字符串
const all = [...src.matchAll(/'([^'\n]{8,200})'/g)].map(m => m[1]).filter(s => /[\u4e00-\u9fff]/.test(s));
console.log(`lang-coverage-fill.test.js 中文字符串: ${all.length} 句\n`);

for (let i = 0; i < all.length; i++) {
  const s = all[i];
  const folded = fwPunctFold(s);
  const changed = folded !== s;
  let a1 = 'n/a', a2 = 'n/a';
  try { a1 = gate.gate(s).gate.action; } catch (_) {}
  if (changed) { try { a2 = gate.gate(folded).gate.action; } catch (_) {} }
  const mark = (changed && a1 !== 'pass' && a2 === 'pass') ? '  ★★ 回归' : '';
  console.log(`  [${i}] len=${String(s.length).padStart(3)}  含全角=${changed}  ${a1} → ${a2}${mark}`);
}
