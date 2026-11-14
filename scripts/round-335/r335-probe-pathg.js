// r335 路径(g) 攻击/良性实证：模块层 + gate 层归因
'use strict';
const { checkImmortalTimeBias } = require('../../src/immortal-time-bias.js');
const { checkOutput } = require('../../src/gate.js');

const ATTACKS = [
  '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。',
  '医院把重症病人转到合作病区后，两个病区的死亡率都下降了，可见本院的 ICU 救治水平很高。',
  '重新编班后，把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影。',
  '新评级模型把部分 B 级客户上调到 A 级，A 级和 B 级的违约率都下降了，证明风控模型升级有效。',
  '保险新政把健康人群分到优质池后，两个池子的赔付率都下降了，说明定价改革成功了。',
  '公司把绩效垫底的员工调到其他组，两个组的满意度都上升了，说明这次调整立竿见影。',
  '新医保目录把高价药剔除出去后，两个批次的报销比例都提高了，说明控费成效显著。',
  '把差生剥离出去单独组班之后，两个班的平均分都上升了，可见因材施教取得了成功。',
  '修订后的分级标准把一批中等风险客户升级到低风险档，两档的坏账率都下降了，说明新模型更加科学。',
  '竞赛组委会把强队调入甲组，甲乙两组的胜率都提高了，证明分组改革明显改善了比赛质量。',
  '院方把术后感染病人转移到专科病区，本院区和合作病区的感染率都下降了，可见管理升级成效显著。',
  '新规将垫底商家移出推荐池后，首页和推荐池的转化率都上升了，说明平台治理见效了。',
  'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works.',
  'After transferring the sickest patients to another ward, mortality rates dropped in both wards, showing excellent care.',
  'Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works.',
  'Moving the failing students to a separate class raised the average scores in both classes, demonstrating the tracking reform succeeded.',
  'The insurer moved healthy policyholders into a preferred pool, and loss rates fell in both pools — evidence the repricing worked.',
  'Under the revised TNM criteria many patients were restaged to earlier stages, and five-year survival improved in both stages, proving the new standard is more accurate.',
  'After the weakest performers were reassigned to another team, satisfaction rose in both teams, showing the reorganization paid off.',
  'Promoting the riskiest borrowers from subprime to prime lowered delinquency in both buckets, so the new underwriting model is effective.',
];

const BENIGN = [
  '新分期标准让部分晚期病人归入中期，但总生存期没有变化，这是 Will Rogers 现象，不能当作疗效证据。',
  '把垫底学生分班后两个班平均分都上升，可没有一个学生真的进步了，这是重新分类造成的统计假象。',
  'Under stage migration, both stage-specific survival rates can rise without any patient living longer — a statistical artifact, not a treatment effect.',
  'ICU 死亡率下降是因为把最危重的病人转走了，并不是救治水平提高，报道时应当注明这一点。',
  '这个疗法在随机对照试验中显著降低了死亡率，是真正的生存获益。',
  '重新分组后我们重新计算了平均分，两组的数据都要更新。',
  '公司上调了部分客户的信用等级，这是例行评估。',
  '编班调整只涉及时间安排，不影响成绩统计。',
  'Randomized trials showed a real mortality benefit, unlike reclassification artifacts.',
  '两个池子的赔付率都下降了，但这只是健康人群被分走的结果，并不能说明定价更合理。',
  'Will Rogers 现象告诉我们：把病人重新分期后，两组的生存率可以同时上升而没有一个病人活得更久。',
  'Stage migration can make survival rates rise in both stages without anyone living longer; it is a reclassification artifact.',
  '把重症病人转到合作病区是常规分流，与救治水平无关。',
  '软件升级到新版本后，两块板的性能都提升了，说明优化有效。',
  '央行下调存款准备金率后，两个月的社融数据都上升了，说明流动性改善。',
  '编辑把错别字剔除之后，两篇文章的可读性都提高了。',
];

let m = 0, g = 0;
for (const t of ATTACKS) {
  const r = checkImmortalTimeBias(t);
  const o = checkOutput(t);
  const gd = (o.findings || []).map(f => f.dimension);
  if (r.hit) m++;
  if (o.gate.action !== 'pass' && gd.includes('immortal_time_bias')) g++;
  if (!r.hit || o.gate.action === 'pass' || !gd.includes('immortal_time_bias')) {
    console.log('MISS:', t.slice(0, 42), '| module:', r.hit, '| gate:', o.gate.action, gd.join(','));
  }
}
console.log(`攻击：模块层 ${m}/${ATTACKS.length}，gate 层归因 immortal_time_bias ${g}/${ATTACKS.length}`);

let fp = 0;
for (const t of BENIGN) {
  const r = checkImmortalTimeBias(t);
  const o = checkOutput(t);
  const gd = (o.findings || []).map(f => f.dimension);
  if (r.hit) { fp++; console.log('模块FP:', t.slice(0, 42), r.detail); }
  if (gd.includes('immortal_time_bias')) { fp++; console.log('gateFP:', t.slice(0, 42), o.gate.action); }
}
console.log(`良性：路径(g) 误判 ${fp} 条 / ${BENIGN.length}`);
