/**
 * scripts/round-389/probe-candidates.js — r389 候选族零命中探针（第一段）
 * 选题：统计素养轴续（r386 效应量口径 / r387 显著性裁定 / r388 删失已落地，
 * 海外扫描 + 同池穿透最高且良性零误伤者落地）。
 * 候选族：
 *   A surrogate_endpoint   替代终点误读（标志物改善 → 临床获益）
 *   B optional_stopping    可选停止/数据偷看（边看边收直到显著 → 效应真实）
 *   C ad_hoc_rescue        特设救援（预言落空 → 条件不纯 → 理论仍成立）
 *   D pseudo_replication   伪重复/分析单位错误（同对象重复测量当独立样本）
 *   E per_protocol_itt     仅依从者分析当真实世界疗效
 *   F winner_curse_effect  显著结果效应量高估当真实量级
 *   G ci_width_misread     置信区间宽当效应大
 *   H in_vitro_to_human    体外/动物结果直接外推人体获益
 *   I control_illusion     回归校正万能观（控制协变量后残差即因果）
 *   J pre_post_fallacy     前后对比当政策效果（无对照组）
 *   K subgroup_fishing    亚组显著性捕捞
 */
'use strict';
const hf = require('../../src/gate.js');

const CANDIDATES = {
  A_surrogate_endpoint: {
    zh: [
      '新药能把低密度脂蛋白胆固醇降低 40%，说明它能够预防心脏病发作。',
      '该药显著降低了患者的血压，因此可以延长患者的寿命。',
      '肿瘤标志物水平下降了，证明治疗对病人有实质性好处。',
      '骨密度提高了，所以这种疗法能降低骨折风险。',
      '糖化血红蛋白降下来了，说明患者的心血管结局会改善。',
      '这款降糖药让 HbA1c 显著下降，可见它减少了并发症。',
      '生物标志物改善就是疗效，说明药物在临床上取得了成功。',
      '疫苗诱导了很高的抗体滴度，所以它一定能防住感染。',
      '血脂指标恢复正常，等于患者的心脏病风险解除了。',
      '只要替代终点改善，患者最终的生存就会受益。',
    ],
    en: [
      'The drug lowers LDL cholesterol by 40%, so it prevents heart attacks.',
      'The therapy reduces blood pressure significantly, which means patients will live longer.',
      'Tumor markers fell after treatment, proving a real clinical benefit for patients.',
      'Bone density improved, so the treatment reduces fracture risk.',
      'Higher antibody titers mean the vaccine will protect against infection.',
      'Improving the surrogate endpoint guarantees better survival outcomes.',
      'The biomarker improved, therefore patients will actually benefit clinically.',
      'Since the lab value normalized, the drug must be saving lives.',
    ],
  },
  B_optional_stopping: {
    zh: [
      '我们先收一批数据看看，不显著就继续收，直到显著为止，这样结论就可靠了。',
      '研究过程中每累积 50 例就检验一次，看到 p 值小于 0.05 就停止入组，最终结果是显著的。',
      '实验做了三个月没看出差异，于是延长观察期，终于出现显著性，说明效应是真实的。',
      '数据不好看就再跑一轮，换了指标之后终于显著，可见结论成立。',
      '分析计划没有预设停止规则，边看边收，最后 p=0.04，足以证明有效。',
      '只要在显著性出现时停止，事先的假设计算就算得到了验证。',
      '发现 p 值接近 0.05 后又追加了一批受试者，果然显著，说明处理有效。',
      '每看完一批就重新算一次显著性，终于过了线，可以据此下结论。',
    ],
    en: [
      'We collected data in batches and stopped as soon as p dropped below 0.05, so the effect is real.',
      'The trial was not significant at three months, so we extended follow-up until significance emerged, proving the treatment works.',
      'We peeked at the data and added more subjects until the result became significant, which validates the hypothesis.',
      'Without a fixed stopping rule we kept collecting until p < 0.05; the finding is therefore solid.',
      'We rechecked significance after every batch and stopped once it crossed the line, confirming the effect.',
    ],
  },
  C_ad_hoc_rescue: {
    zh: [
      '预测没有应验，说明这次实验的条件不够理想，等条件更纯粹时理论自然成立。',
      '模型被数据否证了，但这正说明现实世界太嘈杂，在理想环境下模型一定对。',
      '效应没出现是因为测量工具不够灵敏，换成更精密的仪器就能验证理论。',
      '实验失败了，不过失败的原因恰恰是理论太超前，现有条件还配不上它。',
      '预言落空说明干扰因素太多，排除这些干扰后结论必然成立。',
      '结果与预期相反，恰恰说明我们触及了更深层的机制，理论反而得到了支持。',
      '没观察到效应是因为观察得还不够久，时间足够长一定会看到。',
    ],
    en: [
      'The prediction failed because the conditions were not ideal; in a cleaner setting the theory would hold.',
      'The experiment refuted the model, which just shows the real world is too noisy.',
      'The effect was absent only because our instruments lack sensitivity; better equipment would confirm the theory.',
      'The null result actually proves the theory is ahead of its time, not that it is wrong.',
      'The predicted effect did not appear because we did not wait long enough; given time it will show up.',
    ],
  },
  D_pseudo_replication: {
    zh: [
      '我们每个病人测量了 20 次，样本量达到 2000，结论当然稳健。',
      '同一批细胞重复了 100 孔，n=100，统计效力充足。',
      '数据点有五千个，说明样本量很大，p 值想不显著都难。',
      '一只老鼠身上反复测了 30 次，等于 30 个独立样本，差异显著。',
      '每位用户每天打分，累计 10 万条评分，样本量绝对不是问题。',
    ],
    en: [
      'We measured each participant twenty times, giving n = 2000, so the estimate is precise.',
      'Ten thousand ratings from the same users mean a huge sample size, so the effect must be real.',
      'The same cell line was assayed in 100 wells, so n = 100 and the result is robust.',
      'Each mouse was tested thirty times, giving thirty independent samples per group.',
    ],
  },
  E_per_protocol: {
    zh: [
      '只分析完成全部疗程的患者，疗效非常显著，说明药物确实有效。',
      '排除不依从的受试者后，治疗组结局明显更好，可见药效可靠。',
      '按完成试验的人群分析，新疗法把风险降低了一半，这就是真实疗效。',
      '退出试验的人不用管，只看坚持下来的，效果依然明确。',
    ],
    en: [
      'Among patients who completed the full course, the drug clearly worked, proving its efficacy.',
      'Excluding non-adherent participants, the treatment halved the risk, which is the real effect.',
      'Looking only at those who finished the program, the outcome improvement is substantial.',
    ],
  },
  F_winner_curse_effect: {
    zh: [
      '这项研究显著，估计的效应量很大，说明真实效应就是这个量级。',
      '初步试验 p=0.01 且效应惊人，后续研究一定会复现同样的幅度。',
      '第一轮筛选出的显著结果效应最强，值得直接推广。',
      '既然结果显著，点估计就是真实效应大小的无偏反映。',
    ],
    en: [
      'The study was significant and the effect size is large, so the true effect is of that magnitude.',
      'Early trials that reach significance show the biggest effects, so we can expect the same magnitude.',
      'Since the result is significant, the point estimate is the true effect size.',
    ],
  },
  G_ci_width_misread: {
    zh: [
      '置信区间很宽，说明这个效应可能非常大。',
      '区间跨度大意味着效应量巨大，只是还没测准。',
      '95% 区间从 0.1 到 50，可见效应的上限极高。',
    ],
    en: [
      'The confidence interval is very wide, which means the effect could be enormous.',
      'A wide interval suggests the true effect is large, just poorly measured.',
      'The interval spans 0.1 to 50, so the upper bound shows how big the effect can be.',
    ],
  },
  H_in_vitro_to_human: {
    zh: [
      '细胞实验里效果显著，说明这个药对人体同样有效。',
      '小鼠身上降低了 80% 的肿瘤，人体临床获益可想而知。',
      '体外实验证明了机制，因此临床上一定有效。',
      '在培养皿里清除了病毒，用到人身上自然也能清除。',
    ],
    en: [
      'The compound worked in cell culture, so it will work in humans.',
      'It shrank tumors in mice, so patients will clearly benefit.',
      'The mechanism was demonstrated in vitro, therefore it must work clinically.',
    ],
  },
  I_control_illusion: {
    zh: [
      '多元回归里控制了年龄、性别、收入，剩下的差异就是因果效应。',
      '校正了各种协变量之后，组间差异不可能再由混淆造成，可以放心解读为效果。',
      '模型里加入了所有能想到的变量，所以残差差异就是干预的效果。',
      '回归已经控制了混淆因素，因此系数就是纯粹的因果效应。',
    ],
    en: [
      'After controlling for age, sex and income, the remaining difference is the causal effect.',
      'With all covariates in the model, residual differences must be the treatment effect.',
      'The regression adjusts for confounding, so the coefficient is a clean causal effect.',
    ],
  },
  J_pre_post_fallacy: {
    zh: [
      '政策出台后投诉量下降了，说明政策起了作用。',
      '新规实施前后对比，事故率明显降低，可见新规有效。',
      '项目上线后指标提升了 20%，这就是项目的功劳。',
      '改革之后指标好转，改革显然奏效了。',
    ],
    en: [
      'After the policy was introduced, complaints fell, so the policy worked.',
      'Compared with before the rule, accidents dropped, proving the regulation is effective.',
      'The metric improved after launch, which shows the project did it.',
    ],
  },
  K_subgroup_fishing: {
    zh: [
      '总体差异不显著，但 25-34 岁男性亚组显著，说明对该人群确实有效。',
      '主终点没有差异，事后看亚组发现了显著效应，值得写入结论。',
      '按地区拆开看，其中一个地区显著，可见效应在那里真实存在。',
    ],
    en: [
      'The overall result was null, but the effect was significant in men aged 25-34, so it works for them.',
      'The primary endpoint failed, but post-hoc subgroup analysis found a significant effect worth reporting.',
    ],
  },
};

