// 轮 201：把攻击侧语料也纳入 awt 扫描（全 378 条只覆盖良性侧）。
// 攻击侧 = gate-97.malicious + ext.adversarial + 既有 awt 攻击测试池。
// 目的：在确认「同源叠票是否还存在」时，需要同时知道折叠是否会塌掉攻击侧检出。
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

const sets = [];
const gb = require(path.join(BENCH, 'gate-benchmark.js'));
if ((gb.SAMPLES || {}).malicious) sets.push({ key: 'gate-97.malicious', arr: toArray(gb.SAMPLES.malicious) });
const ex = require(path.join(BENCH, 'gate-benchmark-extended.js'));
if ((ex.SAMPLES || {}).adversarial) sets.push({ key: 'ext.adversarial', arr: toArray(ex.SAMPLES.adversarial) });

// 从 awt 相关测试文件里抓攻击池常量（数组形态的常量）
for (const f of ['ai-writing-tell-co-occurrence.test.js',
                 'ai-writing-tell-templated-frames-round132-guard.test.js',
                 'ai-writing-tell-vocab-tier-round130-guard.test.js',
                 'ai-writing-tell-multilang-r141.test.js',
                 'ai-writing-tell-negative-real-world.js'].filter(x =>
                   require('fs').existsSync(path.join(BENCH, x)))) {
  const src = require('fs').readFileSync(path.join(BENCH, f), 'utf8');
  const re = /const\s+([A-Z0-9_]+)\s*=\s*(\[[\s\S]*?\]);/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    try {
      const v = eval('(' + m[2] + ')');
      if (Array.isArray(v) && v.length >= 3 && v.every(x => typeof x === 'string')) {
        sets.push({ key: `${f}:${m[1]}`, arr: v });
      }
    } catch (_) { /* 跳过 */ }
  }
}

console.log(`攻击侧语料组 ${sets.length}\n`);
let scored = 0, total = 0;
const combos = new Map();
const perSet = [];
for (const s of sets) {
  let sc = 0;
  for (const raw of s.arr) {
    const text = typeof raw === 'string' ? raw : (raw && raw.text) || '';
    if (!text) continue;
    total++;
    let r;
    try { r = awt.detect(text); } catch (_) { continue; }
    if (!(r.score > 0)) continue;
    sc++; scored++;
    const fams = new Set();
    for (const f of r.findings || []) {
      const fam = String(f.dimension || '').replace(/^ai-tell-/, '');
      if (['tier1', 'tier2', 'tier3', 'transitions'].includes(fam)) fams.add('vocab-discourse');
      else if (['formulaic-openers', 'generic-conclusions'].includes(fam)) fams.add('templated-frames');
      else fams.add(fam);
    }
    const k = [...fams].sort().join('+');
    combos.set(k, (combos.get(k) || 0) + 1);
  }
  perSet.push([s.key, s.arr.length, sc]);
}
perSet.forEach(([k, n, sc]) => console.log(`  ${k.padEnd(56)} ${sc}/${n}`));
console.log(`\n攻击侧被 awt 计分 ${scored}/${total}`);
console.log('\n=== 族组合 ===');
[...combos.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) =>
  console.log(`  ${String(n).padStart(3)}  ${k}`));
