/**
 * r292 探针 11（决策）：把全角标点 NFKC 折叠并入 text-normalizer.normalize() 的影响面
 *
 * 已坐实的分裂（113 处实证）：
 *   gate() 直调 → discriminate(原文) → text-normalizer.normalize() 的
 *     toHalfWidthSafe **刻意不动中文标点** → 判别跑在全角标点上
 *   checkOutput() → runPipeline 入口 NFKC → 判别跑在半角标点上
 *   模式库大量否定类写成 `[^。，]`（只列全角逗号）→ 两路径判词分裂
 *
 * 候选修法 A：逐支给否定类补半角孪生（113 处）
 *   风险：否定类变窄 → 半角文本原本能跨过的 ',' 被挡住 → 降召回（回归）
 * 候选修法 B：在 normalize() 里补「全角标点 NFKC 折叠」
 *   效果：两路径统一为半角标点 → 不对称从根源消失（单点修复）
 *   风险：全局归一化行为变化，可能提升召回也可能新增误伤
 *
 * 本探针实测 B 的影响面：对 test/ 全量样本做「归一化前后 gate 判词」差分。
 * 只输出统计数字与码位，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const tn = require(path.join(ROOT, 'src/text-normalizer.js'));

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const CJK = /[\u4e00-\u9fff]/;
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}
function extractZhStrings(src) {
  const out = [];
  for (const q of ['"', "'"]) {
    const re = new RegExp(q + '([^' + q + '\\\\\\n]{12,300})' + q, 'g');
    let m;
    while ((m = re.exec(src)) !== null) if (CJK.test(m[1]) && !m[1].includes('\\\\u')) out.push(m[1]);
  }
  return out;
}
const P = (...a) => console.log(...a);

// ── 候选 B 的具体实现（模拟）：安全版全角标点折叠 ──
// 只折叠实测会 NFKC 折叠、且中文文本常用的标点。
// 明确不做：U+3002 句号（NFKC 本身不折）、U+3001 顿号（不折）、引号类
function fwPunctFold(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/[\uFF0C\uFF01\uFF1F\uFF1A\uFF1B\uFF08\uFF09\uFF0D\uFF5E]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

// ── 收集样本 ──
const samples = new Set();
for (const f of walk(path.join(ROOT, 'test'))) for (const s of extractZhStrings(fs.readFileSync(f, 'utf8'))) samples.add(s);
const list = [...samples];
P('══════ r292 探针 11：修法 B（normalize 补全角标点折叠）影响面 ══════');
P(`样本总数: ${list.length}\n`);

// 验证 monitor：确认 fwPunctFold 只作用于全角标点
const probeStr = list.find(s => /[\uFF0C\uFF01\uFF1F]/.test(s));
P(`fwPunctFold 自检: 折前含全角标点=${probeStr ? /[\uFF0C\uFF01\uFF1F]/.test(probeStr) : 'n/a'}  折后=${probeStr ? /[\uFF0C\uFF01\uFF1F]/.test(fwPunctFold(probeStr)) : 'n/a'}`);
P(`  （折后应为 false）\n`);

// ── 差分：现状 vs 修法 B ──
let newlyBlocked = 0, newlyPassed = 0, sameAction = 0, samePass = 0;
const newDims = {};
const lostList = [];
const SRC_INDEX = (() => {
  const idx = new Map();
  for (const f of walk(path.join(ROOT, 'test'))) {
    let si; try { si = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    for (const s of extractZhStrings(si)) if (!idx.has(s)) idx.set(s, path.relative(ROOT, f));
  }
  return idx;
})();
const srcOf = (s) => SRC_INDEX.get(s) || '(unknown)';
const dimsOf = (r) => {
  const o = new Set();
  if (r && Array.isArray(r.trace)) for (const t of r.trace) if (t && t.dimension && t.dimension !== '_normalization') o.add(t.dimension);
  if (r && Array.isArray(r.findings)) for (const f of r.findings) if (f && f.dimension) o.add(f.dimension);
  return [...o];
};

for (const s of list) {
  const folded = fwPunctFold(s);
  if (folded === s) { sameAction++; continue; }  // 无全角标点 → 修法 B 不改变任何东西
  let a1, d1, a2, d2;
  try { const r = gateMod.gate(s); a1 = r.gate.action; d1 = dimsOf(r); } catch (_) { a1 = 'ERR'; d1 = []; }
  try { const r = gateMod.gate(folded); a2 = r.gate.action; d2 = dimsOf(r); } catch (_) { a2 = 'ERR'; d2 = []; }
  const f1 = a1 !== 'pass', f2 = a2 !== 'pass';
  if (!f1 && f2) {
    newlyBlocked++;
    for (const d of d2) newDims[d] = (newDims[d] || 0) + 1;
  } else if (f1 && !f2) { newlyPassed++; if (lostList.length < 20) lostList.push({ action: a1, action2: a2, dims: d1, file: srcOf(s) }); }
  else if (f1 && f2) sameAction++;
  else samePass++;
}
P('── 差分结果（gate() 直调：全角 vs 折叠后半角）──');
P(`  修法 B 不改变（无全角标点）: ${sameAction + samePass - (sameAction - sameAction)}`);
P(`  原本就非 pass → 仍非 pass: ${sameAction}`);
P(`  原本 pass → 折叠后非 pass【新增拦截】: ${newlyBlocked}   ← 影响面`);
P(`  原本非 pass → 折叠后 pass【丢失拦截】: ${newlyPassed}   ← 回归风险`);
P('');
if (newlyBlocked) {
  P('── 新增拦截的维度分布 ──');
  for (const [d, n] of Object.entries(newDims).sort((a, b) => b[1] - a[1])) P(`  ${d}: ${n}`);
}
P('');
P(`结论：修法 B 会让 ${newlyBlocked} 条原本漏判的样本被捕获（正面），`);
P(`      代价是 ${newlyPassed} 条样本丢失拦截（若 >0 则不可接受）。`);
if (lostList.length) {
  P('');
  P('── 丢失拦截明细（定位到 test/ 文件，不输出原文）──');
  for (const l of lostList) P(`  ${l.file}  action=${l.action}→${l.action2}  dims=${l.dims.join('/')}`);
}
