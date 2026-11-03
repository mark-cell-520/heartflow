/**
 * test/round-208-scale-dismissal.js — 第 205 维度
 * scale_dismissal（规模 dismiss：拿小规模/低占比注销风险与伤害的处置
 * 必要性——小规模低占比腿×风险 dismiss 腿两腿结构 + 「忽略不计」融
 * 合分支）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免
 *      的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良
 * 性另在 variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部
 * gate.action 非 pass 且 scale_dismissal 维度承重，≥5 良性全部
 * pass）。本族枚举刻意收裸词形态（个别/极少数/区区/忽略不计 去后缀
 * 仍命中）；「忽略不计」单式同时含小规模与 dismiss（融合分支）。
 *
 * 立项证据：r208 族探针（/tmp/hf-probe-r208.js + /tmp/hf-probe-r208b.js）
 * 在当前引擎（v6.8.136，204 维）复测——12 个候选族逐族实测，
 * scale_dismissal 族攻击样本 8/8 gate.action=pass（真零命中，含中英
 * 双语、裸名词、带修饰、倒装、长句变体）、良性 4/4 pass（零误伤）；
 * 次优候选 token_gesture 7/8、burden_inversion 7/8、silence_as_consent
 * 4/8。与 selective_minimization（过错定级降级）/harm_invalidation（具体
 * 伤害抹除）边界实测：本族 8/8 攻击样本它们零命中。外部搜索
 * （HN Algolia / Semantic Scholar ×2 429 / GitHub API ×2）无可用纯规则
 * 实现，如实记录——判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkScaleDismissal } = require('../src/scale-dismissal.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×7 / 英文×4 / 含裸名词、带修饰、倒装、长句）──────
const ATTACK = [
  '才死了几个人，这点风险根本不值得大惊小怪。',                          // 才+几个 + 不值得大惊小怪
  '不过是个别案例，影响范围有限，没必要上纲上线。',                        // 个别（裸名词）+ 没必要上纲上线
  '就几起故障，占比不到千分之一，忽略不计，没必要为它调整方案。',            // 占比不到 + 忽略不计融合分支
  '区区几个家庭的损失，比起宏大叙事不值一提。',                            // 区区 + 不值一提
  '这么小的比例，完全不值得为它调整方案。',                                // 倒装（限定词前置）+ 不值得调整
  '区区小事一桩，何必放在心上。',                                          // 区区 + 小事一桩
  '才两起投诉，翻篇吧，不要再提了。',                                      // 才两起 + 翻篇
  'Only a handful of users are affected, so this is not a big deal.',      // EN only a handful + not a big deal
  'A few incidents out of millions — statistically negligible, so we can move on.', // EN a few out of millions + move on
  'The error affects only a tiny fraction of users, which is not worth the fuss.', // EN tiny fraction + not worth the fuss
  'Only a few deaths out of millions of cases — no need to panic.',        // EN a few deaths + no need to panic
];

// ─── 良性样本（边缘良性：让步转折/测量语境/统计报告/概念批判）─────────
const BENIGN = [
  '事故率虽低，但单次后果严重，仍需要防控。',                                // 边缘良性：让步转折
  '受影响用户占比不大，但每一起客诉都要闭环处理。',                          // 边缘良性：让步转折（占比不大但都要闭环）
  '舍入误差在允许范围内，可忽略不计。',                                      // 边缘良性：统计测量语境
  '绝对数量小不代表风险小，我们按最坏情况做预案。',                          // 边缘良性：否定守卫 + 规模与处置分开
  '证据表明该不良反应发生率低于万分之一，属临床可接受范围。',                // 边缘良性：统计报告止步（缺 dismiss 腿）
  '把个别案例说成「没什么大不了」是典型的极小化谬误。',                      // 边缘良性：概念批判转述
  'Although only a few users complained, it is not worth panicking, but every ticket is still investigated.', // EN 让步转折
  'The rounding error is negligible for this calculation.',                 // EN 测量语境
];

t('攻击样本全部命中（checkScaleDismissal）', () => {
  for (const s of ATTACK) {
    const r = checkScaleDismissal(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkScaleDismissal）', () => {
  for (const s of BENIGN) {
    const r = checkScaleDismissal(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── 负例注入承重（r161 纪律：逐常量验证承重）──────────────────────
t('注入 SMALL_ZH=[] → 中文两腿攻击停止命中', () => {
  // 选无融合分支样本（忽略不计 两腿同源，不测 SMALL_ZH 单独承重）
  const twoLeg = [
    '才死了几个人，这点风险根本不值得大惊小怪。',
    '区区几个家庭的损失，比起宏大叙事不值一提。',
  ];
  for (const s of twoLeg) {
    assert.ok(checkScaleDismissal(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkScaleDismissal(s, { SMALL_ZH: [] }).hit, 'SMALL_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 DISMISS_ZH=[] → 中文 dismiss 腿攻击停止命中', () => {
  const twoLeg = [
    '才死了几个人，这点风险根本不值得大惊小怪。',
    '不过是个别案例，影响范围有限，没必要上纲上线。',
  ];
  for (const s of twoLeg) {
    assert.ok(!checkScaleDismissal(s, { DISMISS_ZH: [] }).hit, 'DISMISS_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 SMALL_EN=[] → 英文两腿攻击停止命中', () => {
  const twoLeg = [
    'Only a handful of users are affected, so this is not a big deal.',
    'The error affects only a tiny fraction of users, which is not worth the fuss.',
  ];
  for (const s of twoLeg) {
    assert.ok(checkScaleDismissal(s).hit, '无注入应命中: ' + s);
    assert.ok(!checkScaleDismissal(s, { SMALL_EN: [] }).hit, 'SMALL_EN 承重: ' + s.slice(0, 20));
  }
});

t('注入 DISMISS_EN=[] → 英文 dismiss 腿攻击停止命中', () => {
  const twoLeg = [
    'Only a handful of users are affected, so this is not a big deal.',
    'Only a few deaths out of millions of cases — no need to panic.',
  ];
  for (const s of twoLeg) {
    assert.ok(!checkScaleDismissal(s, { DISMISS_EN: [] }).hit, 'DISMISS_EN 承重: ' + s.slice(0, 20));
  }
});

t('注入 EXEMPT_CONCESSION_ZH=[] → 让步转折陷阱转为命中（豁免承重）', () => {
  const trap = '这次故障占比不高，但没必要大惊小怪，更不能不处理。';
  assert.ok(!checkScaleDismissal(trap).hit, '无注入应被豁免');
  assert.ok(checkScaleDismissal(trap, { EXEMPT_CONCESSION_ZH: [] }).hit, 'EXEMPT_CONCESSION_ZH 承重');
});

t('注入 EXEMPT_CONCESSION_EN=[] → 英文让步转折陷阱转为命中（豁免承重）', () => {
  const trap = 'Although the defect rate is less than one in a thousand, we still recall the batch rather than moving on.';
  assert.ok(!checkScaleDismissal(trap).hit, '无注入应被豁免');
  assert.ok(checkScaleDismissal(trap, { EXEMPT_CONCESSION_EN: [] }).hit, 'EXEMPT_CONCESSION_EN 承重');
});

t('注入 EXEMPT_MEASURE_ZH=[] → 测量语境陷阱转为命中（豁免承重）', () => {
  const trap = '舍入误差在允许范围内，可忽略不计。';
  assert.ok(!checkScaleDismissal(trap).hit, '无注入应被豁免');
  assert.ok(checkScaleDismissal(trap, { EXEMPT_MEASURE_ZH: [] }).hit, 'EXEMPT_MEASURE_ZH 承重');
});

t('注入 EXEMPT_MEASURE_EN=[] → 英文测量语境陷阱转为命中（豁免承重）', () => {
  const trap = 'Rounding error is negligible, so we can ignore it.';
  assert.ok(!checkScaleDismissal(trap).hit, '无注入应被豁免');
  assert.ok(checkScaleDismissal(trap, { EXEMPT_MEASURE_EN: [] }).hit, 'EXEMPT_MEASURE_EN 承重');
});

t('注入 EXEMPT_META_ZH=[] → 概念批判陷阱转为命中（豁免承重）', () => {
  const trap = '把个别案例说成「没什么大不了」是典型的极小化谬误。';
  assert.ok(!checkScaleDismissal(trap).hit, '无注入应被豁免');
  assert.ok(checkScaleDismissal(trap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});

// ─── 变体矩阵（真实 gate() 复量——负例测试之外的强制项）─────────────
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 scale_dismissal 承重', () => {
  const variants = [
    '才死了几个人，这点风险根本不值得大惊小怪。',                        // 裸名词 + 带修饰
    '不过是个别案例，影响范围有限，没必要上纲上线。',                      // 裸名词（个别）
    '就几起故障，占比不到千分之一，忽略不计，没必要为它调整方案。',          // 长句 + 融合分支
    '区区几个家庭的损失，比起宏大叙事不值一提。',                          // 区区 + 成语化 dismiss
    'Only a handful of users are affected, so this is not a big deal.',   // EN 裸词
    'A few incidents out of millions — statistically negligible, so we can move on.', // EN 长句
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'scale_dismissal');
    assert.ok(f, 'scale_dismissal 维度应承重: ' + s.slice(0, 24));
  }
});

t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '事故率虽低，但单次后果严重，仍需要防控。',                            // 边缘良性：让步转折
    '受影响用户占比不大，但每一起客诉都要闭环处理。',                        // 边缘良性：让步转折
    '舍入误差在允许范围内，可忽略不计。',                                  // 边缘良性：测量语境
    '证据表明该不良反应发生率低于万分之一，属临床可接受范围。',              // 边缘良性：统计报告止步
    'The rounding error is negligible for this calculation.',             // EN 测量语境
    'Although the defect rate is less than one in a thousand, we still recall the batch rather than moving on.', // EN 让步转折
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-208 scale_dismissal: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
