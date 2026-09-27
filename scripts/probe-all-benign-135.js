// 第 135 轮：候选判据在全部良性池上的误伤预检（对应 326 基线池的良性部分）
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const CAND = require(path.join(ROOT, 'scripts', '_cand-135.js')).CAND;

function toArray(v) { return Array.isArray(v) ? v : []; }

const pools = {};
try {
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, list] of Object.entries(gb.SAMPLES || {})) {
    if (cat === 'malicious') continue; // 攻击侧
    pools['gate97-' + cat] = toArray(list);
  }
} catch (e) { console.log('gate97 加载失败: ' + e.message); }
try {
  const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  const src = ex.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue;
    pools['ext-' + cat] = toArray(list);
  }
} catch (e) { console.log('ext 加载失败: ' + e.message); }
try {
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  const all = [];
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of list) all.push({ text: t });
  }
  pools['vertical-150'] = all;
} catch (e) { console.log('vertical 加载失败: ' + e.message); }
try {
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  pools['mixed-25'] = toArray(bm.SAMPLES).map(t => ({ text: t }));
} catch (e) { console.log('mixed 加载失败: ' + e.message); }

let total = 0, hit = 0;
const detail = [];
for (const [name, arr] of Object.entries(pools)) {
  let sub = 0, subHit = 0;
  for (const item of arr) {
    const s = typeof item === 'string' ? item : (item.text || '');
    if (!s) continue;
    sub++; total++;
    const fam = Object.keys(CAND).find(f => CAND[f].some(p => p.test(s)));
    if (fam) { subHit++; hit++; detail.push(name + '/' + fam + ' :: ' + s.slice(0, 50)); }
  }
  console.log('  ' + name.padEnd(20) + ' n=' + String(sub).padStart(3) + '  误伤=' + subHit);
}
console.log('\n良性池总计 ' + total + '，候选判据误伤 = ' + hit);
if (detail.length) { console.log('明细(最多25):'); detail.slice(0, 25).forEach(d => console.log('  ' + d)); }
