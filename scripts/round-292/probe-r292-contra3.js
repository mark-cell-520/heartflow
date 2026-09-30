/**
 * r292 探针 16：干净复现探针 11 报的 1 条「丢失拦截」
 *
 * 疑点：探针 15 直接用 gate() 跑原文 vs NFKC 折叠版，两种形态判词相同
 * （都 verify），没有回归。但探针 11 报「原本非 pass → 折叠后 pass」1 条。
 * 差异在：探针 11 的 fwPunctFold 是**自定义字符集**（含全角括号等），
 * 与 NFKC 折叠集不同。需要确认探针 11 的结论到底成不成立。
 *
 * 本探针：对那一条样本，分别跑
 *   ① gate(原文)
 *   ② gate(fwPunctFold(原文))       ← 探针 11 的做法
 *   ③ gate(NFKC(原文))              ← 管线真实做法
 * 看三者判词。若 ② 与 ③ 不同 → 探针 11 的「回归」是我自造折叠函数的产物，不成立。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const src = fs.readFileSync(path.join(ROOT, 'test/lang-coverage-fill.test.js'), 'utf8');
const m = src.match(/'([^']*\u6709[^']*\uFF0C[^']*\u4F46[^']*)'/g) || [];
const target = m.map(s => s.slice(1, -1)).find(s => s.includes('\u4F46') && s.includes('\u5E76')) || m.map(s => s.slice(1, -1))[0];

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
// 复刻探针 11 的自定义折叠集
function fwPunctFold(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[\uFF0C\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\uFF0D\uFF5E]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

const cases = [
  ['原文', target],
  ['fwPunctFold(自定义)', fwPunctFold(target)],
  ['NFKC(管线真实)', pipeNormalize(target)],
];
console.log('══════ r292 探针 16：三种形态判词对比 ══════');
for (const [label, text] of cases) {
  const r = gate.gate(text);
  console.log(`  ${label.padEnd(20)} action=${r.gate.action} score=${r.overallScore}`);
}
console.log('');
console.log('自定义折叠 != NFKC 折叠: ', fwPunctFold(target) !== pipeNormalize(target));
console.log('  自定义折叠结果含括号:', /[(]/.test(fwPunctFold(target)));
console.log('  NFKC 结果含括号:', /[(]/.test(pipeNormalize(target)));
