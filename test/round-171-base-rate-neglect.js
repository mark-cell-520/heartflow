/**
 * test/round-171-base-rate-neglect.js — 第 169 维度 base_rate_neglect
 * （基础概率忽视）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组/空正则后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（双腿俱在但被正确
 *      豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkBaseRateNeglect } = require('../src/base-rate-neglect.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
const ATTACK_ZH = [
  '你检测呈阳性，所以你几乎肯定得了这个病。',                 // 依赖 SIGNAL_ZH + CONFIDENT_ZH
  '他符合嫌疑人的画像，因此他八成就是罪犯。',
  '系统算法把你标记成高风险对象，这意味着你很可能是欺诈用户。',
  '测谎仪显示他在说谎，所以他显然是有罪的。',
];
const ATTACK_EN = [
  'The test came back positive, so you almost certainly have the disease.', // SIGNAL_EN + CONFIDENT_EN
  'The algorithm flagged you, which means you are probably a fraud.',
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '鉴于这种罕见病的患病率很低，即便是筛查阳性也需要进一步确认。',   // 基础概率 + 待确认
  '虽然检测是阳性，但假阳性率不低，不能仅凭一次阳性就下结论。',     // 假阳性率 + 不断言
  '系统标记只是第一步初筛，大多数标记最终都是误报。',               // 无高置信度结论
  '嫌疑人符合画像只是调查线索，还需要其他证据才能锁定。',           // 边缘良性：有画像词但正确存疑
  '指纹匹配只是辅助证据，不能据此断定嫌疑人就是罪犯。',             // 有匹配词但无模态结论
  'You tested positive; the doctor ordered a follow-up test to confirm.', // EN 待确认
  'A positive screen does not mean you have it — the base rate is very low.', // EN 基础概率
];

console.log('\n[round-171 base_rate_neglect] 正向：攻击命中 / 良性放行');
t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = checkBaseRateNeglect(s);
    assert.ok(r.hit, '未命中: ' + s);
  }
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    const r = checkBaseRateNeglect(s);
    assert.ok(!r.hit, '误命中: ' + s);
  }
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
// 抹掉 SIGNAL_ZH → 中文攻击全部停火（它们都靠 SIGNAL_ZH）
t('注入空 SIGNAL_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkBaseRateNeglect(s, { SIGNAL_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 CONFIDENT_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkBaseRateNeglect(s, { CONFIDENT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SIGNAL_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkBaseRateNeglect(s, { SIGNAL_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 CONFIDENT_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkBaseRateNeglect(s, { CONFIDENT_EN: [] }).hit, '仍命中: ' + s);
  }
});

console.log('\n[承重] 豁免腿：双腿俱在的陷阱样本，抹掉对应豁免必须转为命中');
// 两条陷阱：都有 SIGNAL + CONFIDENT，但各被一条豁免正确放行
const TRAP_BASERATE = '筛查呈阳性，但鉴于该病在人群中的患病率极低，所以你几乎肯定没有得它。';
const TRAP_NOOVERCLAIM = '血检呈阳性，你八成是感染了，但仍需进一步复查才能确认。';
t('两条陷阱无注入时放行', () => {
  for (const s of [TRAP_BASERATE, TRAP_NOOVERCLAIM]) {
    assert.ok(!checkBaseRateNeglect(s).hit, '陷阱被误命中: ' + s);
  }
});
t('抹掉 EXEMPT_BASERATE_ZH 后基础概率陷阱转为命中', () => {
  assert.ok(checkBaseRateNeglect(TRAP_BASERATE, { EXEMPT_BASERATE_ZH: [] }).hit);
});
t('抹掉 EXEMPT_NOOVERCLAIM_ZH 后待确认陷阱转为命中', () => {
  assert.ok(checkBaseRateNeglect(TRAP_NOOVERCLAIM, { EXEMPT_NOOVERCLAIM_ZH: [] }).hit);
});

console.log('\n[变体矩阵] 真实 gate()：攻击非 pass / 良性 pass（161 轮强制项）');
// 同族 ≥5 攻击变体（中英、裸名词、带修饰、倒装、长句）
const MATRIX_ATTACK = [
  '你检测呈阳性，所以你几乎肯定得了这个病。',
  '筛查结果呈阳性，你铁定感染了病毒。',
  '样本核酸检测呈阳性，几乎可以确定你已经确诊感染。',
  '系统算法把你标记成了高风险匹配对象，这意味着你很可能是欺诈用户。',
  '他完全符合在逃嫌疑人的画像，因此他显然就是罪犯。',
  '测谎仪显示他在说谎，所以他八成是有罪的。',
  'The test came back positive, so you almost certainly have the disease.',
  'The algorithm flagged you, which means you are probably a fraud.',
  'He matches the profile, so he is very likely guilty.',
];
// 边缘良性 ≥5（含「战争是多因」式正确概率陈述的对应物）
const MATRIX_BENIGN = [
  '鉴于这种罕见病的患病率很低，即便是筛查阳性也需要进一步确认。',
  '虽然检测是阳性，但假阳性率不低，不能仅凭一次阳性就下结论。',
  '系统标记只是第一步初筛，大多数标记最终都是误报。',
  '嫌疑人符合画像只是调查线索，还需要其他证据才能锁定。',
  '指纹匹配只是辅助证据，不能据此断定嫌疑人就是罪犯。',
  'You tested positive; the doctor ordered a follow-up test to confirm.',
  'A positive screen does not mean you have it — the base rate is very low.',
];
t('变体矩阵：全部攻击 gate.action 非 pass', () => {
  for (const s of MATRIX_ATTACK) {
    const a = gate(s).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击被判 pass: ' + s);
  }
});
t('变体矩阵：全部良性 gate.action = pass', () => {
  for (const s of MATRIX_BENIGN) {
    const a = gate(s).gate.action;
    assert.strictEqual(a, 'pass', '良性被拦(action=' + a + '): ' + s);
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
