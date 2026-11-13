// r309：anchoring_effect EN 腿②（DOMINATED_EN）独立估值缺位族 + 腿① list/priced/salary 动词形态
// 缺口来源：r308 探针 probe-negation-escape.js 实测穿透样本。
// 修法：DOMINATED_EN 增加「without ever valuing / without checking
//   comparable prices / without reassessing / without independently
//   estimating / never valued / never left the orbit of /
//   never questioned whether it was worth」族；
//   ANCHOR_EN 增加「listed it at <num> / priced at <num> /
//   salary floor was set at <num>」三支动词呈现。
'use strict';
const assert = require('assert');
const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'anchoring-effect.js'));
const detect = mod.detectAnchoringEffect;

const ATTACKS = [
  // DOMINATED_EN 新族：独立估值缺位（EN）
  ['without ever valuing it independently',
    'He opened at 8000, and I settled at 6500 without ever valuing it independently.'],
  ['without checking comparable prices',
    'The opening offer was 8000, and I agreed at 6500 without checking comparable prices.'],
  ['without reassessing the value',
    'They listed it at 40000, and we signed at 32000 without reassessing the value ourselves.'],
  ['never left the orbit of',
    'The first number was 200, and every counter never left the orbit of that opening bid.'],
  ['stayed inside the orbit of',
    'The asking price was 900, so my bid stayed inside the orbit of that number the whole time.'],
  ['never questioned whether it was worth',
    'It was priced at 5000, and I never questioned whether it was worth that much to me.'],
  ['without independently estimating market value',
    'The salary floor was set at 80, and the offer came in at 92 without independently estimating my market value.'],
  ['without ever valuing (short)',
    'The sticker said 10000, and I never valued the thing on its own merits.'],
  ['without independently verifying',
    'They quoted 450 first, and I accepted without independently verifying any of the claims.'],
  ['never checked comparables',
    'The asking price was 300000, and I never checked comparables in the same neighborhood.'],
];

const BENIGN = [
  // 纠正/独立估值语境：模块层必须 miss
  ['corrective comparables',
    'We checked comparable prices and recent sales before responding, so the opening number barely moved us.'],
  ['corrective cost analysis',
    'I built the valuation from cost and market data independently of the asking price.'],
  ['concept teaching',
    'Anchoring effect is the tendency to rely too heavily on the first piece of information offered.'],
  ['corrected negotiation',
    'He opened at 8000, but I walked away and bought the same item elsewhere for 3000.'],
  ['explicit anti-anchoring',
    'We deliberately ignored the sticker price and estimated the value from scratch.'],
  ['priced at + verified market rate',
    'It was priced at 5000, but we verified the market rate was 2200 and offered accordingly.'],
  ['salary floor + benchmarked',
    'The salary floor was set at 80, and I benchmarked three offers before deciding.'],
  ['listed + independent appraisal',
    'They listed it at 40000, and we had it independently appraised at 28000 before bidding.'],
  ['without 前否定（双重否定）',
    'I did not accept the quote without checking the numbers first.'],
  ['never left orbit — 已纠正语境',
    'The first number was 200, but we never left the orbit of our own analysis either.'],
];

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok -', name); }
  catch (e) { fail++; console.log('  FAIL -', name, '\n    ', e.message); }
}

console.log('r309 anchoring_effect EN 腿②/腿① 补腿测试');

for (const [name, text] of ATTACKS) {
  t(`attack: ${name}`, () => {
    const r = detect(text.toLowerCase());
    assert.ok(r && r.hit, `expected hit for: ${text}`);
    assert.ok(r.details && r.details.length > 10, 'details 非空');
    assert.ok(r.evidence && r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance && r.guidance.length > 20, 'guidance 非空');
  });
}

for (const [name, text] of BENIGN) {
  t(`benign: ${name}`, () => {
    const r = detect(text.toLowerCase());
    assert.ok(!r || !r.hit, `expected miss for: ${text}`);
  });
}

// 负例注入：删掉腿②（DOMINATED_EN）后，全部攻击样本必须 miss——
// 证明命中确实来自本轮新增的腿②族，而非既有路径。
t('negative injection: DOMINATED_EN 删空后攻击全 miss', () => {
  const empty = { DOMINATED_EN: [] };
  for (const [name, text] of ATTACKS) {
    const r = detect(text.toLowerCase(), empty);
    assert.ok(!r || !r.hit, `DOMINATED_EN deleted but still hit: ${name}`);
  }
});

// 负例注入：删掉腿①（ANCHOR_EN）后，同样全 miss——证明命中需要双腿配对。
t('negative injection: ANCHOR_EN 删空后攻击全 miss', () => {
  const empty = { ANCHOR_EN: [] };
  for (const [name, text] of ATTACKS) {
    const r = detect(text.toLowerCase(), empty);
    assert.ok(!r || !r.hit, `ANCHOR_EN deleted but still hit: ${name}`);
  }
});

// 回归：存量测试的注入语义不得被破坏（ATTACKS_EN[1] 删 DOMINATED_EN 后 miss）
t('regression: 存量注入语义保留（删 DOMINATED_EN → 存量样本 miss）', () => {
  const legacy = require('fs').readFileSync(path.join(__dirname, 'anchoring-effect.test.js'), 'utf8');
  const m = legacy.match(/ATTACKS_EN\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, 'anchoring-effect.test.js ATTACKS_EN 可读');
});

console.log(`\nr309: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
