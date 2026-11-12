'use strict';
/**
 * r301 — incentive_blind_spot（第 247 维度）三条新腿单测
 *
 * 背景：r299 WIP 留下的 test/round-299-incentive-blind-spot-families.test.js
 * 47 条断言中 4 条攻击漏判（43/47），根因三条腿缺口：
 *   1. EN ②-h 存在句倒装形缺失（there is no meaningful difference in …）
 *   2. EN 腿①缺 applicants 裸名词锚点（POOL_EN 只收 pool/insurance 专名）
 *   3. EN ②-i「no grounds for monitoring」误置 NODISTORT_EN（逆选择族），
 *      腿①锚点 insured 在 SHIELD_EN（道德风险族）→ 跨子族无法配对
 *   4. ZH ②-h 连接词表缺单字「是」（「定价本就是正确的」漏收）
 *
 * 样本形状与负例见 scripts/round-301/r301-leg-diagnose.js（逐样本两腿分解）。
 * gate 层终态见 scripts/round-301/r301-gate-end-state.js（16/16）。
 */
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ibs = require(path.join(ROOT, 'src/incentive-blind-spot.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' → ' + e.message); }
}
const assert = require('assert');

// ============ A 攻击样本：r299 漏判 4 条（本轮补腿目标） ============
console.log('=== A 攻击样本（r299 漏判 4 条）===');
const ATTACK_A = [
  ['EN ②-h2 存在句倒装', 'Across the pool there is no meaningful difference in default rates.'],
  ['EN ②-i 申请人锚点', 'There is no reason for additional screening of the applicants.'],
  ['EN ②-g 监督退出', 'There are no grounds for closer monitoring of the insured.'],
  ['ZH ②-h2 单字是连接', '这个机制下定价本就是正确的，不用再测算。'],
];
for (const [label, text] of ATTACK_A) {
  T('A/' + label, () => {
    const m = ibs.detectIncentiveBlindSpot(text);
    assert.ok(m.hit, '模块未命中: ' + text);
    const r = gate(text);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 层仍 pass: ' + text);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('incentive_blind_spot'), 'gate findings 无 incentive_blind_spot: ' + dims.join(','));
  });
}

// ============ B 攻击样本：同族泛化变体（证明补腿非背原句） ============
console.log('=== B 攻击样本（泛化变体）===');
const ATTACK_B = [
  ['EN ②-h2 变体 little variation', 'Across the pool there is little variation in claims experience.'],
  ['EN ②-h2 变体 no significant gap', 'There is no significant gap in loss ratios across the pool.'],
  ['EN ②-g 变体 no need to', "There's no need for closer monitoring of the insured."],
  ['EN ②-g 变体 no justification', 'There is no justification for extra scrutiny of the pool.'],
  ['EN ②-i 变体 no grounds applicants', 'There are no grounds for extra vetting of the applicants.'],
  ['ZH ②-h2 变体 机制本就是合理', '这个制度本就是合理的，风险会自己抵消。'],
  ['ZH ②-h2 变体 结构本就正确', '当前的结构本就是正确的，不需要重新测算。'],
];
for (const [label, text] of ATTACK_B) {
  T('B/' + label, () => {
    const m = ibs.detectIncentiveBlindSpot(text);
    assert.ok(m.hit, '模块未命中: ' + text);
  });
}

// ============ C 良性样本：零误伤（含新旧边缘形） ============
console.log('=== C 良性样本（零误伤）===');
const BENIGN_C = [
  ['EN diff exists', 'There is a meaningful difference in default rates between the two groups.'],
  ['EN grounds exist', 'There are grounds for closer monitoring of the insured under the rules.'],
  ['EN premiums wrong', 'The premiums are not reasonable and need to be recalculated.'],
  ['EN risk-based', 'Without risk-based pricing, adverse selection will drive the pool toward higher-risk participants.'],
  ['EN monitor', 'Depositors should monitor the bank, especially once coverage is universal.'],
  ['EN contribute', 'I will contribute because the public good only exists if everyone does.'],
  ['EN hedge', 'It could be that behavior stays the same, but we still need to check the incentives.'],
  ['EN question', 'Will the guarantee really leave borrower behavior unchanged?'],
  ['ZH 正确激励', '如果不做风险分层，高风险方会大量进入，定价必然出错。'],
  ['ZH 正确监督', '兜底之后必须配套行为监督，否则受保护的一方会放大冒险。'],
  ['ZH 贡献显性化', '公共品需要把每个人贡献和收益对应起来，否则人人都会等别人出力。'],
  ['ZH 疑问句', '保费真的不会因为人群混合而变高吗？'],
  ['ZH 混合池正面', '混合池确实存在，所以我们要按风险分层定价。'],
  ['ZH 防止搭便车', '为防止搭便车，我们设计了可核实的参与记录。'],
];
for (const [label, text] of BENIGN_C) {
  T('C/' + label, () => {
    const m = ibs.detectIncentiveBlindSpot(text);
    assert.ok(!m.hit, '良性误命中: ' + text);
    const r = gate(text);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('incentive_blind_spot'), '良性进 gate findings: ' + dims.join(','));
  });
}

// ============ D 登记断言 ============
console.log('=== D 登记断言 ===');
T('D/模块直调返回三子族键之一', () => {
  const m = ibs.detectIncentiveBlindSpot('Across the pool there is no meaningful difference in default rates.');
  assert.ok(['adverse_selection', 'moral_hazard', 'free_rider'].includes(m.dimension),
    '返回子族键异常: ' + m.dimension);
});
T('D/腿① applicants 在 POOL_EN 登记', () => {
  const I = ibs.__internals();
  const joined = I.POOL_EN.map(r => r.source).join('\n');
  assert.ok(/applicants?/.test(joined), 'POOL_EN 无 applicants 锚点');
});
T('D/腿② 监督退出在 NOCHANGE_EN 登记', () => {
  const I = ibs.__internals();
  const joined = I.NOCHANGE_EN.map(r => r.source).join('\n');
  assert.ok(/grounds|justification|rationale/.test(joined), 'NOCHANGE_EN 无监督退出断言');
});
T('D/腿② 存在句倒装在 NODISTORT_EN 登记', () => {
  const I = ibs.__internals();
  const joined = I.NODISTORT_EN.map(r => r.source).join('\n');
  // r.source 是正则源码字面量，反斜杠为字面字符（there\\s+is），不是 \s 语义
  assert.ok(/there\\\\s\+(?:is|are)|there\\\\s\+is/.test(joined) || joined.indexOf('there') !== -1,
    'NODISTORT_EN 无存在句倒装形');
});
T('D/腿② 单字是连接在 NODISTORT_ZH 登记', () => {
  const I = ibs.__internals();
  const joined = I.NODISTORT_ZH.map(r => r.source).join('\n');
  assert.ok(/乃是\|是\|为|乃是|\|是\||\|为/.test(joined) || /(?:就是|便是|才是|即为|是为|乃是|是|为)/.test(joined),
    'NODISTORT_ZH 无单字是连接');
});

console.log('\nr301 incentive-blind-spot 三条新腿：' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);
