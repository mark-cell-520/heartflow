/**
 * r292 探针 12：修法 A 单点实测 —— 给否定类补半角孪生是否安全
 *
 * 修法 B 已实测不可行（contradiction 1 条回归）。
 * 修法 A：逐个给 `[^。，]` 补成 `[^。，,]`。
 *
 * 关键预判（决定是否值得做）：
 *   否定类补半角 = 排除集变大 = 否定类变窄 = 匹配长度上限更难撑满。
 *   效果：原本能跨半角逗号的匹配现在会被截断。**这会降召回**。
 *   但另一方面：管线入口 NFKC 一定折成半角，而管线现在跑的就是
 *   「补了半角后」的严格版本 —— 意味着管线的真实行为已经暴露过这个收窄。
 *   若管线在补半角前后判词不变，说明收窄对实际文本无影响。
 *
 * 本探针实测：对 index.js 里实证分裂的 10 行，逐个补半角孪生后，
 *   比对全量 test/ 样本的 gate 判词变化。
 *
 * 只输出统计数字与定位，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const P = (...a) => console.log(...a);

// 用 source-level patch + 子进程实测。因需修改 src/index.js，这里只做「预演」：
// 读取 src/index.js，在内存里做替换，调用 discriminate 前后差分。

const idx = require(path.join(ROOT, 'src/index.js'));
const origSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

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
const samples = [...new Set([].concat(...walk(path.join(ROOT, 'test')).map(f => extractZhStrings(fs.readFileSync(f, 'utf8')))))];

// 10 个实证分裂行（来自 probe-r292-verify-split.log，src/index.js）
const TARGETS = [242, 245, 246, 247, 263, 265, 266, 275, 276, 1901, 1953, 2251, 2373, 2374, 3405, 3533, 4498, 4500];

// 在内存构造 patched source：把这些行的 [^。X] 补半角孪生
function patchLines(src, lineNums) {
  const lines = src.split('\n');
  for (const n of lineNums) {
    const i = n - 1;
    if (!lines[i]) continue;
    // 替换 [^。，] → [^。，,]；[^。；] → [^。；;]；等
    lines[i] = lines[i]
      .replace(/\^(\\.|\u3002|\uFF0C|\uFF1B|\uFF1A|\uFF01|\uFF1F|\uFF0D|\uFF5E|\uFF08|\uFF09)+/g, (m) => {
        let r = m;
        const pairs = { '\uFF0C': ',', '\uFF1B': ';', '\uFF1A': ':', '\uFF01': '!', '\uFF1F': '?', '\uFF0D': '-', '\uFF5E': '~', '\uFF08': '(', '\uFF09': ')' };
        for (const [fw, h] of Object.entries(pairs)) if (r.includes(fw) && !r.includes(h)) r += h;
        return r;
      });
  }
  return lines.join('\n');
}

const patched = patchLines(origSrc, TARGETS);
P('══════ r292 探针 12：修法 A 单点预演 ══════');
P(`目标行: ${TARGETS.join(', ')}`);
P(`source 是否改变: ${patched !== origSrc}`);
P('');

// 落盘 + 子进程重载
const tmpFile = path.join(ROOT, 'src', 'index.r292-patched.js');
fs.writeFileSync(tmpFile, patched);
// 取其 normalize/discriminate：需重新 require 同一模块名，故用 delete cache + 改路径
let patchedIdx;
try {
  patchedIdx = require(tmpFile);
} catch (e) { P('require 补丁版失败: ' + e.message); }

// ── 差分 ──
const dimsOf = (r) => {
  const o = new Set();
  if (r && Array.isArray(r.trace)) for (const t of r.trace) if (t && t.dimension && t.dimension !== '_normalization') o.add(t.dimension);
  if (r && Array.isArray(r.findings)) for (const f of r.findings) if (f && f.dimension) o.add(f.dimension);
  return [...o];
};
let nBlock = 0, nLost = 0, same = 0;
const newDims = {}, lostDims = {};
for (const s of samples) {
  let a1, a2, d1, d2;
  try { const r = idx.discriminate ? idx.discriminate(s) : idx.gate(s); a1 = (r.gate && r.gate.action) || r.action; d1 = dimsOf(r); } catch (_) { a1 = 'ERR'; d1 = []; }
  try { const r = patchedIdx.discriminate ? patchedIdx.discriminate(s) : patchedIdx.gate(s); a2 = (r.gate && r.gate.action) || r.action; d2 = dimsOf(r); } catch (_) { a2 = 'ERR'; d2 = []; }
  const f1 = a1 !== 'pass', f2 = a2 !== 'pass';
  if (!f1 && f2) { nBlock++; for (const d of d2) newDims[d] = (newDims[d] || 0) + 1; }
  else if (f1 && !f2) { nLost++; for (const d of d1) lostDims[d] = (lostDims[d] || 0) + 1; }
  else same++;
}
fs.unlinkSync(tmpFile);
P(`样本: ${samples.length}`);
P(`  判词不变: ${same}`);
P(`  新增拦截: ${nBlock}`);
P(`  丢失拦截: ${nLost}`);
if (nBlock) { P('  新增维度:'); for (const [d, n] of Object.entries(newDims).sort((a, b) => b[1] - a[1])) P(`    ${d}: ${n}`); }
if (nLost) { P('  丢失维度:'); for (const [d, n] of Object.entries(lostDims).sort((a, b) => b[1] - a[1])) P(`    ${d}: ${n}`); }
P('');
P('判定：nLost=0 且 nBlock>0 → 修法 A 可行；nLost>0 → 修法 A 同样引入回归。');
