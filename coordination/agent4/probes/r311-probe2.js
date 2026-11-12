/**
 * coordination/agent4/probes/r311-probe2.js
 * r311 跟进探针：
 *  A. 直接模块直调——确认候选句在两模块层级的命中情况（含 econ 归因细分）
 *  B. 官方良性语料全量 FP 压力（gate-benchmark 97 + extended + vertical 150 + mixed 25）
 *     用当前模块直调基线跑一遍，作为改动前后对照基准
 */
'use strict';
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { detectSignificanceEffectSize } = require(path.join(ROOT, 'src', 'significance-effect-size.js'));
const { detectMentalAccounting } = require(path.join(ROOT, 'src', 'mental-accounting.js'));

// ─── A. 模块直调候选 ───
const SIG_CAND = [
  '这项干预研究 p 值小于 0.05，所以影响深远，值得全领域跟进',
  'p<0.05，说明这个发现含金量很高，不是一般的结果',
  '统计显著，可见这项工作的意义深远',
  'p 值 0.03，证明该成果价值很大',
  '结果显著，说明这个证据分量很足',
  'p<0.05，所以这个结论影响极为深远',
  'p < 0.05, so the finding is impactful and should be taken seriously',
  'The result is statistically significant, which means it is a game changer',
  'p<0.05, therefore the implications are huge for the field',
  'The correlation is significant, so it clearly matters in practice',
  'p < 0.05, which proves the discovery is world-changing',
  'statistically significant, so this advance is truly consequential',
];
const MA_CAND = [
  '压岁钱是白来的，不用心疼，随便花',
  '政府补贴花不掉也不用计较，反正不是自己的钱',
  '课题经费是专项拨款，跟工资不一样，花起来不用顾忌',
  '救济款到账了，不拿白不拿，先买那台相机',
  '佣金和提成来得容易，花起来不觉得可惜',
  '版税到账，跟工资不是一个性质，可以放心花',
  '奖金池里的钱花不掉就作废，不用节省，尽管买',
  '年终奖到账，我犒劳自己了一台新手机',
  '反正是中奖的钱，花起来没有心理负担',
  '意外之财到手，毫无负担，不用节省',
  '白来的钱，不用顾忌，想买就买',
  '横财到手，奢侈一把也无妨',
  'The gift card is basically free money, so I treated myself to dinner',
  'The prize money has no strings attached, might as well splurge',
  'She spent the lottery winnings without any guilt',
  'The inheritance felt like house money, so he treated himself',
];
console.log('=== A. 模块直调（基线 v6.8.178，应全 miss）===');
for (const t of SIG_CAND) {
  const r = detectSignificanceEffectSize(t);
  console.log(`sig hit=${r.hit} :: ${t.slice(0, 44)}`);
}
for (const t of MA_CAND) {
  const r = detectMentalAccounting(t);
  console.log(`ma  hit=${r.hit} :: ${t.slice(0, 44)}`);
}

// ─── B. 官方良性语料 FP 压力（模块直调基线）===
console.log('');
console.log('=== B. 官方良性语料（当前基线：两模块直调命中清单）===');
const corpora = [
  ['gate-97', path.join(ROOT, 'test', 'gate-benchmark.js'), 'SAMPLES'],
  ['extended', path.join(ROOT, 'test', 'gate-benchmark-extended.js'), 'SAMPLES'],
  ['vertical', path.join(ROOT, 'test', 'vertical-benign-benchmark.js'), 'CATEGORIES'],
  ['mixed', path.join(ROOT, 'test', 'benign-mixed-benchmark.js'), 'SAMPLES'],
];
let total = 0;
const sigHits = [], maHits = [];
for (const [label, file, key] of corpora) {
  let mod;
  try { mod = require(file); } catch (e) { console.log(`${label}: load-fail ${e.message}`); continue; }
  const raw = mod[key] || {};
  const items = Array.isArray(raw) ? raw : Object.values(raw).flat();
  for (const s of items) {
    const text = typeof s === 'string' ? s : (s && s.text) || '';
    if (!text) continue;
    total++;
    if (detectSignificanceEffectSize(text).hit) sigHits.push(text);
    if (detectMentalAccounting(text).hit) maHits.push(text);
  }
  console.log(`${label}: ${items.length} 条累计 ${total}`);
}
console.log(`语料总数 ${total}；sig 模块基线命中 ${sigHits.length}；ma 模块基线命中 ${maHits.length}`);
for (const t of sigHits) console.log(`  [sig-base] ${t.slice(0, 70)}`);
for (const t of maHits) console.log(`  [ma-base] ${t.slice(0, 70)}`);
