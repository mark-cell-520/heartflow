// 轮 201：ai_writing_tell 在**全量良性基准**（双向门禁的 326 条同源语料）上的
// 同源叠票系统性扫描。第 132 轮区间交集法只用了 51 条自建池，覆盖面太窄；
// 本探针把门禁的四类良性基准（gate-97 benign/technical/pedagogical/borderline、
// extended multilingual/longtext/mixed、vertical 150、mixed 25）全部过一遍。
//
// 只输出：被计分样本数、族组合、族对同现次数。不输出样本原文。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const BENCH = path.join(ROOT, 'test');
const awt = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));

function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
function textOf(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }

const sets = [];
try {
  const gb = require(path.join(BENCH, 'gate-benchmark.js'));
  for (const [cat, v] of Object.entries(gb.SAMPLES || {})) {
    const arr = toArray(v);
    if (arr.length) sets.push({ key: `gate-97.${cat}`, arr });
  }
} catch (e) { console.log('load gate-97 fail', e.message); }
try {
  const ex = require(path.join(BENCH, 'gate-benchmark-extended.js'));
  for (const [cat, v] of Object.entries(ex.SAMPLES || {})) {
    const arr = toArray(v);
    if (arr.length) sets.push({ key: `ext.${cat}`, arr });
  }
} catch (e) { console.log('load ext fail', e.message); }
try {
  const vb = require(path.join(BENCH, 'vertical-benign-benchmark.js'));
  const arr = [];
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of list) arr.push(t);
  }
  if (arr.length) sets.push({ key: 'vertical.all', arr });
} catch (e) { console.log('load vertical fail', e.message); }
try {
  const bm = require(path.join(BENCH, 'benign-mixed-benchmark.js'));
  const arr = (bm.SAMPLES || []).map(textOf).filter(Boolean);
  if (arr.length) sets.push({ key: 'benign-mixed', arr });
} catch (e) { console.log('load mixed fail', e.message); }

console.log(`语料组 ${sets.length} / 总 ${sets.reduce((a, s) => a + s.arr.length, 0)} 条\n`);

const scoredCombos = new Map();   // 归一化族组合 → 次数
const famPair = new Map();        // 族对 → 同现次数（仅在计分样本里）
let scored = 0, total = 0;
const perSet = [];

for (const s of sets) {
  let setScored = 0;
  for (const raw of s.arr) {
    const text = textOf(raw);
    if (!text) continue;
    total++;
    let r;
    try { r = awt.detect(text); } catch (_) { continue; }
    if (!(r.score > 0)) continue;
    setScored++; scored++;
    // 归一化族：复用 detect 的归一化纪律
    const fams = new Set();
    for (const f of r.findings || []) {
      const fam = String(f.dimension || '').replace(/^ai-tell-/, '');
      if (['tier1', 'tier2', 'tier3', 'transitions'].includes(fam)) fams.add('vocab-discourse');
      else if (['formulaic-openers', 'generic-conclusions'].includes(fam)) fams.add('templated-frames');
      else fams.add(fam);
    }
    const key = [...fams].sort().join('+');
    scoredCombos.set(key, (scoredCombos.get(key) || 0) + 1);
    const list = [...fams].sort();
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const pk = `${list[i]}|${list[j]}`;
        famPair.set(pk, (famPair.get(pk) || 0) + 1);
      }
  }
  perSet.push([s.key, s.arr.length, setScored]);
}

console.log('=== 各语料组被 awt 计分条数 ===');
perSet.forEach(([k, n, sc]) => console.log(`  ${k.padEnd(22)} ${sc}/${n}`));
console.log(`\n合计被计分 ${scored}/${total}\n`);

console.log('=== 被计分样本的归一化族组合 ===');
[...scoredCombos.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) =>
  console.log(`  ${String(n).padStart(3)}  ${k}`));

console.log('\n=== 族对同现 Top 20 ===');
[...famPair.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, n]) =>
  console.log(`  ${String(n).padStart(3)}  ${k}`));
