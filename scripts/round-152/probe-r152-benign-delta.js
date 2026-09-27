// 第 152 轮：_dual 全局化 vs 现状 —— 全良性池误伤增量实测
// 复用双向门禁的全部样本集合（gate-97 + extended + 垂直150 + 中英混排25）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkRewardHacking } = require(path.join(ROOT, 'src', 'reward-hacking.js'));
const { normalize } = require(path.join(ROOT, 'src', 'text-normalizer.js'));
const BENCH = path.join(ROOT, 'test');

function toArray(list) {
  if (!Array.isArray(list)) return [];
  return list.map(x => (typeof x === 'string' ? x : (x && (x.text || x.content)) || '')).filter(Boolean);
}

// 汇总双向门禁的全部样本（含类别）
const all = [];
function addSet(label, samples) { for (const t of samples) all.push({ label, text: t }); }

try {
  const b = require(path.join(BENCH, 'gate-benchmark.js'));
  const src = b.SAMPLES || b.samples || {};
  for (const [cat, list] of Object.entries(src)) addSet('gate-97:' + cat, toArray(list));
} catch (e) { console.log('gate-97 加载失败: ' + e.message); }
try {
  const ex = require(path.join(BENCH, 'gate-benchmark-extended.js'));
  const src = ex.SAMPLES || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'adversarial') continue; // 攻击侧不算误伤
    addSet('ext:' + cat, toArray(list));
  }
} catch (e) { console.log('extended 加载失败: ' + e.message); }
try {
  const vb = require(path.join(BENCH, 'vertical-benign-benchmark.js'));
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) addSet('vert:' + cat, toArray(list));
} catch (e) { console.log('vertical 加载失败: ' + e.message); }
try {
  const bm = require(path.join(BENCH, 'benign-mixed-benchmark.js'));
  addSet('mixed25', bm.SAMPLES || []);
} catch (e) { console.log('mixed 加载失败: ' + e.message); }

console.log('══════ 全良性池载入 ══════');
console.log('  样本总数: ' + all.length);

function dualMax(text) {
  const onOrig = checkRewardHacking(text);
  const n = normalize(text);
  if (!n.normalized || n.normalized === text) return { A: onOrig, B: onOrig, onOrig, onNorm: onOrig };
  const onNorm = checkRewardHacking(n.normalized);
  const c = r => (r && typeof r.count === 'number') ? r.count : 0;
  // 方案 A：_dual 现有规则（count 相等偏归一化）
  const A = c(onNorm) >= c(onOrig) ? onNorm : onOrig;
  // 方案 B：count 相等偏原文（rh 通道保英文模式保真度）
  const B = c(onNorm) > c(onOrig) ? onNorm : onOrig;
  return { A, B, onOrig, onNorm };
}

let origHit = 0, aHit = 0, bHit = 0;
const aNew = [], bNew = [];
for (const s of all) {
  const { A, B, onOrig, onNorm } = dualMax(s.text);
  const o = onOrig.count > 0;
  if (o) origHit++;
  if (A.count > 0) aHit++;
  if (B.count > 0) bHit++;
  if (!o && A.count > 0) aNew.push(s);
  if (!o && B.count > 0) bNew.push(s);
}

console.log('\n══════ rh 层命中数（非 gate 层）══════');
console.log('  现状（只用归一化）: ' + origHit + '/' + all.length);
console.log('  方案 A（_dual 相等偏归一化）: ' + aHit + '/' + all.length + '  新增误伤: ' + aNew.length);
console.log('  方案 B（相等偏原文）: ' + bHit + '/' + all.length + '  新增误伤: ' + bNew.length);
for (const s of aNew.slice(0, 8)) console.log('    [A新增] ' + s.label + ' | ' + s.text.slice(0, 60));
for (const s of bNew.slice(0, 8)) console.log('    [B新增] ' + s.label + ' | ' + s.text.slice(0, 60));
