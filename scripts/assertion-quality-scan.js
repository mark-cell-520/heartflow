#!/usr/bin/env node
/**
 * scripts/assertion-quality-scan.js — 弱断言扫描（v6.7.76）
 *
 * 来源：第 38 轮发现 v6.7.74 的归一化 bug 带着绿灯上线，
 * 因为测试断言查的是 "不含 not a function" 而不是 "功能真的对"。
 *
 * 弱断言模式（会让有 bug 的代码通过）：
 *   A. assert.ok(x !== undefined) / x !== null        —— 只查存在
 *   B. assert.ok(!err.includes('xxx')) / notStrictEqual(err, 'yyy')
 *      —— 只查"没报某种特定错"，换种错法就漏
 *   C. assert.ok(typeof x === 'function')             —— 只查导出存在
 *   D. assert.ok(x)                                   —— 裸真值，可能是 {} / 0 / ''
 *   E. assert.ok(Array.isArray(x))                    —— 只查是数组，不查内容
 *
 * 强断言模式（要鼓励）：
 *   - assert.strictEqual(action, 'block')             —— 查具体值
 *   - assert.ok(x.field === expected)                 —— 查结构化内容
 *   - assert.ok(arr.length === 3)                     —— 查数量
 *   - assert.throws(...)                              —— 查真的抛错
 */
const fs = require('fs');
const path = require('path');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TEST_DIR = path.join(ROOT, 'test');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.test.js') || e.name.endsWith('-test.js')) out.push(p);
  }
  return out;
}

const files = walk(TEST_DIR);
// [v6.7.76] B_neg_error 只在**同一函数体内没有正向断言**时才算弱断言。
// 审计实测：8 处 B_neg_error 里 4 处旁边有正向断言（如
//   assert.ok(!r.dims.includes('_normalization'), ...);
//   assert.ok(r.dims.includes('hate_speech'));
// 那是合理的回归防线。真正危险的是第 37/38 轮那种**只有负向**的模式。
const STRONG_RE = /assert\.strictEqual\(|assert\.deepStrictEqual\(|assert\.ok\([^!][\s\S]{0,120}?(?:\.length|\.count|\.action|\.score|\.includes|\.has\(|instanceof)/;
const WEAK = [
  { id: 'A_existence', re: /assert\.ok\(\s*[\w.?[\]]+\s*(!==|!=)\s*(undefined|null)\s*\)/g,
    why: '只查存在，不查内容' },
  { id: 'B_neg_error', re: /assert\.ok\(\s*![\w.?[\]()]*\.includes\(/g,
    why: '只查"没报某种特定错"——第 37/38 轮的 bug 正是这样溜过去的' },
  { id: 'B_notStrictEqual', re: /assert\.notStrictEqual\(\s*[\w.?[\]()]+\s*,\s*['"][^'"]+['"]\s*\)/g,
    why: '只查"不等于某个值"，任何其他值都算过' },
  { id: 'C_typeof_fn', re: /assert\.ok\(\s*typeof\s+[\w.?[\]]+\s*===\s*['"]function['"]\s*\)/g,
    why: '只查函数存在，不查它能用（导出面检查除外）' },
  { id: 'D_bare_truthy', re: /assert\.ok\(\s*(r|res|result|out|data|ret)\s*[,)]/g,
    why: '裸真值：{}、0、[]、"" 都算过' },
  { id: 'E_isArray', re: /assert\.ok\(\s*Array\.isArray\(/g,
    why: '只查是数组，不查长度/内容' },
];
// [v6.7.76] 三类常见误报的排除：
//   E_isArray 同行/同表达式里有 && x.length  → 实际查了长度
//   C_typeof_fn 在导出面检查文件（compliance/registry/exports）→ 测试目的就是查存在
const EXCLUDE_FILES = /compliance|registry|export|api-surface|public-api/i;

const report = [];
let totalWeak = 0, totalFiles = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f);
  // 导出面检查文件的 typeof 检查不算弱断言
  const isSurfaceFile = EXCLUDE_FILES.test(rel);
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  const hits = [];
  for (const W of WEAK) {
    if (isSurfaceFile && W.id === 'C_typeof_fn') continue;
    W.re.lastIndex = 0;
    let m;
    while ((m = W.re.exec(src)) !== null) {
      const lineNo = src.slice(0, m.index).split('\n').length;
      const line = (lines[lineNo - 1] || '').trim().slice(0, 80);
      // [v6.7.76] B_neg_error：同函数体内有正向断言则不算弱
      if (W.id === 'B_neg_error') {
        const before = src.slice(0, m.index);
        const fnStart = Math.max(before.lastIndexOf("\nt("), before.lastIndexOf("\ntest("));
        const after = src.slice(m.index);
        const nextFn = after.search(/\n\s*(t|test)\(/);
        const fnBody = src.slice(fnStart, nextFn > 0 ? m.index + nextFn : src.length);
        if (STRONG_RE.test(fnBody)) continue;
      }
      // [v6.7.76] E_isArray：同一表达式里有 .length / && 长度检查则不算弱
      if (W.id === 'E_isArray') {
        const exprStart = src.lastIndexOf('assert.ok(', m.index);
        const exprEnd = src.indexOf(';', m.index);
        const expr = src.slice(exprStart, exprEnd > 0 ? exprEnd : exprStart + 200);
        if (/\.length\s*[><=]=?/.test(expr)) continue;
      }
      hits.push({ id: W.id, line: lineNo, code: line, why: W.why });
    }
  }
  if (hits.length > 0) { totalFiles++; totalWeak += hits.length; }
  report.push({ file: path.relative(ROOT, f), hits });
}

console.log(`\n扫描 ${files.length} 个测试文件`);
console.log(`含弱断言的文件: ${totalFiles}`);
console.log(`弱断言总数: ${totalWeak}\n`);

// 按文件汇总
const ranked = report.filter(r => r.hits.length > 0).sort((a, b) => b.hits.length - a.hits.length);
console.log('=== 弱断言最多的文件（前 15）===');
for (const r of ranked.slice(0, 15)) {
  console.log(`  ${String(r.hits.length).padStart(3)}  ${r.file}`);
}

console.log('\n=== 按类型分布 ===');
const byType = {};
for (const r of report) for (const h of r.hits) {
  byType[h.id] = byType[h.id] || { n: 0, why: h.why, samples: [] };
  byType[h.id].n++;
  if (byType[h.id].samples.length < 2) byType[h.id].samples.push(h.code.slice(0, 70));
}
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${k.padEnd(20)} ${String(v.n).padStart(4)}  ${v.why}`);
  for (const s of v.samples) console.log(`        e.g. ${s}`);
}

fs.writeFileSync('/tmp/assertion-scan.json', JSON.stringify(report, null, 1));
console.log('\n完整结果 → /tmp/assertion-scan.json');
