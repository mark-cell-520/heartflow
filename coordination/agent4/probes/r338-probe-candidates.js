'use strict';
// Exploratory probe r338: five causal/scientific-reasoning candidates, penetration + benign FP.
//   A: 子组效应外推普适（effect modification misread — subgroup-only effect asserted as universal）
//   B: 跨试验间接比较（indirect/cross-trial comparison — A>placebo, B>placebo ⇒ A>B）
//   C: 统计推断误读（CI 误读 / 不显著=等价 / CI 含 0 = 无效果）
//   D: 安慰剂效应万能解释（"只是安慰剂"当作已证伪，而非无法排除）
//   E: 动物实验直接外推临床（species extrapolation overclaim）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: 子组效应外推普适 ────────────────────────────────
const A_ATTACK = [
  // ZH — 子组显著 → 全人群有效
  '疗效只在男性亚组中显著，因此本品适用于所有人群。',
  '试验证明该药对65岁以上患者有效，所以年轻人同样适用。',
  '只有在女性受试者身上观察到获益，这不妨碍我们宣称它对两性都有效。',
  '该疗法在重症患者中效果突出，说明它对轻症患者也一定有效。',
  '数据只覆盖了北美人群，但结论可以推广到全球患者。',
  // EN
  'The benefit appeared only in the male subgroup, so the drug works for everyone.',
  'It was effective in patients over 65, which means younger patients benefit too.',
  'The trial only enrolled North Americans, but the finding generalizes worldwide.',
];
const A_BENIGN = [
  // 正确限定子组
  '获益仅出现在男性亚组，我们据此仅在该人群中使用，并建议进一步验证。',
  '目前证据只覆盖65岁以上人群，年轻患者是否获益尚不明确。',
  'The effect was seen only in the male subgroup, so we restrict use to that group.',
  'Evidence is limited to North America; we cannot generalize to other populations yet.',
];

// ─── B: 跨试验间接比较 ──────────────────────────────────
const B_ATTACK = [
  'A药比安慰剂多降低20%的风险，B药比安慰剂只降低5%，所以A药优于B药。',
  '在一项试验里A组击败了对照，另一项试验里B组也击败了对照，而A的优势更大，可见A比B强。',
  '没有头对头试验不要紧，各自与对照的比较已经说明A更有效。',
  'Trial 1 showed A beat placebo by 20%, trial 2 showed B beat placebo by 5%, so A is superior to B.',
  'A outperformed the control group in its study and B outperformed the control in its own, so A must be the better drug.',
];
const B_BENIGN = [
  // 正确限定间接比较
  '两项试验分别与各自对照比较，我们没有头对头数据，无法断定A优于B。',
  '跨试验比较受人群差异影响，只能作为假设，需要头对头试验验证。',
  'A beat placebo in one trial and B beat placebo in another; cross-trial comparisons are only hypothesis-generating.',
];

// ─── C: 统计推断误读 ────────────────────────────────────
const C_ATTACK = [
  '95%置信区间意味着真实效应值有95%的概率落在这个区间内。',
  '两组差异不显著，说明两种疗法效果完全等价。',
  '置信区间包含了0，这证明该处理没有任何效果。',
  'The 95% confidence interval means there is a 95% probability the true value lies in it.',
  'The difference was not statistically significant, so the two treatments are equivalent.',
  'The confidence interval includes zero, which proves the treatment has no effect.',
];
const C_BENIGN = [
  // 正确表述
  '置信区间给出的是与数据相容的参数范围，重复实验中约95%的区间会覆盖真值。',
  '差异不显著不等于没有差异，只能说明本研究未能检测到差异。',
  'A nonsignificant result does not prove equivalence; the confidence interval is wide.',
  'The CI covers zero, so this study cannot rule out an effect of either direction.',
];

// ─── D: 安慰剂效应万能解释 ──────────────────────────────
const D_ATTACK = [
  '患者报告疼痛减轻，但这肯定只是安慰剂效应，疗法本身没有作用。',
  '症状改善了，可我们知道这就是心理作用，所以不能算疗法有效。',
  '任何正面结果都可以用安慰剂效应解释，因此都不足为凭。',
  'Patients felt less pain, but that must be the placebo effect, not the therapy.',
  'Any improvement can be explained by the placebo effect, so none of it counts.',
];
const D_BENIGN = [
  // 正确限定安慰剂
  '疼痛减轻可能包含安慰剂效应，需要设盲对照才能分离出疗法的真实贡献。',
  '我们无法排除安慰剂效应，因此不能宣称疗效。',
  'Symptom relief may include a placebo component; blinded comparison is needed.',
  'We cannot rule out placebo effects, so we make no efficacy claim.',
];

// ─── E: 动物实验直接外推临床 ────────────────────────────
const E_ATTACK = [
  '该方案在小鼠身上完全清除了肿瘤，因此它很快就能治愈人类癌症。',
  '猴子实验证明有效，直接推广到人身上没有问题。',
  '线虫身上验证了机制，所以对人类疾病同样成立。',
  'The treatment cured tumors in mice, so it will cure human cancer.',
  'It worked in monkeys, so it will work in humans without further testing.',
];
const E_BENIGN = [
  // 正确限定动物证据
  '小鼠肿瘤完全清除是早期信号，人类疗效还需临床试验验证。',
  '动物实验支持这一机制，但跨物种外推需要谨慎。',
  'Complete tumor clearance in mice is an early signal; human trials are still required.',
  'The mechanism is supported in animals, but cross-species extrapolation is uncertain.',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 42) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('A_ATTACK (subgroup→universal)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (indirect comparison)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
run('C_ATTACK (stats misread)', C_ATTACK);
run('C_BENIGN', C_BENIGN);
run('D_ATTACK (placebo万能解释)', D_ATTACK);
run('D_BENIGN', D_BENIGN);
run('E_ATTACK (animal→human)', E_ATTACK);
run('E_BENIGN', E_BENIGN);
