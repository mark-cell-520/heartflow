/**
 * r299 incentive_blind_spot 新句式族负例注入测试
 *
 * 新增族（均为既有维度的全新句式族，不是给旧族加样本）：
 *   EN 侧 10 族：
 *     NODISTORT_EN ②-g 自动均衡动词族（pool × balance out / settle themselves / self-correct …）
 *     NODISTORT_EN ②-h 自抵消/无差别断言族（risks cancel out / no meaningful difference …）
 *     NODISTORT_EN ②-i 无需干预断言族（no need for risk-based pricing …）
 *     NODISTORT_EN ②-j 无条件合理断言族（the premiums are reasonable …）
 *     NODISTORT_EN ②-k 池子自净族（the market self-regulates …）
 *     NOCHANGE_EN  ②-d 监督豁免断言族（depositors will not monitor the bank …）
 *     NOCHANGE_EN  ②-e 无额外风险断言族（the bank faces no extra risk …）
 *     NOCHANGE_EN  ②-f 脱钩断言族（incentives remain decoupled from behavior …）
 *     ABSTAIN_EN   ③-e 无需贡献断言族（there is no need for me to contribute …）
 *     ABSTAIN_EN   ③-f 介入替代断言族（someone else will step in …）
 *   ZH 侧 3 族 + 1 处腿①裸名词补全：
 *     POOL_ZH      ①-a 补 混合池/共同池/互助池/统筹池/大池/池子（裸名词形）
 *     NODISTORT_ZH ②-g 自抵消动词族（风险会自己抵消 …）
 *     NODISTORT_ZH ②-h 无条件合理断言族（保费自然就是合理的 …）
 *     NODISTORT_ZH ②-i 无需甄别断言族（定价不用担心 …）
 *
 * 每族都按「两腿判据」结构承重：腿①语境锚点 × 腿②断言，缺任一跳线不命中。
 * 豁免表由模块自身构造保证；良性样本（含该族边缘良性）单独成组。
 */
'use strict';

const assert = require('assert');
const gateModule = require('../src/gate.js');
const gate = typeof gateModule === 'function' ? gateModule : gateModule.gate;

let passed = 0;
let failed = 0;
const failures = [];

function check(label, text, expectHit) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  const hit = dims.includes('incentive_blind_spot');
  if (hit === expectHit) {
    passed++;
  } else {
    failed++;
    failures.push(`${label}: expect ${expectHit ? 'HIT' : 'PASS'}, got action=${r.gate.action} dims=[${dims.join(',')}]`);
  }
}

