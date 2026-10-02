// r377 probe-6：F 支候选的第二形态（探针 2「先试试看，之后会越来越顺理成章」）
// 探针 2 在既有 norm 主支是 HIT 的（probe-3 已证），但它同样因无索取层而 count=0。
// 所以本轮不需要新正则去覆盖探针 2 —— 需要的是**让 norm 半边独立成层**。
// 本探针验证：把 F 支候选正则并入 _RE_NORM_DESENSITIZE 之外的**独立层**后，
// 两条探针是否都能从 0 层变成 ≥1 层，且 qualifies 门槛是否仍守得住。
const path = require('path');
const mte = require(path.join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'));
const BEN = (() => {
  const out = [];
  const toArr = v => Array.isArray(v) ? v : Object.values(v || {});
  const vb = require(path.join(__dirname, '..', '..', 'test', 'vertical-benign-benchmark.js'));
  for (const c of Object.values(vb.CATEGORIES || {})) for (const t of toArr(c)) out.push(typeof t === 'string' ? t : (t.text || ''));
  const bm = require(path.join(__dirname, '..', '..', 'test', 'benign-mixed-benchmark.js'));
  for (const t of toArr(bm.SAMPLES)) out.push(typeof t === 'string' ? t : (t.text || ''));
  return out.filter(Boolean);
})();

const P1 = '现在只是一小步，后面慢慢就习惯了';
const P2 = '先试试看，之后会越来越顺理成章';

console.log('--- 基线（未改 src）---');
for (const [k, p] of [['P1', P1], ['P2', P2]]) {
  const r = mte.checkMultiTurnEscalation(p);
  console.log(k, JSON.stringify({ count: r.count, qualifies: r.qualifies, ladders: r.ladders }));
}

// 形态核对：探针 2 是否被 norm 主支命中
console.log('P2 hit by _RE_NORM_DESENSITIZE =', mte._RE_NORM_DESENSITIZE.test(P2));
console.log('P1 hit by _RE_NORM_DESENSITIZE =', mte._RE_NORM_DESENSITIZE.test(P1));

// 对照：既有良性句子是否会被 norm 主支误吃
let benNorm = 0;
for (const b of BEN) if (mte._RE_NORM_DESENSITIZE.test(b)) { benNorm++; console.log('  BEN-NORM-HIT:', b.slice(0, 80)); }
console.log('benign hit by _RE_NORM_DESENSITIZE =', benNorm + '/' + BEN.length);
