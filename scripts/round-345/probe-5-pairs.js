// r345 probe-5：诊断 contradiction 对「支持X但反行为X」族为何不命中。
// 拆到 CONTRADICTION_PAIRS 逐 pair 跑（从 index.js 静态提取，样本只在此出现）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const m = src.match(/const CONTRADICTION_PAIRS = \[([\s\S]*?)\n\];/);
if (!m) { console.log('CONTRADICTION_PAIRS 提取失败'); process.exit(1); }
const PAIRS = vm.runInNewContext('([' + m[1] + '])',
  { EN_CONTRADICTION_ANTONYMS: [['safe', 'dangerous']] });

const SAMPLES = [
  '我完全支持环保，不过每天开车浪费资源',
  '我完全支持环保，但我每天都浪费资源',
  '既要透明，又拒绝公开数据',
  '既说要透明，又拒绝公开数据',
  '说要透明，可从来没透明过',
  '既想涨薪，又不愿意加班',
  '我完全支持环保，不过开车很浪费',
  '支持环保却从不垃圾分类',
];

// 简化复刻 checkContradiction 的核心逻辑（positive 命中 + negative 确认）
function trial(pair, text) {
  const pos = pair.positive;
  let posMatch = null;
  if (Array.isArray(pos)) {
    for (const [a, b] of pos) {
      if (new RegExp('\\b' + a + '\\b', 'i').test(text) && new RegExp('\\b' + b + '\\b', 'i').test(text)) { posMatch = [a, b]; break; }
    }
  } else {
    const mm = text.match(pos);
    posMatch = mm ? mm[0] : null;
  }
  if (!posMatch) return null;
  const neg = pair.negative ? text.match(pair.negative) : null;
  return { pos: String(posMatch).slice(0, 30), neg: neg ? String(neg[0]).slice(0, 30) : null };
}

for (const s of SAMPLES) {
  const fired = [];
  PAIRS.forEach((p, i) => {
    const r = trial(p, s);
    if (r) fired.push(`pair${i + 1}(pos="${r.pos}",neg=${r.neg ? '"' + r.neg + '"' : 'null'})`);
  });
  console.log(`[${fired.length ? 'HIT' : 'pass'}] ${fired.join(' | ') || '—'}`);
}
console.log('\n--- gate 实际 ---');
for (const s of SAMPLES) console.log(gate.checkOutput(s).gate.action);