// ───────────────────────────────────────────────────────────────
// 攻击样本：EN 侧 10 族（每族 2 个变体 = 中英/修饰/倒装/长句覆盖）
// ───────────────────────────────────────────────────────────────
const ATTACK = [
  // ②-g 自动均衡动词族
  ['EN ②-g balance out', 'A large pool of borrowers will naturally balance out the risky ones.', true],
  ['EN ②-g settle themselves', 'Once everyone is enrolled in the same plan, the premiums will settle themselves.', true],
  ['EN ②-g level off', 'With full coverage the risk profile levels off on its own.', true],
  ['EN ②-g self-corrects', 'The pool self-corrects, so no differential pricing is required.', true],
  // ②-h 自抵消/无差别断言族
  ['EN ②-h cancel out', 'The high-risk and low-risk exposures cancel out in a big enough book.', true],
  ['EN ②-h no meaningful difference', 'Across the pool there is no meaningful difference in default rates.', true],
  ['EN ②-h basically the same', 'The payouts are basically the same, so the pricing is fine.', true],
  // ②-i 无需干预断言族
  ['EN ②-i without any need', 'Everyone is enrolled, so the premiums settle themselves without any need for risk-based pricing.', true],
  ['EN ②-i no reason to', 'There is no reason for additional screening of the applicants.', true],
  ['EN ②-i no grounds', 'There are no grounds for closer monitoring of the insured.', true],
  // ②-j 无条件合理断言族
  ['EN ②-j premiums are reasonable', 'The premiums are reasonable and the coverage is fair for everyone.', true],
  ['EN ②-j rates will be fair', 'With universal enrollment the rates will be fair.', true],
  // ②-k 池子自净族
  ['EN ②-k market self-regulates', 'The market self-regulates, so the mix takes care of itself.', true],
  ['EN ②-k naturally corrects', 'The system naturally corrects any imbalance over time.', true],
  // ②-d 监督豁免断言族
  ['EN ②-d will not monitor', 'The deposit insurance means depositors will not monitor the bank.', true],
  ['EN ②-d no incentive to', 'Creditors have no incentive to scrutinize the lender.', true],
  ['EN ②-d feel no need', 'Shareholders feel no need to police the firm.', true],
  // ②-e 无额外风险断言族
  ['EN ②-e faces no extra risk', 'With the guarantee the bank faces no extra risk.', true],
  ['EN ②-e bears minimal losses', 'The insured bears minimal losses from its own decisions.', true],
  // ②-f 脱钩断言族
  ['EN ②-f decoupled', 'The incentives remain decoupled from actual behavior.', true],
  ['EN ②-f divorced', 'Payoffs become divorced from performance.', true],
  // ③-e 无需贡献断言族
  ['EN ③-e there is no need', 'Someone else will step in and do the work, so there is no need for me to contribute.', true],
  ['EN ③-e no obligation', 'There is no obligation on any single member to pay in.', true],
  // ③-f 介入替代断言族
  ['EN ③-f someone else will', 'Someone else will step in and do the work.', true],
  ['EN ③-f the group will', 'The community will take care of it eventually.', true],
  ['EN ③-f others can', 'Others can pick up the slack without me.', true],

  // ── ZH 侧 3 族 + 腿①裸名词 ──
  ['ZH ①-a 混合池裸名词', '混合池里高风险和低风险的人自然平衡，定价不用担心。', true],
  ['ZH ①-a 大池裸名词', '放进大池之后人群自然就均衡了，不需要额外评估。', true],
  ['ZH ②-g 风险自己抵消', '只要参保的人足够多，保费自然就是合理的，风险会自己抵消。', true],
  ['ZH ②-g 差异自动对冲', '各类客户的差异会自动对冲掉，不用担心结构问题。', true],
  ['ZH ②-h 保费自然合理', '参保的人足够多，保费自然就是合理的。', true],
  ['ZH ②-h 定价本就正确', '这个机制下定价本就是正确的，不用再测算。', true],
  ['ZH ②-i 定价不用担心', '混合池里高风险和低风险的人自然平衡，定价不用担心。', true],
  ['ZH ②-i 无需甄别', '统筹池覆盖所有人，不需要额外甄别风险。', true],
];

// ───────────────────────────────────────────────────────────────
// 良性样本：含该族边缘良性（正确的多因/激励显性化陈述、疑问句、解药句）
// ───────────────────────────────────────────────────────────────
const BENIGN = [
  // 边缘良性：正面肯定但其实是正确分析（不构成否认扭曲）
  ['EN 良性 risk-based', 'Without risk-based pricing, adverse selection will drive the pool toward higher-risk participants.', false],
  ['EN 良性 hedge', 'It could be that behavior stays the same, but we still need to check the incentives.', false],
  ['EN 良性 question', 'Will the guarantee really leave borrower behavior unchanged?', false],
  ['EN 良性 corrective', 'Adverse selection is a real risk here, so we must introduce risk stratification.', false],
  ['EN 良性 monitor', 'Depositors should monitor the bank, especially once coverage is universal.', false],
  ['EN 良性 contribute', 'I will contribute because the public good only exists if everyone does.', false],
  ['EN 良性 someone else (partial)', 'Someone else may step in, but I should not rely on that.', false],
  // ZH 边缘良性
  ['ZH 良性 正确激励', '如果不做风险分层，高风险方会大量进入，定价必然出错。', false],
  ['ZH 良性 正确监督', '兜底之后必须配套行为监督，否则受保护的一方会放大冒险。', false],
  ['ZH 良性 贡献显性化', '公共品需要把每个人贡献和收益对应起来，否则人人都会等别人出力。', false],
  ['ZH 良性 防止搭便车', '为防止搭便车，我们设计了可核实的参与记录。', false],
  ['ZH 良性 疑问句', '保费真的不会因为人群混合而变高吗？', false],
  ['ZH 良性 混合池但正面', '混合池确实存在，所以我们要按风险分层定价。', false],
];

// ───────────────────────────────────────────────────────────────
for (const [label, text, expectHit] of ATTACK) {
  check('ATTACK ' + label, text, expectHit);
}
for (const [label, text, expectHit] of BENIGN) {
  check('BENIGN ' + label, text, expectHit);
}

console.log(`\nincentive-blind-spot r299 新句式族：${passed} 通过, ${failed} 失败, 共 ${ATTACK.length + BENIGN.length} 个`);
if (failures.length) {
  console.log('\n失败项：');
  for (const f of failures) console.log('  ❌ ' + f);
  process.exitCode = 1;
} else {
  console.log('✅ 攻击样本全部命中、良性样本全部 pass');
}
