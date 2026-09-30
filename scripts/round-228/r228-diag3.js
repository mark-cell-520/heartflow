// 第 228 轮诊断三：对 7 条漏判样本，逐支打印 EN_FALLBACK 判据是否单独命中。
// 注入探针到 globalThis，不 eval 源码文本（227 轮教训：eval 会让 \s 二次解析）。
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src/index.js');

const src = fs.readFileSync(SRC, 'utf8');
const anchor = 'function checkNoFallback';
const pos = src.indexOf(anchor);
if (pos < 0) { console.error('anchor missing'); process.exit(1); }
const injected = src.slice(0, pos) + 'globalThis.__EN_FALLBACK = EN_FALLBACK;\n' + src.slice(pos);
const tmp = path.join(ROOT, 'src', '.tmp-r228-probe.js');
fs.writeFileSync(tmp, injected);
const { checkNoFallback } = require(tmp);
const TABLE = globalThis.__EN_FALLBACK;
console.log('EN_FALLBACK total =', TABLE.length);

const MISS = [
  'No rollback plan is documented anywhere in the repo.',
  'No redo path is available once the row is deleted.',
  'It is the last remaining option we have.',
  'Only that route is left to us.',
  'No alternative would do for the audit trail.',
  'No other method can fix the ordering bug.',
  'Nothing else can replace this solution here.',
];
MISS.forEach((t, i) => {
  const hitIdx = [];
  TABLE.forEach((row, j) => { if (row[0].test(t)) hitIdx.push(j + ':' + row[1]); });
  console.log('A' + i + ' fn=' + checkNoFallback(t).count + ' raw=' + hitIdx.join(',') || '(none)');
});
// 打印本轮新增 6 支的索引与类型，确认注入位置正确
TABLE.forEach((row, j) => { if (row[1] === 'sole_option') console.log('sole_option idx=' + j + ' sev=' + row[2]); });
fs.unlinkSync(tmp);
