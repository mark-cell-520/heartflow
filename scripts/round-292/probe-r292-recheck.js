/**
 * r292 探针 17：验证探针 11 的「1 条丢失拦截」是否真实存在
 *
 * 探针 16 已证：针对 lang-coverage-fill 那句，三种形态判词全部相同。
 * 所以探针 11 报的那 1 条要么是别样本、要么是统计问题。
 * 本探针改用**不重映射源文件**的方式：直接列出所有
 * 「原文非 pass 且 fwPunctFold 后 pass」的样本码位形状，逐一复核。
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
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}
const CJK = /[\u4e00-\u9fff]/;
function extractZhStrings(src) {
  const out = [];
  for (const q of ['"', "'"]) {
    const re = new RegExp(q + '([^' + q + '\\\\\\n]{12,300})' + q, 'g');
    let m;
    while ((m = re.exec(src)) !== null) if (CJK.test(m[1]) && !m[1].includes('\\\\u')) out.push(m[1]);
  }
  return out;
}

// 逐文件处理：某句只归属第一个含它的文件（与探针 11 相反的顺序，检验归属敏感性）
const seen = new Set();
const samples = [];
for (const f of walk(path.join(ROOT, 'test')).sort()) {
  for (const s of extractZhStrings(fs.readFileSync(f, 'utf8'))) {
    if (seen.has(s)) continue;
    seen.add(s);
    samples.push({ s, file: path.relative(ROOT, f) });
  }
}
console.log('══════ r292 探针 17：复核「丢失拦截」清单 ══════');
console.log('样本:', samples.length);

const dimsOf = (r) => {
  const o = new Set();
  if (r && Array.isArray(r.trace)) for (const t of r.trace) if (t && t.dimension && t.dimension !== '_normalization') o.add(t.dimension);
  if (r && Array.isArray(r.findings)) for (const f of r.findings) if (f && f.dimension) o.add(f.dimension);
  return [...o];
};
let lost = [];
for (const { s, file } of samples) {
  const folded = fwPunctFold(s);
  if (folded === s) continue;
  let a1, a2, d1, d2;
  try { const r = gate.gate(s); a1 = r.gate.action; d1 = dimsOf(r); } catch (_) { continue; }
  try { const r = gate.gate(folded); a2 = r.gate.action; d2 = dimsOf(r); } catch (_) { continue; }
  if (a1 !== 'pass' && a2 === 'pass') lost.push({ file, action: a1, dims1: d1, dims2: d2, shape: shapeOf(s) });
}
console.log('丢失拦截:', lost.length);
for (const l of lost) console.log(`  ${l.file}  ${l.action}→pass  丢失维度=${l.dims1.join('/')}  形状=${l.shape}`);
console.log('');
console.log(lost.length === 0
  ? '结论：不存在真实回归。探针 11 的 1 条是统计假象（归属映射 + 判空顺序）。'
  : '结论：存在真实回归，需逐条修。');

function shapeOf(s) {
  return [...s].slice(0, 24).map(c => {
    const cp = c.codePointAt(0);
    if (cp < 0x7f) return c;
    if (cp >= 0x4e00 && cp <= 0x9fff) return 'C';
    return '<' + cp.toString(16) + '>';
  }).join('') + (s.length > 24 ? '…' : '');
}