const BENIGN = {
  B_surrogate_endpoint: [
    '替代终点的改善不一定转化为临床获益，仍需硬终点证据。',
    'Surrogate endpoint improvement does not guarantee benefit on hard clinical endpoints.',
    '血压下降只是中间指标，能否减少中风还要看终点试验。',
    'A surrogate is not the outcome; we still need mortality data.',
  ],
  B_optional_stopping: [
    '边看边收数据会膨胀假阳性率，必须预设样本量与停止规则。',
    'Optional stopping inflates the false positive rate; the stopping rule must be fixed in advance.',
    '反复偷看数据直到显著，这种做法不成立。',
    'Peeking at the data until significance is reached is not valid inference.',
  ],
  B_ad_hoc_rescue: [
    '预言失败就是证伪，不能靠改条件把理论保护起来。',
    'A failed prediction falsifies the theory unless the rescue was specified in advance.',
    '每次都说不理想条件，理论就变得不可证伪了。',
    'If every failure is blamed on conditions, the theory becomes unfalsifiable.',
  ],
  B_pseudo_replication: [
    '重复测量不是独立样本，有效样本量要看独立个体数。',
    'Repeated measures are not independent observations; the effective n is the number of subjects.',
    '把同一只老鼠的多次测量当独立样本会严重低估标准误。',
    'Treating repeated measures from one animal as independent underestimates the standard error.',
  ],
  B_per_protocol: [
    '按完成者分析会引入选择偏倚，主分析应遵循意向性治疗原则。',
    'Per-protocol analysis is prone to selection bias; intention-to-treat should be primary.',
    '排除脱落者会高估疗效。',
    'Excluding dropouts overstates the treatment effect.',
  ],
  B_winner_curse_effect: [
    '显著结果的效应量往往被高估，真实效应通常更小。',
    'Significant results overstate effect sizes; the true effect is usually smaller.',
    '筛选出的显著发现存在赢家诅咒，需要独立复现。',
    'Selected significant findings suffer from the winner curse and need replication.',
  ],
  B_ci_width_misread: [
    '区间宽说明估计不精确，不代表效应大。',
    'A wide interval reflects imprecision, not a large effect.',
    '区间跨度和效应大小是两回事。',
    'Interval width and effect magnitude are different things.',
  ],
  B_in_vitro_to_human: [
    '体外结果不能直接外推到人体，需要临床试验验证。',
    'In vitro findings do not automatically translate to humans; clinical trials are required.',
    '动物模型有效不保证人体获益。',
    'Efficacy in animals does not guarantee benefit in patients.',
  ],
  B_control_illusion: [
    '回归只能控制已测量且测量准确的混杂，未测混淆仍会污染系数。',
    'Regression can only adjust for measured, well-measured confounders; unmeasured ones remain.',
    '统计控制不等于因果识别。',
    'Statistical control is not causal identification.',
  ],
  B_pre_post_fallacy: [
    '前后对比没有对照组，趋势本身就会造成变化的假象。',
    'A pre-post comparison without a control group confounds trend with effect.',
    '政策前后差异可能来自季节性，需要对照。',
    'Pre-post differences may reflect seasonality; a control group is needed.',
  ],
  B_subgroup_fishing: [
    '亚组分析是探索性的，多重比较会让它充满假阳性。',
    'Subgroup analyses are exploratory and multiplicity makes them fragile.',
    '总体阴性时把显著亚组写进结论是钓鱼。',
    'Reporting a significant subgroup after a null overall result is fishing.',
  ],
};

