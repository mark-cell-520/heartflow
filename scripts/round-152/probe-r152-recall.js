// 第 152 轮：召回侧复测 —— rh 双通道化对 52 条攻击样本的召回影响
// 铁律：召回 52/52 不得退化
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkRewardHacking } = require(path.join(ROOT, 'src', 'reward-hacking.js'));
const { normalize } = require(path.join(ROOT, 'src', 'text-normalizer.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const BENCH = path.join(ROOT, 'test');

function toArray(list) {
  if (!Array.isArray(list)) return [];
  return list.map(x => (typeof x === 'string' ? x : (x && (x.text || x.content)) || '')).filter(Boolean);
}

const attacks = [];
try {
  const b = require(path.join(BENCH, 'gate-benchmark.js'));
  const src = b.SAMPLES || b.samples || {};
  for (const [cat, list] of Object.entries(src)) {
    if (cat === 'malicious' || cat === 'adversarial') attacks.push(...toArray(list).map(t => ['gate-97:' + cat, t]));
  }
} catch (e) {}
try {
  const ex = require(path.join(BENCH, 'gate-benchmark-extended.js'));
  for (const t of toArray((ex.SAMPLES || {}).adversarial)) attacks.push(['ext:adversarial', t]);
} catch (e) {}

console.log('══════ 召回样本数: ' + attacks.length + ' ══════');

function dual(text, tieNorm) {
  const onOrig = checkRewardHacking(text);
  const n = normalize(text);
  if (!n.normalized || n.normalized === text) return onOrig;
  const onNorm = checkRewardHacking(n.normalized);
  const c = r => (r && typeof r.count === 'number') ? r.count : 0;
  return tieNorm ? (c(onNorm) >= c(onOrig) ? onNorm : onOrig)
                 : (c(onNorm) > c(onOrig) ? onNorm : onOrig);
}

let normCnt = 0, aCnt = 0, bCnt = 0;
const lost = [];
for (const [label, text] of attacks) {
  const n = checkRewardHacking(text).count;
  const a = dual(text, true).count;
  const b = dual(text, false).count;
  if (n > 0) normCnt++;
  if (a > 0) aCnt++;
  if (b > 0) bCnt++;
  if (n > 0 && a === 0) lost.push(['A', label, text]);
  if (n > 0 && b === 0) lost.push(['B', label, text]);
}
console.log('  现状 rh 命中: ' + normCnt + '/' + attacks.length);
console.log('  方案A(_dual 偏归一): ' + aCnt + '/' + attacks.length);
console.log('  方案B(偏原文):     ' + bCnt + '/' + attacks.length);
console.log('  丢失: ' + lost.length + ' 条');
for (const l of lost.slice(0, 10)) console.log('    [' + l[0] + '] ' + l[1] + ' | ' + l[2].slice(0, 60));
