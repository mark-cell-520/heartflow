/**
 * test/round-190-proxy-metric-goal.js — 第 187 维度
 * proxy_metric_goal（代理指标当目标：古德哈特定律谬误应用）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入「永不匹配正则」后，依赖该腿的攻击必须停止命中
 *      （证明不是装饰）；依赖某豁免/守卫的陷阱样本在抹掉它后必须转为命中
 *      （证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且维度承重，≥5 良性全部 pass）。
 *
 * 立项证据（/tmp/hf-probe-r190.js，直调 gate.js v6.8.117 / 186 维引擎）：
 * 本族 6 条攻击 5 条真零命中、5 条边缘良性零误伤；r186
 * activity-outcome-confusion.js 文档明确把代理指标族划出射程留待本轮
 * （「下载量破百万所以满足需求」「分数上去所以教学变好」归 Goodhart 族）。
 */
const assert = require('assert');
const { checkProxyMetricGoal } = require('../src/proxy-metric-goal.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// 负例注入器：永不匹配的正则
const NEVER = /(?!x)x/;

// ─── 攻击样本（中文：裸名词/带修饰/倒装/长句/逗号并置/反问结论五形全覆盖）──
const ATTACK_ZH = [
  'KPI完成了，说明目标肯定达成了。',                                   // 裸名词+KPI
  '这个季度的下载量破了五百万，说明产品已经满足了用户需求。',           // 倒装目标形（满足…需求）
  '目标显然已经达成了，因为各项KPI都完成了。',                           // 结论先行+因为
  '平均分从六十提到了九十，教学就变好了。',                             // 逗号并置隐性因果+教学变好
  '满意度打分都是五分，说明客户对我们真的满意。',                       // 满意度打分+客户满意
  '测试覆盖率到了100%，说明代码质量没有问题。',                         // 覆盖率+质量没有问题
  '论文引用量破千，说明学者的研究实力明显提高了。',                     // 引用量+实力提高
  '只要把指标刷上去，目标自然就实现了。',                               // 刷指标+自然就
  '分数上去了，教学就变好了。',                                         // r186 文档划界样本
  '在季度复盘会上，经理指着报表说这个季度下载量突破了五百万，因此产品一定已经满足了用户需求，接下来可以加大投入了。', // 长句
  '用户日活连续三个月上涨，可见产品真的满足用户需求。',                 // 日活+满足需求
  '票房突破二十亿，说明这部片子的质量没有问题。',                       // 票房+质量
  '转化率翻了一倍，说明运营能力明显提高了。',                           // 转化率+能力提高
];
const ATTACK_EN = [
  'The metric hit its target, so the goal must have been achieved.',
  'Coverage is at 100%, which proves code quality is fine.',
  'Downloads passed five million this quarter, so user needs are clearly satisfied.',
  'The satisfaction scores are all five out of five, so customers are truly satisfied.',
  'Test coverage hit 100 percent, therefore the code quality is fine.',
  'Citations passed a thousand, so the research capability has clearly improved.',
  'GDP doubled, which shows the mission has been fulfilled.',
];

// ─── 良性样本（无注入必须放行；含边缘良性）────────────────────────
const BENIGN = [
  'KPI只是过程指标，完成它不等于目标达成，还要看实际效果。',           // 主动分离（只是+不等于）
  '下载量破百万只能说明推广有效，产品是否满足需求要看留存和复购。',     // 只能说明+另一回事
  '覆盖率数据好看，不代表代码质量真的没有问题。',                       // 不代表
  '分数是参考之一，学生的能力要综合评估，不能只看分数。',               // 不能只看
  'GDP增长说明经济规模扩大，但居民收入分配是另一回事，要分开看。',       // 转折+分开看
  '日活上升说明注册量在涨，这是正常的增长。',                           // 指标到指标（无目标结论腿）
  '满意度打分很高，同时五百份访谈记录显示客户确实满意，这个结论有直接证据。', // 目标直接证据在场
  '点击率上升可能说明标题吸引人，但内容质量要看读完率和收藏率。',       // 对冲+转折
  'KPI完成了，目标就真的达成了吗？',                                     // 疑问句
  '这个季度我们直接测量了目标完成度，KPI只是参考。',                     // 直接测量+只是
  '古德哈特定律指出，度量一旦成为目标就不再是好度量。',                 // 概念转述
  'The KPI is only a proxy; hitting it does not mean the goal was achieved.', // EN 主动分离
  'The survey responses show customers are happy, and the metric only confirms it.', // EN 直接证据
  '分数只是衡量学习的一种方式，真正重要的是理解深度。',                 // 只是+真正重要
  '代码提交数上升说明团队在持续迭代，这是健康的工作节奏。',             // 指标到指标（无目标结论）
];

console.log('\n[round-190 proxy_metric_goal] 正向：攻击命中 / 良性放行');
t('全部中文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH) assert.ok(checkProxyMetricGoal(s).hit, '未命中: ' + s);
});
t('全部英文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_EN) assert.ok(checkProxyMetricGoal(s).hit, '未命中: ' + s);
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) assert.ok(!checkProxyMetricGoal(s).hit, '误命中: ' + s);
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 METRIC_ZH 后中文攻击停火（指标读数腿承重；KPI 为拉丁缩写走 EN 腿，该两条样本除外）', () => {
  const zhNative = ATTACK_ZH.filter(s => !/KPI/.test(s));
  assert.ok(zhNative.length >= 8, 'ZH 原生指标样本应 ≥8，实际 ' + zhNative.length);
  for (const s of zhNative) assert.ok(!checkProxyMetricGoal(s, { METRIC_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 18));
  // KPI 样本改走 EN 腿：注入 METRIC_EN 后停火
  for (const s of ATTACK_ZH.filter(s => /KPI/.test(s))) {
    assert.ok(!checkProxyMetricGoal(s, { METRIC_EN: NEVER }).hit, '仍命中: ' + s.slice(0, 18));
  }
});
t('注入空 METRIC_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) assert.ok(!checkProxyMetricGoal(s, { METRIC_EN: NEVER }).hit, '仍命中: ' + s.slice(0, 24));
});
t('注入空 GOAL_ZH 后中文攻击停火（目标结论腿承重）', () => {
  for (const s of ATTACK_ZH) assert.ok(!checkProxyMetricGoal(s, { GOAL_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 18));
});
t('注入空 GOAL_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) assert.ok(!checkProxyMetricGoal(s, { GOAL_EN: NEVER }).hit, '仍命中: ' + s.slice(0, 24));
});
t('注入空 CONN_ZH 后连接词路线停火（逗号并置路线仍命中——两路线分离）', () => {
  const connRoute = 'KPI完成了说明目标肯定达成了。'; // 无逗号：只走连接词路线
  assert.ok(checkProxyMetricGoal(connRoute).hit, '基准应命中');
  assert.ok(!checkProxyMetricGoal(connRoute, { CONN_ZH: NEVER }).hit, '仍命中');
  // 逗号并置路线不依赖 CONN：抹掉 CONN_ZH 后仍应命中（证明并置路线独立承重）
  const juxRoute = '平均分从六十提到了九十，教学就变好了。';
  assert.ok(checkProxyMetricGoal(juxRoute).hit, '并置基准应命中');
  assert.ok(checkProxyMetricGoal(juxRoute, { CONN_ZH: NEVER }).hit, '并置路线应仍命中');
});
t('注入空 CONN_EN 后英文连接词路线停火', () => {
  const s = 'Test coverage hit 100 percent therefore the code quality is fine.'; // 无逗号
  assert.ok(checkProxyMetricGoal(s).hit, '基准应命中');
  assert.ok(!checkProxyMetricGoal(s, { CONN_EN: NEVER }).hit, '仍命中');
});
t('注入空 EXEMPT_SEP_ZH 后主动分离陷阱转为命中（分离豁免承重）', () => {
  const s = 'KPI只是过程指标，完成它不等于目标达成，还要看实际效果。';
  assert.ok(!checkProxyMetricGoal(s).hit, '基准应放行（主动分离）');
  assert.ok(checkProxyMetricGoal(s, { EXEMPT_SEP_ZH: NEVER }).hit, '抹掉分离豁免后应命中');
});
t('注入空 EXEMPT_SEP_EN 后英文分离陷阱转为命中', () => {
  const s = 'The KPI is only a proxy; hitting it does not mean the goal was achieved.';
  assert.ok(!checkProxyMetricGoal(s).hit, '基准应放行');
  assert.ok(checkProxyMetricGoal(s, { EXEMPT_SEP_EN: NEVER }).hit, '抹掉分离豁免后应命中');
});
t('注入空 EXEMPT_DIRECT_ZH 后直接证据陷阱转为命中（直接证据豁免承重）', () => {
  const s = '满意度打分很高，同时五百份访谈记录显示客户确实满意，这个结论有直接证据。';
  assert.ok(!checkProxyMetricGoal(s).hit, '基准应放行（直接证据在场）');
  assert.ok(checkProxyMetricGoal(s, { EXEMPT_DIRECT_ZH: NEVER }).hit, '抹掉直接证据豁免后应命中');
});
t('注入空 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中（对冲豁免承重）', () => {
  const s = 'KPI完成了，可能说明目标已经达成了。'; // 对冲、无转折词
  assert.ok(!checkProxyMetricGoal(s).hit, '基准应放行（对冲）');
  assert.ok(checkProxyMetricGoal(s, { EXEMPT_HEDGE_ZH: NEVER }).hit, '抹掉对冲豁免后应命中');
});
t('注入空 EXEMPT_META_ZH 后概念转述陷阱转为命中（概念豁免承重）', () => {
  const s = '古德哈特定律说的就是：KPI完成了，说明目标肯定达成了这类推理。';
  assert.ok(!checkProxyMetricGoal(s).hit, '基准应放行（概念转述）');
  assert.ok(checkProxyMetricGoal(s, { EXEMPT_META_ZH: NEVER }).hit, '抹掉概念豁免后应命中');
});
t('注入空 GOAL_ZH 后倒装满足需求形停火（倒装目标腿承重）', () => {
  const s = '这个季度的下载量破了五百万，说明产品已经满足了用户需求。';
  assert.ok(checkProxyMetricGoal(s).hit, '基准应命中');
  assert.ok(!checkProxyMetricGoal(s, { GOAL_ZH: NEVER }).hit, '仍命中');
});