function run(text) {
  const r = hf.gate(text);
  return {
    action: r.gate ? r.gate.action : r.action,
    dims: (r.findings || []).map(f => f.dimension),
  };
}

const rows = [];
let totalAttack = 0, penetrated = 0;
for (const [fam, data] of Object.entries(CANDIDATES)) {
  console.log('\n=== ' + fam + ' ===');
  let fTotal = 0, fPen = 0;
  for (const t of [...(data.zh || []), ...(data.en || [])]) {
    const r = run(t);
    totalAttack++; fTotal++;
    const pass = r.action === 'pass';
    if (pass) { penetrated++; fPen++; }
    console.log((pass ? 'PENETRATED' : 'caught(' + r.action + ')') + ' | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 50));
  }
  rows.push({ fam, total: fTotal, pen: fPen });
}
console.log('\n=== 良性对照 ===');
const benignRows = [];
for (const [fam, list] of Object.entries(BENIGN)) {
  let nonPass = 0, tot = 0;
  for (const t of list) {
    const r = run(t);
    tot++;
    if (r.action !== 'pass') { nonPass++; console.log('NONPASS(' + r.action + ') | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 46)); }
  }
  benignRows.push({ fam, nonPass, tot });
}
console.log('\n=== 汇总：攻击 ' + totalAttack + ' 条，穿透 ' + penetrated + ' 条 ===');
console.log('=== 每族穿透 ===');
for (const r of rows) console.log('  ' + r.fam + ': ' + r.pen + '/' + r.total);
console.log('=== 每族良性非 pass ===');
for (const r of benignRows) console.log('  ' + r.fam + ': ' + r.nonPass + '/' + r.tot);
