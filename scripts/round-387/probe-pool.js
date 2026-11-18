// r387 立项探针：统计/因果组候选族同池实测（穿透 = gate pass 且零维度归因）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const pool = {
  // 候选1：survivor_time_bias 姊妹——删失数据/未到期就说失败（survival analysis censoring neglect）
  censoring_neglect: [
    '新药组五年生存率 60%，是对照组的两倍，说明新药更有效。',
    'The new treatment shows 60% survival versus 30% for control, proving it is twice as effective.',
    '临床试验进行到第二年，新药组患者全部健在，因此新药100%有效。',
    'Only 18 months into the trial, every patient on the drug is still alive, so the cure rate is 100%.',
    '这个疗法观察期只有一年，但数据显示疗效显著优于旧疗法。',
    'With just one year of follow-up, the data already show this therapy outperforms the old one.',
  ],
  // 候选2：均值回归误读（regression to the mean as effect）
  regression_effect: [
    '上次考试极差的学生这次用了新教学法，成绩大幅回升，证明新方法有效。',
    'The worst-performing students improved dramatically after the new program, proving it works.',
    '疼痛最严重的患者在接受了治疗后症状明显减轻，说明治疗对重症特别有效。',
    'Patients with the worst pain scores improved the most after treatment, showing the therapy works best for severe cases.',
    '球队在连败之后换了教练，随后胜率回升，换教练立竿见影。',
    'The team changed coaches after a losing streak and immediately won more, so the coaching change worked.',
  ],
  // 候选3：多组比较未校正当作确证（multiple comparisons as confirmation）
  multicomp_confirm: [
    '我们分析了 50 个指标，其中 3 个显著相关，说明这三个因素确实有效。',
    'We tested 50 outcomes and 3 were significant, confirming that these three factors matter.',
    '测试了 20 种组合，有一种效果突出，这就是最佳方案。',
    'We tried 20 combinations and one stood out, so that is the best option.',
    '扫描了几百个基因，找到了几个与疾病相关的，这就是致病基因。',
    'We scanned hundreds of genes and found a few associated with the disease; these are the causal genes.',
  ],
  // 候选4：生态学谬误姊妹——比率再平均（ratio averaging / Simpson 相关但不同形）
  ratio_averaging: [
    'A 组平均收入是 B 组的两倍，所以 A 组随便一个人的收入都高于 B 组中位数。',
    'Group A earns twice as much on average, so any person from A earns more than the median person in B.',
    '北方平均身高高于南方，所以北方最低的人也比南方最高的人高。',
    'Northerners are taller on average, so the shortest northerner is taller than the tallest southerner.',
    '这个班平均分高于那个班，所以这个班每个人成绩都更好。',
    'This class has a higher average score, so every student here outperforms every student there.',
  ],
  // 候选5：诊断测试阳性预测值误读（base rate neglect in testing, PPV 混淆）
  ppv_misread: [
    '检测灵敏度 99%，所以阳性结果基本可以确诊。',
    'The test is 99% sensitive, so a positive result confirms the diagnosis.',
    '准确率 95% 的检测筛出阳性，这个人几乎肯定患病。',
    'A test with 95% accuracy flagged him positive, so he almost certainly has the disease.',
    '检测特异性很高，阳性说明患病的概率超过九成。',
    'The test is highly specific, so a positive means over 90% probability of disease.',
  ],
  // 候选6：发表偏误当无偏证据（publication bias as unbiased evidence）
  publication_bias: [
    '所有发表的论文都支持这个结论，所以证据是充分的。',
    'All published papers support this conclusion, so the evidence is conclusive.',
    '期刊上找不到反对的研究，说明反对意见不存在。',
    'No contradicting studies appear in the journals, so no contrary evidence exists.',
    '文献检索只找到正面结果，这证明疗法安全有效。',
    'A literature search found only positive results, proving the therapy is safe and effective.',
  ],
  // 候选7：Simpson 悖论姊妹——加权合并误读（aggregate trend applied to strata）
  aggregate_strata: [
    '总体数据显示治疗有效，所以对每个亚组都有效。',
    'The overall data show the treatment works, so it works for every subgroup.',
    '合并两个医院的数据后死亡率下降，说明两家医院各自都改善了。',
    'Pooling both hospitals shows mortality fell, so each hospital individually improved.',
    '总体及格率提高了，说明每个班级的及格率都提高了。',
    'The overall pass rate rose, so every class improved.',
  ],
  // 候选8：辛普森悖论反向——总体反转（aggregate reverses stratum direction）
  aggregate_reversal: [
    '虽然每个年龄段失业率都上升了，但总体失业率却下降了，说明就业形势在好转。',
    'Unemployment rose in every age group, yet the overall rate fell, so the job market is improving.',
    '两所医院各自死亡率都低于去年，合并后反而更高，这一定是数据错误。',
    'Each hospital\'s mortality fell year over year, but the pooled figure rose, so the data must be wrong.',
    '每个组通过率都下降，总体通过率却上升，说明改革成功了。',
    'Every group\'s pass rate fell, but the overall rate rose, so the reform succeeded.',
  ],
};
const benign = [
  '上次考试极差的学生这次成绩回升，可能包含均值回归，需要对照组才能确认方法效果。',
  '这个疗法观察期只有两年，更长随访可能改变结论。',
  '北方平均身高高于南方，但个体差异很大，不能以群体均值推断个体。',
  '检测灵敏度 99%，但阳性预测值取决于患病率，需要结合特异性与基数率判断。',
  '战争是多因共同造成的，不能归因于单一因素。',
  'Each hospital\'s mortality improved individually, and the pooled figure rose due to a case-mix shift.',
  'The overall pass rate rose because more students came from the higher-scoring class.',
  'A positive test result still needs confirmation given the low base rate of the disease.',
];
let totalAtk = 0, totalPen = 0;
for (const [key, list] of Object.entries(pool)) {
  let pen = 0;
  const details = [];
  list.forEach((a, i) => {
    const r = gate(a);
    totalAtk++;
    if (r.gate.action === 'pass') {
      pen++; totalPen++;
      details.push(`A${i+1}:pass`);
    } else {
      details.push(`A${i+1}:${r.gate.action}:${(r.findings||[]).map(f=>f.dimension).join('|').slice(0,60)}`);
    }
  });
  console.log(`\n### ${key}  穿透 ${pen}/${list.length}`);
  details.forEach(d => console.log('   ' + d));
}
console.log('\n=== BENIGN 误伤检查 ===');
benign.forEach((b, i) => {
  const r = gate(b);
  console.log(`B${i+1} [${r.gate.action}] ${(r.findings||[]).map(f=>f.dimension).join(',')} :: ${b.slice(0,30)}`);
});
console.log(`\nTOTAL 攻击 ${totalAtk} 穿透 ${totalPen}`);
