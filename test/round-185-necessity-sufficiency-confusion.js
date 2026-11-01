/**
 * test/round-185-necessity-sufficiency-confusion.js — 第 183 维度
 * necessity_sufficiency_confusion（条件角色混淆：必要条件↔充分条件反向使用）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（诸腿俱在但被正确
 *      豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量（同族 ≥5 攻击变体全部
 * gate.action 非 pass，≥5 良性全部 pass）。
 */
const assert = require('assert');
const { checkNecessitySufficiencyConfusion } = require('../src/necessity-sufficiency-confusion.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
// 路线1（必要→充分）：必要条件宣称 × 充分性结论
const ATTACK_R1_ZH = [
  '努力是成功的必要条件，所以只要努力就能成功。',
  '信任是团队合作的前提，因此只要把信任建立起来，合作自然水到渠成。',
  '没有人民支持就没有革命的胜利，所以只要赢得了人民支持，胜利就唾手可得。',
  '唯有每天复盘才能进步，可见只要坚持复盘，进步就不成问题。',
  '睡眠是记忆巩固的保障，所以睡眠问题一解决，成绩自然不在话下。',
  '努力是成功的必要条件，所以努力也是成功的充分条件。',   // 直接翻转型结论
];
// 路线2（充分→必要）：充分条件宣称 × 必要性结论
const ATTACK_R2_ZH = [
  '天赋是夺冠的充分条件，所以没有天赋就夺不了冠。',
  '努力足以换来回报，所以不努力就没有回报。',
];
const ATTACK_EN = [
  'Trust is necessary for cooperation, so once trust is in place, cooperation will follow automatically.',
  'A degree is a prerequisite for this role, so a degree alone qualifies you.',
  'This certificate is a guarantee of employment, so without it you cannot be hired.',
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '努力是成功的必要条件，但努力不是充分条件，还需要方法、机遇和时代红利。', // 正确区分角色
  '氧气是燃烧的必要条件，但只有氧气还不够，还得有可燃物和达到燃点。',       // 无充分结论腿
  '战争是多因共同造成的，资源争夺只是必要条件之一。',                     // 正确多因陈述（边缘良性）
  '没有健康就没有一切，所以我们要坚持锻炼。',                             // 结论是行动建议
  '水分是植物生长的必要条件，阳光、温度和土壤同样缺一不可。',             // 多必要条件并列
  '及格是毕业的必要条件，所以不及格就不能毕业。',                         // 必要条件的正向使用
  '没有健康就没有幸福。只要有钱就能幸福，所以没钱就不可能幸福。',         // 两句并列无推断词连接
  '老师讲了必要条件和充分条件的区别，这是形式逻辑的基础概念。',           // 概念/教学转述
  'X是Y的充分条件，所以只要X就能Y。',                                     // 同向复用（反向宣称抑制）
  '信任是合作的前提，也是合作的充分条件，所以只要有了信任就能合作。',     // 双角色宣称（反向宣称抑制）
  '当且仅当努力是成功的必要条件时，成功才完全由努力决定，所以只要努力就能成功。', // 双条件
  '信任是合作的前提，所以只要有了信任就能合作——这是很多人的误解。',       // 拒绝推断（指出方向无效）
  '努力是成功的必要条件，所以只要努力就可能成功。',                       // 对冲
  'Trust is necessary for cooperation, but trust alone is not enough.',   // EN 正确区分角色
  'Water is a prerequisite for life, so we must conserve water.',         // EN 无充分结论腿
  '只要明天不下雨，我们就去爬山。',                                       // 普通条件句无角色宣称
];

console.log('\n[round-185 necessity_sufficiency_confusion] 正向：攻击命中 / 良性放行');
t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_R1_ZH.concat(ATTACK_R2_ZH, ATTACK_EN)) {
    const r = checkNecessitySufficiencyConfusion(s);
    assert.ok(r.hit, '未命中: ' + s);
  }
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    const r = checkNecessitySufficiencyConfusion(s);
    assert.ok(!r.hit, '误命中: ' + s);
  }
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 NEC_CLAIM_ZH 后路线1攻击停火', () => {
  for (const s of ATTACK_R1_ZH) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { NEC_CLAIM_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SUF_CLAIM_ZH 后路线2攻击停火', () => {
  for (const s of ATTACK_R2_ZH) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { SUF_CLAIM_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SUF_CONCL_ZH 后路线1停火', () => {
  for (const s of ATTACK_R1_ZH) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { SUF_CONCL_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 NEC_CONCL_ZH 后路线2停火', () => {
  for (const s of ATTACK_R2_ZH) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { NEC_CONCL_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 INFER_FWD_ZH+INFER_BWD_ZH（连接推断词全空）后中文攻击停火', () => {
  for (const s of ATTACK_R1_ZH.concat(ATTACK_R2_ZH)) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { INFER_FWD_ZH: [], INFER_BWD_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 NEC_CLAIM_EN 后英文路线1停火', () => {
  for (const s of ['Trust is necessary for cooperation, so once trust is in place, cooperation will follow automatically.', 'A degree is a prerequisite for this role, so a degree alone qualifies you.']) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { NEC_CLAIM_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 SUF_CONCL_EN+NEC_CONCL_EN（结论腿全空）后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { SUF_CONCL_EN: [], NEC_CONCL_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 INFER_FWD_EN+INFER_BWD_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkNecessitySufficiencyConfusion(s, { INFER_FWD_EN: [], INFER_BWD_EN: [] }).hit, '仍命中: ' + s);
  }
});

console.log('\n[承重] 豁免腿：诸腿俱在的陷阱样本，抹掉对应豁免必须转为命中');
// 五条陷阱：宣称腿×结论腿×推断词俱在，各被一条豁免正确放行
const TRAP_SEP = '天赋是夺冠的必要条件，但天赋不是充分条件，所以只要有了天赋就能夺冠。';
const TRAP_NEG = '信任是合作的前提，所以只要有了信任就能合作——这是很多人的误解。';
const TRAP_HEDGE = '努力是成功的必要条件，所以只要努力就能成功，当然这只是可能的路径之一。';
const TRAP_BICOND = '当且仅当努力是成功的必要条件时，成功才完全由努力决定，所以只要努力就能成功。';
const TRAP_CONCEPT = '老师讲了：信任是合作的前提，所以只要有了信任就能合作，这就是把必要当充分。';
// 反向宣称抑制陷阱：双角色俱告，同向复用
const TRAP_SUPPRESS = '信任是合作的前提，也是合作的充分条件，所以只要有了信任就能合作。';
t('六条陷阱无注入时放行', () => {
  for (const s of [TRAP_SEP, TRAP_NEG, TRAP_HEDGE, TRAP_BICOND, TRAP_CONCEPT, TRAP_SUPPRESS]) {
    assert.ok(!checkNecessitySufficiencyConfusion(s).hit, '陷阱被误命中: ' + s);
  }
});
t('抹掉 EXEMPT_SEP_ZH 后正确区分角色陷阱转为命中', () => {
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_SEP, { EXEMPT_SEP_ZH: [] }).hit);
});
t('抹掉 EXEMPT_NEG_ZH 后拒绝推断陷阱转为命中', () => {
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_NEG, { EXEMPT_NEG_ZH: [] }).hit);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_HEDGE, { EXEMPT_HEDGE_ZH: [] }).hit);
});
t('抹掉 EXEMPT_BICOND_ZH 后双条件陷阱转为命中', () => {
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_BICOND, { EXEMPT_BICOND_ZH: [] }).hit);
});
t('抹掉 EXEMPT_CONCEPT_ZH 后概念教学陷阱转为命中', () => {
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_CONCEPT, { EXEMPT_CONCEPT_ZH: [] }).hit);
});
t('反向宣称抑制承重：抹掉 SUF_CLAIM_ZH 后双角色陷阱转为命中', () => {
  // 「X是Y的前提，也是Y的充分条件，所以只要X就能Y」本因充分宣称在场
  // （同向复用）而放行；抹掉充分宣称腿后必须转为命中——证明抑制逻辑
  // 真的在承重，而不是碰巧没有宣称腿。
  assert.ok(!checkNecessitySufficiencyConfusion(TRAP_SUPPRESS).hit);
  assert.ok(checkNecessitySufficiencyConfusion(TRAP_SUPPRESS, { SUF_CLAIM_ZH: [] }).hit);
});

