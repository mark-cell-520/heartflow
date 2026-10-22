/**
 * r292 探针 6：维度级（非 gate 级）全角/半角差分
 *
 * 探针 3/4 都跑 gate 级判词，得 0 分裂。但 gate 级判词是「多维度聚合 + 阈值」
 * 之后的产物，单维度漏判可能被其他维度垫住而不显形。
 * 而且探针 4 的样本来自 test/ 全量字符串 —— 绝大多数是 gate 会 pass 的良性句，
 * 等于在白名单里找缺口，灵敏度天然低下。
 *
 * 本探针直接测维度层：对每个样本跑 discriminate，比对
 *   ppScore(全角文本) vs ppScore(NFKC(全角文本))
 * 只要有任一维度分数差 > 0，就是跨形态不对称的实锤。
 *
 * 安全纪律：只输出维度名/差值/总数，不输出任何中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src/gate.js'));

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

const CJK = /[\u4e00-\u9fff]/;
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}
function extractZhStrings(src) {
  const out = [];
  for (const q of ['"', "'"]) {
    const re = new RegExp(q + '([^' + q + '\\\\\\n]{12,300})' + q, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      if (!CJK.test(m[1]) || m[1].includes('\\\\u')) continue;
      out.push(m[1]);
    }
  }
  return out;
}
function toFullWidth(s) {
  const map = { ',': '\uFF0C', '!': '\uFF01', '?': '\uFF1F', ':': '\uFF1A', ';': '\uFF1B' };
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (map[s[i]] && CJK.test(s.slice(Math.max(0, i - 3), i) + s.slice(i + 1, i + 4))) { out += map[s[i]]; continue; }
    out += s[i];
  }
  return out;
}

// dimension-level score extraction：discriminate 返回形态探测
function getDimScores(result) {
  if (!result || typeof result !== 'object') return null;
  // 形态 A: { dimensions: { name: {score} } }
  if (result.dimensions && typeof result.dimensions === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(result.dimensions)) {
      if (v && typeof v === 'object' && typeof v.score === 'number') o[k] = v.score;
    }
    return Object.keys(o).length ? o : null;
  }
  // 形态 B: { scores: { name: number } }
  if (result.scores && typeof result.scores === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(result.scores)) if (typeof v === 'number') o[k] = v;
    return Object.keys(o).length ? o : null;
  }
  return null;
}

const samples = new Set();
for (const f of walk(path.join(ROOT, 'test'))) {
  for (const s of extractZhStrings(fs.readFileSync(f, 'utf8'))) samples.add(s);
}
const list = [...samples].map(s => ({ orig: s, fw: toFullWidth(s) })).filter(x => x.fw !== x.orig);

const P = (...a) => console.log(...a);
P('══════ r292 探针 6：维度级全角/半角差分 ══════');
P(`全角化后: ${list.length} 条样本\n`);

// 探 discriminate 返回形态
const probe = gateMod.discriminate ? gateMod.discriminate(list[0].fw) : null;
P(`discriminate 返回顶层键: ${Object.keys(probe || {}).slice(0, 12).join(', ')}`);
const sc = getDimScores(probe);
P(`可提取维度分数: ${sc ? Object.keys(sc).length + ' 个' : 'null — 需换提取法'}\n`);

let tested = 0, unstable = 0, errors = 0;
const perDim = {};
const detailByDim = {};
for (const x of list) {
  const A = gateMod.discriminate ? gateMod.discriminate(x.fw) : null;
  const B = gateMod.discriminate ? gateMod.discriminate(pipeNormalize(x.fw)) : null;
  if (!A || !B) { errors++; continue; }
  tested++;
  const sA = getDimScores(A), sB = getDimScores(B);
  if (!sA || !sB) { errors++; continue; }
  let bad = false;
  for (const k of Object.keys(sA)) {
    const d = Math.abs((sA[k] || 0) - (sB[k] || 0));
    if (d > 1e-9) {
      bad = true;
      perDim[k] = (perDim[k] || 0) + 1;
      if (!detailByDim[k]) detailByDim[k] = [];
      if (detailByDim[k].length < 5) detailByDim[k].push({ len: x.fw.length, delta: d });
    }
  }
  if (bad) unstable++;
}
P(`测试样本: ${tested}  (提取失败: ${errors})`);
P(`维度分数不稳定样本: ${unstable} / ${tested}\n`);
P('── 不稳定的维度（全角 vs NFKC 后半角分数不同）──');
for (const [k, n] of Object.entries(perDim).sort((a, b) => b[1] - a[1])) {
  P(`  ${k}: ${n} 条`);
  for (const d of detailByDim[k]) P(`     len=${d.len} 分差=${d.delta.toFixed(3)}`);
}
P('');
P(unstable > 0 ? '结论：维度层存在真实的跨形态不对称（模式库全角钩子 vs 入口 NFKC）。' : '结论：本样本集内未检出维度层不对称。');
