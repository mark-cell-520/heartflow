/**
 * test/round-210-uncertainty-weaponization.js — 第 207 维度
 * uncertainty_weaponization（证据确定性要挟 / perfect-evidence demand）
 * 负例注入测试 + 变体矩阵。
 *
 * 辨别的族：拿**证据的暂不完整**（尚无定论/证据不足/不是100%确凿/仍无共
 * 识）直接推出**行动的阻挠**（没必要/不应/暂缓/为时过早），把「还不全
 * 知」偷换成「行动尚未获准」。判据：腿① UNCERTAIN 不确定性宣告 × 腿②
 * BLOCK 行动阻挠（邻近窗）；另设 R2 完美证据分支（除非百分之百证实否则
 * 不能启动…）。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另
 * 在 variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action
 * 非 pass 且 uncertainty_weaponization 维度承重，≥5 良性全部 pass）。
 * 枚举刻意收裸词形态（没有定论/证据不足/存疑 去前后缀仍命中）。
 *
 * r210 修绿：变体矩阵实测发现 EN 正则的 '? 只认直引号，真实文本（网页/
 * Word 复制）的 isn’t（U+2019）整条漏判——模块入口加智能引号归一
 * （U+2018/U+2019/U+02BC/U+2032 → 直引号），属补强（只增匹配不删）。
 */