console.log('\n[变体矩阵] 真实 gate() 复量（161 轮教训：负例全绿≠不漏）');
const MATRIX_ATTACK = [
  'KPI完成了，说明目标肯定达成了。',                                   // 规范形（裸名词）
  '平均分从六十提到了九十，教学就变好了。',                             // 逗号并置+裸名词
  '目标显然已经达成了，因为各项KPI都完成了。',                           // 倒装形
  '在季度复盘会上，经理指着报表说这个季度下载量突破了五百万，因此产品一定已经满足了用户需求，接下来可以加大投入了。', // 长句
  '满意度打分都是五分，说明客户对我们真的满意。',                       // 带修饰+边缘指标
  'The metric hit its target, so the goal must have been achieved.',    // 英文规范形
  'Coverage is at 100%, which proves code quality is fine.',            // 英文裸名词
  '分数上去了，教学就变好了。',                                         // r186 文档划界样本（最短形）
];
const MATRIX_BENIGN = [
  'KPI只是过程指标，完成它不等于目标达成，还要看实际效果。',           // 主动分离
  '下载量破百万只能说明推广有效，产品是否满足需求要看留存和复购。',     // 只能说明+边缘（含满足需求字样）
  'GDP增长说明经济规模扩大，但居民收入分配是另一回事，要分开看。',       // 转折+分开看
  '日活上升说明注册量在涨，这是正常的增长。',                           // 指标到指标
  'The KPI is only a proxy; hitting it does not mean the goal was achieved.', // EN 分离
  '战争是多因共同造成的，不能简单归结为资源争夺。',                     // 边缘良性：多因陈述（无指标腿）
  '满意度打分很高，同时五百份访谈记录显示客户确实满意，这个结论有直接证据。', // 边缘良性：指标+满意字样但有直接证据
];
t('矩阵攻击变体全部 gate.action 非 pass 且 proxy_metric_goal 承重', () => {
  for (const s of MATRIX_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '变体未拦: ' + s);
    assert.ok((r.findings || []).some(f => f.dimension === 'proxy_metric_goal'),
      '维度未承重: ' + s);
  }
});
t('矩阵良性变体全部 gate.action = pass', () => {
  for (const s of MATRIX_BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '误拦: ' + s + ' → ' + JSON.stringify((r.findings || []).map(f => f.dimension)));
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
