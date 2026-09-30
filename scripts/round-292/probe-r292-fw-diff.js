/**
 * r292 探针 4：全角标点版语料差分（坐实跨形态不对称面积）
 *
 * bench97 语料 0 分裂 → 因为语料本身就是半角标点，覆盖不到「用户输入全角标点」场景。
 * 反向差分：把半角标点换成全角，再跑
 *   路径A: gate(全角文本)          —— 无 NFKC 的假设路径（模式库直接看全角）
 *   路径B: gate(NFKC(全角文本))    —— 真实路径（pipeline 入口先折叠）
 *   A 拦 / B 放 = 真跨形态漏判。
 *
 * 语料来源：test/ 下所有 .test.js 里的中文字符串字面量。
 * 安全纪律：原文全程不进模型上下文，只输出统计数字。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const gateMod = require(path.join(ROOT, 'src/gate.js'));

function pipeNormalize(input) {
  if (typeof input !== 'string') return input;
  if (/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) {
    return input.normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  }
  return input;
}

// ── 1. 从 test/ 提取中文样本 ──
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const CJK = /[\u4e00-\u9fff]/;
function extractZhStrings(src) {
  const out = [];
  // 双引号 / 单引号字符串（排除模板串，避免 ${} 干扰）
  for (const [q] of [['"'], ["'"]]) {
    const re = new RegExp(q + '([^' + q + '\\\\\\n]{12,300})' + q, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      const s = m[1];
      if (!CJK.test(s)) continue;
      if (s.includes('\\\\u')) continue;
      out.push(s);
    }
  }
  return out;
}

const samples = new Set();
for (const f of walk(path.join(ROOT, 'test'))) {
  const src = fs.readFileSync(f, 'utf8');
  for (const s of extractZhStrings(src)) samples.add(s);
}

const P = (...a) => console.log(...a);
const list = [...samples];
P('══════ r292 探针 4：全角标点语料差分 ══════');
P(`提取中文样本: ${list.length} 条（去重）\n`);

// ── 2. 单向变形：半角标点 → 全角（仅在中文字符邻域内，避免破坏英文片段）──
function toFullWidth(s) {
  // 逐字符：如果该 ASCII 标点的左右任一侧 3 字符内有 CJK，则折成全角
  const map = { ',': '\uFF0C', '!': '\uFF01', '?': '\uFF1F', ':': '\uFF1A', ';': '\uFF1B' };
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (map[ch]) {
      const ctx = s.slice(Math.max(0, i - 3), i) + s.slice(i + 1, i + 4);
      if (CJK.test(ctx)) { out += map[ch]; continue; }
    }
    out += ch;
  }
  return out;
}

// ── 3. 差分 ──
let tested = 0, dropped = 0, gained = 0, noChange = 0;
const dropDims = {};
const dropSources = [];
for (const s of list) {
  const fw = toFullWidth(s);
  if (fw === s) continue;              // 无可变形标点
  tested++;
  let a1, d1;
  try { const r = gateMod.gate(fw); a1 = r.gate.action; d1 = dimsOf(r); } catch (_) { a1 = 'ERROR'; d1 = []; }
  let a2;
  try { const r = gateMod.gate(pipeNormalize(fw)); a2 = r.gate.action; } catch (_) { a2 = 'ERROR'; }
  const f1 = a1 !== 'pass', f2 = a2 !== 'pass';
  if (f1 && !f2) {
    dropped++;
    for (const d of d1) dropDims[d] = (dropDims[d] || 0) + 1;
    if (dropSources.length < 12) dropSources.push({ dims: d1, action: a1, marker: s.length });
  } else if (!f1 && f2) gained++;
  else if (a1 === a2) noChange++;
}
P(`可变形样本（含半角标点且邻域有中文）: ${tested}`);
P('');
P(`── 差分结果 ──`);
P(`  两路径一致: ${noChange + (tested - dropped - gained - noChange)}`);
P(`  【A拦 B放】跨形态漏判: ${dropped}   ← 这是缺口`);
P(`  【A放 B拦】变形后新增拦截: ${gained}`);
P('');
if (dropped) {
  P('── 漏判按维度汇总 ──');
  for (const [d, n] of Object.entries(dropDims).sort((a, b) => b[1] - a[1])) P(`  ${d}: ${n}`);
  P('');
  P('── 漏判样本定位（只给长度标记，原文在 test/ 里）──');
  for (const s of dropSources) P(`  len=${s.marker} action=${s.action} dims=${s.dims.join('/')}`);
}
P('');
P('结论：dropped > 0 即证明 pipeline 入口 NFKC 与模式库全角钩子存在系统性不对称。');

function dimsOf(r) {
  const out = new Set();
  if (r && Array.isArray(r.trace)) for (const t of r.trace) if (t && t.dimension && t.dimension !== '_normalization') out.add(t.dimension);
  if (r && Array.isArray(r.findings)) for (const f of r.findings) if (f && f.dimension) out.add(f.dimension);
  return [...out];
}