const assert = require('assert');
const { checkUncertaintyWeaponization } = require('../src/uncertainty-weaponization.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文 R1×4 / 中文 R2×1 / 英文 R1×2 / 英文 R2×1）────────
const ATTACK = [
  '科学上还没有定论，所以没必要急于采取干预措施。',                    // R1 zh：尚无定论 × 没必要采取干预
  '证据不是百分之百确凿，就不能采取任何防范措施。',                    // R1 zh：不是100%确凿 × 不能采取防范
  '因果关系尚未证实，因此无需整改，现阶段应当暂缓。',                  // R1 zh 长句：尚未证实 × 无需整改/暂缓
  '在拿到更确凿的数据之前，不宜推行新的调控政策。',                    // R1 zh 倒装：在…确凿之前 × 不宜推行
  '除非百分之百证实，否则不能启动任何干预。',                          // R2 zh：完美证据要求
  "The science isn't settled, so there's no reason to act.",          // R1 en：not settled × no reason to act
  'There is no conclusive data yet, so no action is warranted right now.', // R1 en：no conclusive × no action warranted
  'Only once we have 100% proof should we roll out any measures.',     // R2 en：only once 100% proof
];

// ─── 良性样本（让步-防护 / 宣示暂缓 / 预防原则 / 概念转述 / 疑问 / 无关）─
const BENIGN = [
  '虽然还没有定论，但预防原则要求我们先做好防范。',                    // 让步-防护：虽无定论但仍防护
  '证据尚未确凿之前，暂不公布结论，以免误导公众。',                    // 宣示型暂缓：等定论再公布（正确程序）
  '虽无共识，我们仍应边研究边加强监测与防护。',                        // 预防原则/并行行动：边研究边防护
  '「不确定性武器化」是一种常见的论证谬误，要学会识别。',              // 概念/教学转述
  '没有定论就不管了吗？这正是需要警惕的推理。',                        // 疑问句：质疑该谬误本身
  'The evidence is still inconclusive, yet we must act on the precautionary principle.', // EN 预防原则
  'We should wait until the facts are confirmed before announcing any conclusion.',      // EN 宣示暂缓
  '战争是多因共同造成的，不能简单归因于单一因素。',                    // 无关良性（必须 pass）
];

t('攻击样本全部命中（checkUncertaintyWeaponization）', () => {
  for (const s of ATTACK) {
    const r = checkUncertaintyWeaponization(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkUncertaintyWeaponization）', () => {
  for (const s of BENIGN) {
    const r = checkUncertaintyWeaponization(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── 负例注入承重（逐常量验证承重）─────────────────────────────────
const R1_ZH = [
  '科学上还没有定论，所以没必要急于采取干预措施。',
  '证据不是百分之百确凿，就不能采取任何防范措施。',
];
const R1_EN = [
  "The science isn't settled, so there's no reason to act.",
  'There is no conclusive data yet, so no action is warranted right now.',
];

t('注入 UNCERTAIN_ZH=[] → 中文腿①攻击停止命中', () => {
  for (const s of R1_ZH) {
    assert.ok(checkUncertaintyWeaponization(s).hit, '无注入应命中: ' + s.slice(0, 18));
    assert.ok(!checkUncertaintyWeaponization(s, { UNCERTAIN_ZH: [] }).hit, 'UNCERTAIN_ZH 承重: ' + s.slice(0, 18));
  }
});

t('注入 BLOCK_ZH=[] → 中文腿②攻击停止命中', () => {
  for (const s of R1_ZH) {
    assert.ok(!checkUncertaintyWeaponization(s, { BLOCK_ZH: [] }).hit, 'BLOCK_ZH 承重: ' + s.slice(0, 18));
  }
});

t('注入 UNCERTAIN_EN=[] → 英文腿①攻击停止命中', () => {
  for (const s of R1_EN) {
    assert.ok(checkUncertaintyWeaponization(s).hit, '无注入应命中: ' + s.slice(0, 18));
    assert.ok(!checkUncertaintyWeaponization(s, { UNCERTAIN_EN: [] }).hit, 'UNCERTAIN_EN 承重: ' + s.slice(0, 18));
  }
});

t('注入 BLOCK_EN=[] → 英文腿②攻击停止命中', () => {
  for (const s of R1_EN) {
    assert.ok(!checkUncertaintyWeaponization(s, { BLOCK_EN: [] }).hit, 'BLOCK_EN 承重: ' + s.slice(0, 18));
  }
});

t('注入 PERFECT_ZH=[] → R2 完美证据攻击停止命中', () => {
  const s = '除非百分之百证实，否则不能启动任何干预。';
  assert.ok(checkUncertaintyWeaponization(s).hit, '无注入应命中');
  assert.ok(!checkUncertaintyWeaponization(s, { PERFECT_ZH: [] }).hit, 'PERFECT_ZH 承重');
});

t('注入 PERFECT_EN=[] → R2 EN 完美证据攻击停止命中', () => {
  const s = 'Only once we have 100% proof should we roll out any measures.';
  assert.ok(checkUncertaintyWeaponization(s).hit, '无注入应命中');
  assert.ok(!checkUncertaintyWeaponization(s, { PERFECT_EN: [] }).hit, 'PERFECT_EN 承重');
});

t('注入 EXEMPT_META_ZH=[] → 概念转述陷阱转为命中（豁免承重）', () => {
  const trap = '所谓「没定论就别干预」的不确定性武器化，本质是拿证据不足当作没必要采取行动的借口。';
  assert.ok(!checkUncertaintyWeaponization(trap).hit, '无注入应被豁免');
  assert.ok(checkUncertaintyWeaponization(trap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});

t('注入 EXEMPT_CONCESSION_ZH=[] → 让步-防护陷阱转为命中（豁免承重）', () => {
  const trap = '虽然证据暂时不足，本不应贸然干预，但我们要把现有防护坚持做好。';
  assert.ok(!checkUncertaintyWeaponization(trap).hit, '无注入应被豁免');
  assert.ok(checkUncertaintyWeaponization(trap, { EXEMPT_CONCESSION_ZH: [] }).hit, 'EXEMPT_CONCESSION_ZH 承重');
});

t('注入 EXEMPT_DECLARATIVE_ZH=[] → 宣示暂缓陷阱转为命中（豁免承重）', () => {
  // 该陷阱同时含腿①+腿②（会走 R1），但整句落在宣示型暂缓豁免射程内
  // （证据确凿之前暂不公布+不干预）；抹掉豁免后 R1 承重命中。
  const trap = '在证据确凿之前，暂不发布处理结果，免得引起误解。';
  assert.ok(!checkUncertaintyWeaponization(trap).hit, '无注入应被豁免');
  assert.ok(checkUncertaintyWeaponization(trap, { EXEMPT_DECLARATIVE_ZH: [] }).hit, 'EXEMPT_DECLARATIVE_ZH 承重');
});

// ─── 变体矩阵（真实 gate() 复量——负例测试之外的强制项）─────────────
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 uncertainty_weaponization 承重', () => {
  const variants = [
    '科学上还没有定论，所以没必要急于采取干预措施。',
    '证据不是百分之百确凿，就不能采取任何防范措施。',
    '除非百分之百证实，否则不能启动任何干预。',
    '在拿到更确凿的数据之前，不宜推行新的调控政策。',
    "The science isn't settled, so there's no reason to act.",
    'There is no conclusive data yet, so no action is warranted right now.',
    'Only once we have 100% proof should we roll out any measures.',
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'uncertainty_weaponization');
    assert.ok(f, 'uncertainty_weaponization 维度应承重: ' + s.slice(0, 24));
  }
});

t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '虽然还没有定论，但预防原则要求我们先做好防范。',
    '证据尚未确凿之前，暂不公布结论，以免误导公众。',
    '「不确定性武器化」是一种常见的论证谬误，要学会识别。',
    'The evidence is still inconclusive, yet we must act on the precautionary principle.',
    '虽无共识，我们仍应边研究边加强监测与防护。',
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-210 uncertainty_weaponization: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
