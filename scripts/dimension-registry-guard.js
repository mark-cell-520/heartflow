#!/usr/bin/env node
/**
 * 维度登记守卫（v6.7.84，心虫 decision.decide 0.94）
 *
 * 背景：第 50 轮发现三个维度（pseudo_causal / soft_deflection /
 * premature_termination）算了 checkXxx、推了 findings，却从未登记进
 * discriminate() 的 dimensions 对象与 summary 数组——读方（gate / MCP /
 * 面板）一律从 dimensions 取，于是永远当"未命中"。
 *
 * 这个坑此前无任何机制拦截（第 23 轮的维度行动审计只测单维函数，
 * 没测 discriminate() 的返回值），所以每加一个维度都可能重复踩。
 *
 * 守卫做三件事：
 *   ① 扫 src/index.js 所有 function checkXxx
 *   ② 每个在 discriminate 中被调用的，必须有 const x = checkXxx 绑定
 *   ③ 该绑定必须出现在 dimensions 键 与 summary 引用里
 * 漏任一即 exit 1 并列出名字。
 *
 * 口径注意：变量名是 1-5 位小写字母，dimensions 键即该变量名。
 */
const fs = require('fs');
const path = require('path');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src/index.js');
const src = fs.readFileSync(SRC, 'utf8');

// 1) 所有 function checkXxx
const checkFns = new Set();
for (const m of src.matchAll(/function\s+(check[A-Z]\w*)\s*\(/g)) checkFns.add(m[1]);

// 2) discriminate() 函数体（括号配平）
const dStart = src.indexOf('function discriminate(');
if (dStart === -1) { console.error('找不到 discriminate()'); process.exit(1); }
let depth = 0;
let dEnd = -1;
for (let i = src.indexOf('{', dStart); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') {
    depth--;
    if (depth === 0) { dEnd = i; break; }
  }
}
const body = src.slice(dStart, dEnd);

// 3) dimensions 对象字面量的键
// 不用括号配平——dimensions 里有嵌数组/内联函数会让深度计错。
// 直接取 dimensions: { 到下一个顶层 ", summary:" 之间（该对象以
// "}," 结束后紧跟 summary）。
const dmFrom = body.indexOf('dimensions: {');
const dmTo = body.indexOf('summary: [', dmFrom);
if (dmFrom === -1 || dmTo === -1) { console.error('找不到 dimensions/summary'); process.exit(1); }
const dimSeg = body.slice(dmFrom, dmTo);
const dimKeys = new Set();
// dimensions 是 `维度键: 变量名`——要收集的是**冒号右边的变量名**。
for (const m of dimSeg.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/g)) dimKeys.add(m[2]);

// 4) summary 数组里引用的变量（x ? ... : ...）
const smArrStart = body.indexOf('[', body.indexOf('summary: ['));
let d2 = 0;
let smEnd = -1;
for (let i = smArrStart; i < body.length; i++) {
  if (body[i] === '[') d2++;
  else if (body[i] === ']') {
    d2--;
    if (d2 === 0) { smEnd = i; break; }
  }
}
const sumVars = new Set();
// summary 形如 `xx.count ? ... : ...`。要抓点号**前面**的变量名——
// 直接 \b([a-z]{1,4})\b 会把 count 本身当变量（. 也是词边界）。
for (const m of body.slice(smArrStart, smEnd).matchAll(/\b([a-z]{1,4})\.(?:count|totalHits|issues\.length|structure|score)\s*\?/g)) sumVars.add(m[1]);
// 兼容 `xx && xx.score ? ...`（显式再取一次变量名）
for (const m of body.slice(smArrStart, smEnd).matchAll(/\b([a-z]{1,4})\s*&&\s*\1\./g)) sumVars.add(m[1]);
// 兼容 `ev.issues.length ? ...` 这种
for (const m of body.slice(smArrStart, smEnd).matchAll(/\b([a-z]{1,4})\.\w+\.\w+\s*\?/g)) sumVars.add(m[1]);

// 5) 变量绑定（全文匹配，避免函数体边界问题）
// 两种形态都要认：
//   const x = checkXxx(...)                （常规）
//   const x = _applyPedagogyRelaxation(checkXxx(...))  （带 pedagogy 降权）
//   let x = null; ... x = checkXxx(...)    （[v6.7.84] 先置空后赋值）
const varMap = {}; // varName -> CheckName（去 check 前缀）
for (const m of src.matchAll(/const\s+([a-z]{1,5})\s*=\s*_applyPedagogyRelaxation\(\s*check([A-Z]\w*)\(/g)) {
  varMap[m[1]] = m[2];
}
for (const m of src.matchAll(/const\s+([a-z]{1,5})\s*=\s*check([A-Z]\w*)\(/g)) {
  varMap[m[1]] = m[2];
}
for (const m of src.matchAll(/\b([a-z]{1,5})\s*=\s*check([A-Z]\w*)\(/g)) {
  varMap[m[1]] = m[2];
}

// 6) 核对。用 includes 而非动态 RegExp——动态构造正则在多一层转义时
// 会静默失效（第 50 轮刚被 \\\\b 咬过一次）。
const problems = [];
let bound = 0;
for (const fn of checkFns) {
  if (!body.includes(fn + '(')) continue; // 未被 discriminate 调用
  const bare = fn.replace(/^check/, '');
  const vars = Object.keys(varMap).filter(k => varMap[k] === bare);
  if (vars.length === 0) {
    problems.push(fn + ': 在 discriminate 中调用但找不到 const x = checkXxx 绑定');
    continue;
  }
  bound++;
  const v = vars[0];
  if (!dimKeys.has(v)) problems.push(fn + ': 变量 ' + v + ' 未登记进 dimensions（读方查不到）');
  if (!sumVars.has(v)) problems.push(fn + ': 变量 ' + v + ' 未登记进 summary');
}

console.log('checkXxx 函数: ' + checkFns.size + ' 个；discriminate 内绑定: ' + bound + ' 个');
console.log('dimensions 键: ' + dimKeys.size + ' 个；summary 引用: ' + sumVars.size + ' 个');

if (problems.length) {
  console.log('\n❌ ' + problems.length + ' 项登记问题:');
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('\n✅ 所有被 discriminate 使用的 checkXxx 均已登记进 dimensions 与 summary');