console.log('\n[变体矩阵] 真实 gate() 复量（161 轮教训：负例全绿≠不漏）');
// 同族攻击变体：中英双语 / 裸名词 / 带修饰 / 倒装 / 长句
const VARIANT_ATTACK = [
  '努力是成功的必要条件，所以只要努力就能成功。',                       // 基准形
  '信任是合作的前提，所以只要有了信任，合作就不成问题。',                 // 裸名词形
  '长期的、可验证的信任是任何深度团队协作得以发生的必要条件，因此只要把这种信任建立起来，深度协作自然水到渠成。', // 带修饰+长句
  '只要努力就能成功，因为努力是成功的必要条件。',                       // 倒装（结论先行+因为）
  '在这个项目里，持续的信任积累是整个团队能够高效协作的必要条件，所以只要把信任建设这一件事做好，团队的高效协作自然就不成问题了。', // 长句
  'A degree is a prerequisite for this role, so a degree alone qualifies you.', // EN
];
// 同族良性（含边缘良性：正确多因陈述 / 必要条件正向使用 / 双角色同向复用）
const VARIANT_BENIGN = [
  '战争是多因共同造成的，资源争夺只是必要条件之一，不能简单归结为某一个因素。', // 边缘良性：正确多因
  '及格是毕业的必要条件，所以不及格就不能毕业。',                         // 边缘良性：必要条件正向使用
  '水分是植物生长的必要条件，阳光、温度和土壤同样缺一不可。',             // 多必要条件并列
  '信任是合作的前提，也是合作的充分条件，所以只要有了信任就能合作。',     // 双角色同向复用
  'Water is a prerequisite for life, so we must conserve water.',         // EN 良性
];
t('变体矩阵：≥5 攻击变体全部 gate.action 非 pass', () => {
  assert.ok(VARIANT_ATTACK.length >= 5, '攻击变体不足 5 个');
  for (const s of VARIANT_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '变体未拦截: ' + s + ' → ' + r.gate.action);
  }
});
t('变体矩阵：≥5 良性样本全部 gate.action = pass', () => {
  assert.ok(VARIANT_BENIGN.length >= 5, '良性样本不足 5 个');
  for (const s of VARIANT_BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '良性被误拦: ' + s + ' → ' + r.gate.action + ' / ' + JSON.stringify(r.findings && r.findings.map(f => f.dimension)));
  }
});
t('新维度在 gate 结果中可读（findings/checked_by 至少一处可见）', () => {
  const r = gate('努力是成功的必要条件，所以只要努力就能成功。');
  const inFindings = (r.findings || []).some(f => f.dimension === 'necessity_sufficiency_confusion');
  const inChecked = (r.checked_by || []).some(c => c.layer === 'necessity_sufficiency_confusion');
  assert.ok(inFindings || inChecked, 'gate 结果中读不到 necessity_sufficiency_confusion');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
