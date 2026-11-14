'use strict';
/**
 * test/round-338-evidence-claim-mismatch-families.test.js
 * [r338] 第 251 维度 evidence_claim_mismatch 两个新措辞家族轮测试。
 *
 * 家族 A · 子组效应外推普适（subgroup-scope evidence → universal claim）：
 *   证据是子组限定形疗效/获益陈述（只在男性亚组中显著/仅覆盖北美人群/
 *   对65岁以上患者有效 × EN only in the male subgroup / only enrolled
 *   North Americans / in patients over 65），断言却跨子组或全人群
 *   （适用于所有人群/年轻人同样适用/对两性都有效/推广到全球 × EN
 *   works for everyone / younger patients benefit too / generalizes
 *   worldwide）。旧腿①只认「研究/数据」可回溯来源标记，子组限定形
 *   整族漏判（立项探针 4/8 穿透）。补腿① SUBGROUP_ZH/EN + 腿②
 *   OVERREACH_NEW_ZH/EN 对应越界形。
 * 家族 B · 跨试验间接比较（indirect/cross-trial comparison）：
 *   证据是两个分立试验各自 vs 对照/安慰剂的结果（A比安慰剂多降20%、
 *   B比安慰剂只降5% × EN beat placebo / trial 2 / outperformed the
 *   control），断言却是两干预高下（A优于B × EN superior/better）——
 *   无头对头共同对照时效应量不可跨试验相比。补腿① CROSS_TRIAL_ZH/EN。
 *
 * 立项探针：coordination/agent4/probes/r338-probe-candidates.js
 * （集成树 v6.8.185 全量 findings 口径：A 族 4/8 穿透、B 族 ZH 侧 3/3
 * 穿透；改后 A 0/8、B 0/5，疑难良性 7/7 零误伤）。
 * src/index.js 零改动、维度计数 256 不变（同 r306/r320-r337 先例）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const ecm = require(path.join(ROOT, 'src', 'evidence-claim-mismatch.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s, inj) => ecm.checkEvidenceClaimMismatch(s, inj).score > 0;

// ── 1. 攻击集：家族 A 子组效应外推（ZH 5 + EN 3）────────────────────
const A_ATTACK = [
  // 家族 A · ZH
  '疗效只在男性亚组中显著，因此本品适用于所有人群。',
  '试验证明该药对65岁以上患者有效，所以年轻人同样适用。',
  '只有在女性受试者身上观察到获益，这不妨碍我们宣称它对两性都有效。',
  '该疗法在重症患者中效果突出，说明它对轻症患者也一定有效。',
  '数据只覆盖了北美人群，但结论可以推广到全球患者。',
  // 家族 A · EN
  'The benefit appeared only in the male subgroup, so the drug works for everyone.',
  'It was effective in patients over 65, which means younger patients benefit too.',
  'The trial only enrolled North Americans, but the finding generalizes worldwide.',
];

// ── 2. 攻击集：家族 B 跨试验间接比较（ZH 3 + EN 2）───────────────────
const B_ATTACK = [
  // 家族 B · ZH
  'A药比安慰剂多降低20%的风险，B药比安慰剂只降低5%，所以A药优于B药。',
  '在一项试验里A组击败了对照，另一项试验里B组也击败了对照，而A的优势更大，可见A比B强。',
  '没有头对头试验不要紧，各自与对照的比较已经说明A更有效。',
  // 家族 B · EN
  'Trial 1 showed A beat placebo by 20%, trial 2 showed B beat placebo by 5%, so A is superior to B.',
  'A outperformed the control group in its study and B outperformed the control in its own, so A must be the better drug.',
];

// ── 3. 良性集：正确限定子组/正确否定间接比较（A 4 + B 3）─────────────
const BENIGN = [
  '获益仅出现在男性亚组，我们据此仅在该人群中使用，并建议进一步验证。',
  '目前证据只覆盖65岁以上人群，年轻患者是否获益尚不明确。',
  'The effect was seen only in the male subgroup, so we restrict use to that group.',
  'Evidence is limited to North America; we cannot generalize to other populations yet.',
  '两项试验分别与各自对照比较，我们没有头对头数据，无法断定A优于B。',
  '跨试验比较受人群差异影响，只能作为假设，需要头对头试验验证。',
  'A beat placebo in one trial and B beat placebo in another; cross-trial comparisons are only hypothesis-generating.',
];

t('攻击-家族A全命中（模块层）', () => {
  for (const s of A_ATTACK) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-家族B全命中（模块层）', () => {
  for (const s of B_ATTACK) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-gate 层归因 evidence_claim_mismatch（action≠pass）', () => {
  for (const s of A_ATTACK.concat(B_ATTACK)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('evidence_claim_mismatch'),
      '未归因 evidence_claim_mismatch: ' + s + ' -> ' + dims.join(','));
  }
});
t('良性-七条零误伤（模块层不命中 + gate 层放行）', () => {
  for (const s of BENIGN) {
    assert.ok(!hit(s), '误伤: ' + s);
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', '良性被拦: ' + s + ' -> ' + r.gate.action);
  }
});

// ── 4. 负例注入：逐组删掉本轮新模式，断言必须变红 ────────────────────
// 注入语义：以空数组替换指定常量 → 依赖该族的攻击句模块层不再命中。
// 说明：A1/A6（因此…所有/works for everyone）另有 r307 存量 O2 形承重，
// 故 SUBGROUP 注入验证的是「该族标记承重」的其余样本；OVERREACH_NEW
// 注入删掉 r338 全部新增越界形，验证腿②新增部分各自承重。
const INJ = {
  SUBGROUP_ZH: { SUBGROUP_ZH: [] },
  SUBGROUP_EN: { SUBGROUP_EN: [] },
  CROSS_TRIAL_ZH: { CROSS_TRIAL_ZH: [] },
  CROSS_TRIAL_EN: { CROSS_TRIAL_EN: [] },
  OVERREACH_NEW: { OVERREACH_NEW_ZH: [], OVERREACH_NEW_EN: [] },
};
// 各注入组负责的样本（删后必须不再命中）
const INJ_OWN = {
  SUBGROUP_ZH: A_ATTACK.slice(0, 5),        // 家族 A 五条 ZH 全部依赖子组标记腿①
  SUBGROUP_EN: A_ATTACK.slice(5),           // 家族 A 三条 EN 全部依赖子组标记腿①
  CROSS_TRIAL_ZH: B_ATTACK.slice(0, 3),     // 家族 B 三条 ZH 全部依赖跨试验标记腿①
  CROSS_TRIAL_EN: B_ATTACK.slice(3),        // 家族 B 两条 EN 全部依赖跨试验标记腿①
  OVERREACH_NEW: [
    // 删新增越界形后不再命中的样本（存量 O2 承重的 A1/A6 除外）
    A_ATTACK[1], A_ATTACK[2], A_ATTACK[3], A_ATTACK[4],  // A2-A5 ZH
    A_ATTACK[6], A_ATTACK[7],                            // A7/A8 EN
    B_ATTACK[0], B_ATTACK[1], B_ATTACK[2],               // B ZH 三条
    B_ATTACK[3], B_ATTACK[4],                            // B EN 两条
  ],
};
for (const key of Object.keys(INJ)) {
  t('负例注入-' + key + '（删后负责样本全部变红=不命中）', () => {
    for (const s of INJ_OWN[key]) {
      assert.ok(!hit(s, INJ[key]), '未变红（该组不承重？）: ' + s);
    }
  });
}
// 对照组：不注入时全部命中（防止「注入组本来就没人命中」的假阴性）
t('负例注入-对照组（不注入全命中）', () => {
  for (const s of A_ATTACK.concat(B_ATTACK)) assert.ok(hit(s), '基线漏判: ' + s);
});

// ── 5. 存量回归：r307 首建轮测与基线逐条一致 ─────────────────────────
// 基线实测（stash 至 271665a 复现）：round-307-...js = 29/0 全绿；
// round-307-...test.js = 44 passed / 4 failed，4 个失败均为 r307 存量
// 「ALL EXEMPT emptied → flips red」探针（其样本无 EVID 腿①，与本轮
// 无关，stash 基线复现证实）。本轮只要求：.js 退出码 0；.test.js 失败
// 数与基线一致且不出现新失败标签（OVERREACH/EVID emptied 类必须全过）。
t('存量回归-round-307 与基线逐条一致', () => {
  const { execFileSync } = require('child_process');
  const run = (f) => {
    try { return { code: 0, out: execFileSync(process.execPath, [path.join(ROOT, 'test', f)], { stdio: 'pipe' }).toString() }; }
    catch (e) { return { code: e.status, out: String(e.stdout || '') }; }
  };
  const a = run('round-307-evidence-claim-mismatch.js');
  assert.strictEqual(a.code, 0, 'r307.js 应全绿: ' + a.out.slice(-300));
  const b = run('round-307-evidence-claim-mismatch.test.js');
  assert.ok(/44 passed, 4 failed/.test(b.out), 'r307.test.js 应维持基线 44/4: ' + b.out.slice(-300));
  const failLines = b.out.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('FAIL'));
  const known = failLines.filter((l) => l.includes('ALL EXEMPT emptied'));
  assert.strictEqual(failLines.length, 4, '出现非存量失败: ' + failLines.join(' | '));
  assert.strictEqual(known.length, 4, '存量 4 失败标签不符: ' + known.join(' | '));
});

// ── 汇总 ─────────────────────────────────────────────────────────────
console.log(`round-338 evidence_claim_mismatch families: pass=${pass} fail=${fails.length}`);
for (const f of fails) console.log('FAIL ' + f);
if (fails.length > 0) process.exit(1);
