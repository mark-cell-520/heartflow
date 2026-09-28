// 轮 201：全维度同源叠票系统性扫描器（第 132 轮区间交集法的通用化）
//
// 做什么：
//   对每个 shield 模块 / 每个维度，取其 findings 的 severity 分布，检测
//   「同一批词/同一文本片段被多个判据族重复计数」的形状，输出候选族对。
//   方法分两层：
//     ① trigger 区间交集 —— 各族 finding 的 trigger 在归一化文本中的字符
//        区间是否真正重叠（同片段叠票，第 132 轮方法）；
//     ② 词层面交叠 —— 若两族的 trigger 共享同一批实词（同义词表叠票，
//        第 130/131/141/142/200 五轮的形状）。
//
// 只报告不改源码：是否折叠必须逐对过攻击池 + 良性池验证后才动。
const path = require('path');
const fs = require('fs');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

// ── 良性与攻击语料（只从 test 目录读，不在本文件内联原文） ──────────
const DIST_DIR = path.join(ROOT, 'test');
function loadArrays(file) {
  const src = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');
  const out = [];
  const re = /const\s+([A-Z0-9_]+)\s*=\s*(\[[\s\S]*?\]);/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    try {
      const arr = eval('(' + m[2] + ')');
      if (Array.isArray(arr) && arr.every(x => typeof x === 'string')) out.push({ name: m[1], arr });
    } catch (_) { /* 跳过非数组常量 */ }
  }
  return out;
}

const corpora = [];
for (const f of ['ai-writing-tell-co-occurrence.test.js', 'ai-writing-tell-multilang-r141.test.js']) {
  for (const g of loadArrays(f)) corpora.push({ src: f, ...g });
}
// 补充：benign-mixed 基准里的中英混排良性
try {
  const bm = require(path.join(DIST_DIR, 'benign-mixed-benchmark.js'));
  const arr = (bm.SAMPLES || []).map(x => typeof x === 'string' ? x : x.text);
  if (arr.length) corpora.push({ src: 'benign-mixed-benchmark', name: 'MIXED_BENIGN', arr });
} catch (_) { /* 可选 */ }

console.log(`语料源 ${corpora.length} 组 / 共 ${corpora.reduce((a, c) => a + c.arr.length, 0)} 条`);

// ── 维度 × 族的 trigger 收集 ──────────────────────────────
// gate 的结果里 findings[].dimension 形如 'ai-tell-<fam>' 或维度名。
// 我们要看的是：同一次 detect 里，哪些族的 trigger 指向同一文本片段。
const awt = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));

function famOf(f) { return String(f.dimension || '').replace(/^ai-tell-/, ''); }

// 所有语料里出现过的「族组合」→ 命中次数
const combos = new Map(); // key: fam1|fam2 → count
const sameFrag = new Map(); // 同片段族对 → count
const famHits = new Map();

for (const c of corpora) {
  for (const text of c.arr) {
    let r;
    try { r = awt.detect(text); } catch (_) { continue; }
    const byFam = new Map(); // fam → triggers[]
    for (const f of r.findings || []) {
      const fam = famOf(f);
      if (!byFam.has(fam)) byFam.set(fam, []);
      byFam.get(fam).push(f.trigger || '');
      famHits.set(fam, (famHits.get(fam) || 0) + 1);
    }
    const fams = [...byFam.keys()].sort();
    for (let i = 0; i < fams.length; i++) {
      for (let j = i + 1; j < fams.length; j++) {
        const key = `${fams[i]}|${fams[j]}`;
        combos.set(key, (combos.get(key) || 0) + 1);
        // 同片段判定：两个族的 trigger 字符串逐字相同（忽略大小写/空白）
        const A = new Set(byFam.get(fams[i]).map(s => s.toLowerCase().trim()));
        for (const t2 of byFam.get(fams[j])) {
          if (A.has(String(t2).toLowerCase().trim())) {
            const sk = `${fams[i]}|${fams[j]}`;
            sameFrag.set(sk, (sameFrag.get(sk) || 0) + 1);
          }
        }
      }
    }
  }
}

const rows = [...combos.entries()].map(([k, n]) => [k, n, sameFrag.get(k) || 0]);
rows.sort((a, b) => b[1] - a[1]);
console.log('\n=== 同现族对 Top 25（count / 其中同片段数）===');
rows.slice(0, 25).forEach(([k, n, sf]) => console.log(`  ${k.padEnd(46)} ${String(n).padStart(3)} / ${sf}`));
console.log('\n=== 有同片段叠票的族对（优先复查）===');
rows.filter(r => r[2] > 0).forEach(([k, n, sf]) => console.log(`  ${k.padEnd(46)} 同现 ${n} / 同片段 ${sf}`));
console.log('\n=== 族命中总数 ===');
[...famHits.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k.padEnd(30)} ${n}`));

// ── 词层面同源：跨维度判据的词表字面交叠检测 ─────────────
// 做法：读 src/shield/*.js 的词表常量，两两算集合交集（只报交集中有实词的）
const SHIELD_DIR = path.join(ROOT, 'src/shield');
const wordListRe = /(?:const|let)\s+([A-Z0-9_]+)\s*=\s*(?:new Set\()?\[([\s\S]*?)\](?:\))?\s*;/g;
const tables = {};
for (const f of fs.readdirSync(SHIELD_DIR).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(SHIELD_DIR, f), 'utf8');
  let m;
  // 只看「ASCII 单词串」型词表：'...' 里不含中文/正则元字符，长度 3~40
  const local = wordListRe;
  local.lastIndex = 0;
  while ((m = local.exec(src)) !== null) {
    const body = m[2];
    const words = (body.match(/'[^']{3,40}'/g) || [])
      .map(s => s.slice(1, -1).toLowerCase())
      .filter(w => /^[a-z][a-z0-9 -]*$/.test(w));
    if (words.length >= 6) tables[`${f}:${m[1]}`] = new Set(words);
  }
}
console.log(`\n=== 词表层 ${Object.keys(tables).length} 张（>=6 个纯英文词）===`);
for (const k of Object.keys(tables)) console.log(`  ${k} = ${tables[k].size} 词`);
const tk = Object.keys(tables);
const overlap = [];
for (let i = 0; i < tk.length; i++) {
  for (let j = i + 1; j < tk.length; j++) {
    let n = 0;
    for (const w of tables[tk[i]]) if (tables[tk[j]].has(w)) n++;
    if (n >= 4) overlap.push([tk[i], tk[j], n, tables[tk[i]].size, tables[tk[j]].size]);
  }
}
overlap.sort((a, b) => b[2] - a[2]);
console.log('\n=== 跨常量字面交集（>=4 词的候选同源对）===');
if (!overlap.length) console.log('  （无）');
overlap.forEach(([a, b, n, sa, sb]) =>
  console.log(`  交集 ${String(n).padStart(2)}  ${a} (${sa}) × ${b} (${sb})`));
