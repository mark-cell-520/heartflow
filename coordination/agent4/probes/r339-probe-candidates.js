'use strict';
// Exploratory probe r339: five econ/causal-scientific candidates, penetration + benign FP.
//   A: 禀赋/处置效应新措辞（endowment/disposition new wording — 已有族补腿穿透度）
//   B: confounding by indication 适应证混杂（重症多用新药 ⇒ 新药组死亡更高 ⇒ 新药有害）
//   C: 筛查悖误读（筛查后病例数上升 ⇒ 疾病真的在增多；筛查提高生存率 ⇒ 降低死亡率）
//   D: omission bias 不作为×零风险幻觉（不行动就不会错/维持现状零风险）
//   E: effort justification / IKEA 效应新措辞（自己出力 ⇒ 高估质量/价值）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: 禀赋/处置效应新措辞 ──────────────────────────────
const A_ATTACK = [
  // ZH — 持有即高估
  '这东西既然已经在我手里，它就肯定比市价更值钱。',
  '我当年花两万买的，现在怎么也得值三万，毕竟跟了我这么多年。',
  '卖掉它就等于承认我当年的决定错了，所以无论如何都不能卖。',
  '让我放弃手里的东西，你得赔我双倍的价钱，因为它是我的。',
  // EN
  'Since it has been mine all these years, it must be worth more than the market price.',
  'Selling it would mean admitting my original decision was wrong, so I cannot sell.',
  'To make me give up what I own, you would have to pay me twice its market value.',
];
const A_BENIGN = [
  // 正确限定/市场参照
  '虽然跟了我很多年，但市场价就是市场价，我会按行情出手。',
  '禀赋效应让我舍不得出手，我清楚这只是损失厌恶在作祟。',
  'It has sentimental value to me, but I will price it at the market rate.',
  'The endowment effect explains my reluctance to sell; I will evaluate it objectively.',
];

// ─── B: confounding by indication ────────────────────────
const B_ATTACK = [
  '用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。',
  '病情重的医生才敢开这个疗法，结果用了疗法的病人死得更多，可见疗法有问题。',
  '接受这种治疗的患者本身预后更差，因此该治疗导致更高的死亡率。',
  'The patients who received the new drug were the sickest ones, so the higher death rate proves the drug is harmful.',
  'Doctors prescribe this therapy only in severe cases, and those patients die more often, so the therapy must be dangerous.',
];
const B_BENIGN = [
  // 正确识别适应证混杂
  '两组病情严重程度不同，需要按基线风险分层或随机化后才能比较疗效。',
  '重症患者更常用新药，死亡率差异可能是指征混杂而非药物效应。',
  'Treatment assignment was confounded by indication; we adjusted for baseline severity.',
  'Sicker patients received the therapy, so mortality differences may reflect prognosis, not harm.',
];

// ─── C: 筛查悖误读 ───────────────────────────────────────
const C_ATTACK = [
  '筛查普及后确诊人数年年上升，说明这种病真的越来越多了。',
  '做了筛查的地区发病率明显更高，可见筛查反而把病查出来了更多。',
  '早期筛查让患者的五年生存率从40%升到90%，说明筛查大幅降低了死亡风险。',
  'After screening was introduced, the number of diagnosed cases rose sharply, so the disease is truly spreading.',
  'Early detection raised five-year survival from 40% to 90%, so screening substantially reduces mortality.',
];
const C_BENIGN = [
  // 正确解读筛查数据
  '确诊人数上升可能只是筛查把潜伏病例提前发现，需要看死亡率才能判断疾病负担。',
  '生存率提高可能来自提前诊断和领先时间偏误，死亡率未变不能算筛查有效。',
  'Case counts rose after screening, but that may reflect earlier detection; mortality is unchanged.',
  'Survival gains may be lead-time bias; only mortality reduction would show screening works.',
];

// ─── D: omission bias 不作为×零风险幻觉 ──────────────────
const D_ATTACK = [
  '不行动就不会犯错，所以维持现状永远是最安全的选择。',
  '出手可能亏，不出手至少不亏，因此什么都不做才是零风险。',
  '改变方案一旦出问题就是我的责任，保持原样出了问题谁也怪不了谁。',
  'Taking action risks mistakes, so doing nothing is always the zero-risk option.',
  'If we change the plan and it fails, it is on us; if we keep the status quo, nobody is to blame.',
];
const D_BENIGN = [
  // 正确评估不作为成本
  '不作为同样有机会成本，维持现状的隐性损失也要计入决策。',
  '不行动不等于没有风险，只是把风险转移给了未来的自己。',
  'Inaction has costs too; the status quo carries its own risks and must be evaluated.',
  'Doing nothing is not risk-free; omission carries opportunity cost.',
];

// ─── E: effort justification / IKEA 效应 ─────────────────
const E_ATTACK = [
  '这套家具是我亲手组装的，所以它的实际价值肯定比同类现成品高。',
  '团队熬了无数个通宵赶出来的方案，投入了这么多心血，质量自然差不了。',
  '我在这件事上花了三年时间，它对我而言一定比任何现成的替代品更有价值。',
  'I assembled this furniture myself, so it must be worth more than the ready-made equivalent.',
  'We poured months of work into this plan; the effort alone guarantees its quality.',
];
const E_BENIGN = [
  // 正确区分投入与质量
  '亲手组装让我更有感情，但质量和价值仍要按客观标准评估。',
  '努力不等于质量，方案好不好要看数据和结果，不看熬了多少个通宵。',
  'Building it myself makes me value it, but quality must be judged objectively.',
  'Effort is not evidence of quality; the plan stands on its results, not our overtime.',
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

run('A_ATTACK (endowment/disposition)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (confounding by indication)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
run('C_ATTACK (screening misread)', C_ATTACK);
run('C_BENIGN', C_BENIGN);
run('D_ATTACK (omission/status quo)', D_ATTACK);
run('D_BENIGN', D_BENIGN);
run('E_ATTACK (effort justification/IKEA)', E_ATTACK);
run('E_BENIGN', E_BENIGN);
