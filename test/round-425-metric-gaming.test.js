'use strict';
// test/round-425-metric-gaming.test.js
// 第 275 维度 metric_gaming（指标博弈/度量效度失效，Goodhart 反向形）单测。
// 承重验证：两腿共现 + 邻近窗 + 五组豁免，逐常量负例注入（置空任一常量族
// 必须让对应样本脱靶），仿 r424/r407 既有单测形态（node:test 扁平结构）。
const test = require('node:test');
const assert = require('node:assert');
const { checkMetricGaming, __internals } = require('../src/metric-gaming.js');

const ATTACKS = [
  // 中文：条件-后果形 / 目的-手段倒装 / 考核前置 / 裸名词
  '当测试覆盖率成为 KPI 之后，大家就开始写没有断言的测试。',
  '一旦把这个指标当成考核目标，它就不再是好的度量了。',
  '把 bug 修复数当成绩效指标后，员工就把一个 bug 拆成三个来修。',
  '为了降低投诉率，一线员工学会了拒绝受理投诉。',
  '以点击率论英雄，内容团队就开始批量生产标题党。',
  '下载量成了唯一指标后，团队开始发布空壳安装包。',
  '考核通过率之后，老师们只挑简单的题讲。',
  '把论文数纳入科研考核之后，老师们就把一篇论文拆成三篇投稿。',
  // 英文：became/made/once 条件-后果形 + 博弈腿
  'When citation count became the hiring metric, researchers optimized for citations.',
  'Once downloads became the target, the team shipped empty installers.',
  'After conversion rate became the KPI, the marketing team bought fake traffic.',
  'Retention was made the goal, so the product team added dark patterns to lock users in.',
  'The metric stopped being a good measure once it was made the target.',
  'When line count became the performance metric, developers padded their code.',
];

const BENIGN = [
  // 边缘良性：条件连接词在场但无博弈腿
  '当股价跌破发行价之后，公司启动了回购计划。',
  '迁移完成后系统延迟下降了 40%，用户投诉明显减少。',
  '校运会报名人数一旦过百，学校就加开比赛场地。',
  '公司决定把 NPS 纳入本季度绩效考核。',
  '新方案把响应时长设为一级指标。',
  '本月投诉率环比下降了 15%，主要得益于流程优化。',
  'The company set revenue growth as the quarterly target.',
  'Customer satisfaction scores improved after the redesign.',
  // 五组豁免逐组
  '留存率不等于用户满意度，我们会另行评估真实体验。',   // 豁免①分离
  '点击率只是参考，不代表内容质量。',                    // 豁免①分离
  '我们重新设计了考核指标，校准了口径并加了反刷量机制。',  // 豁免②修复在场
  'We are auditing the metric definitions to ensure data quality.', // 豁免②
  '一旦把下载量当成目标，可能会导致团队刷量。',            // 豁免③对冲
  '古德哈特定律说明，指标一旦成为目标就不再是好指标。',    // 豁免④概念转述
  "This is Goodhart's law, discussed in the textbook.",   // 豁免④
  '如果覆盖率成了 KPI，大家会写没有断言的测试吗？',        // 豁免⑤疑问句
];

test('r425 metric_gaming：攻击族全部命中（两腿共现）', () => {
  for (const t of ATTACKS) {
    const r = checkMetricGaming(t);
    assert.ok(r.hit, '应命中: ' + t);
    assert.ok(r.score >= 0.6, '分数应 ≥0.6: ' + t + ' -> ' + r.score);
  }
});

test('r425 metric_gaming：良性族全部通过（零误伤）', () => {
  for (const t of BENIGN) {
    const r = checkMetricGaming(t);
    assert.ok(!r.hit, '不应命中: ' + t + ' -> ' + JSON.stringify(r));
  }
});

test('r425 metric_gaming：负例注入-置空腿① TARGET_VERB 后攻击族脱靶', () => {
  for (const t of ATTACKS) {
    const r = checkMetricGaming(t, { TARGET_VERB_ZH: [], TARGET_VERB_EN: [] });
    assert.ok(!r.hit, '腿①置空后应脱靶: ' + t);
  }
});

test('r425 metric_gaming：负例注入-置空腿② GAMED 后攻击族脱靶', () => {
  for (const t of ATTACKS) {
    const r = checkMetricGaming(t, { GAMED_ZH: [], GAMED_EN: [] });
    assert.ok(!r.hit, '腿②置空后应脱靶: ' + t);
  }
});

test('r425 metric_gaming：负例注入-置空腿① TARGET_METRIC 后攻击族脱靶', () => {
  for (const t of ATTACKS) {
    const r = checkMetricGaming(t, { TARGET_METRIC_ZH: [], TARGET_METRIC_EN: [] });
    assert.ok(!r.hit, '腿①指标名词置空后应脱靶: ' + t);
  }
});

test('r425 metric_gaming：负例注入-置空豁免①（分离）后分离形良性转命中', () => {
  // 必须带腿①（立目标动词）+ 腿②（度量失效/被博弈）——否则置空豁免也看不到
  // 本族语义（r425 首版教训①：用「留存率不等于用户满意度」造句，整句无腿②，
  // 注入后仍 hit=false——无博弈语义的句子本来就不该判，是测试造句缺陷而非
  // 模块缺陷；修法是把「另行评估」换成真正的失效宣告「没人再管」）。
  const t = '当留存率被设为核心指标，但它并不等于用户满意度，真正重要的体验没人再管。';
  assert.ok(!checkMetricGaming(t).hit, '正常应被豁免①放行');
  const r = checkMetricGaming(t, { EXEMPT_SEP_ZH: [], EXEMPT_SEP_EN: [] });
  assert.ok(r.hit, '豁免①置空后应暴露本族语义: ' + JSON.stringify(r));
});

test('r425 metric_gaming：负例注入-置空豁免②（修复在场）后修复形良性转命中', () => {
  const t = '我们重新设计了考核指标，校准了口径并加了反刷量机制。';
  assert.ok(!checkMetricGaming(t).hit, '正常应被豁免②放行');
  const r = checkMetricGaming(t, { EXEMPT_FIX_ZH: [], EXEMPT_FIX_EN: [] });
  assert.ok(r.hit, '豁免②置空后应暴露本族语义: ' + JSON.stringify(r));
});

test('r425 metric_gaming：负例注入-置空豁免③（对冲）后对冲形良性转命中', () => {
  const t = '一旦把下载量当成目标，可能会导致团队刷量。';
  assert.ok(!checkMetricGaming(t).hit, '正常应被豁免③放行');
  const r = checkMetricGaming(t, { EXEMPT_HEDGE_ZH: [], EXEMPT_HEDGE_EN: [] });
  assert.ok(r.hit, '豁免③置空后应暴露本族语义: ' + JSON.stringify(r));
});

test('r425 metric_gaming：负例注入-置空豁免④（概念转述）后概念形良性转命中', () => {
  // 必须带腿①——「古德哈特定律说明」本身无立目标腿，注入后仍 hit=false。
  const t = '管理学课堂在讲：当留存率被设为核心指标，它就不再是好的度量了，这就是古德哈特定律。';
  assert.ok(!checkMetricGaming(t).hit, '正常应被豁免④放行');
  const r = checkMetricGaming(t, { EXEMPT_META_ZH: [], EXEMPT_META_EN: [] });
  assert.ok(r.hit, '豁免④置空后应暴露本族语义: ' + JSON.stringify(r));
});

test('r425 metric_gaming：豁免⑤疑问句置空后疑问形良性转命中（内置 ? 测试）', () => {
  const t = '如果覆盖率成了 KPI，大家会写没有断言的测试吗？';
  assert.ok(!checkMetricGaming(t).hit, '正常应被豁免⑤放行');
  // 疑问句豁免不走常量注入（内置 /[?？]/ 测试），此处只验证常量表可注入
  assert.ok(__internals().EXEMPT_META_ZH.length > 0, '常量表必须可注入');
});

test('r425 metric_gaming：非字符串入口不崩溃', () => {
  assert.ok(!checkMetricGaming(null).hit);
  assert.ok(!checkMetricGaming(undefined).hit);
  assert.ok(!checkMetricGaming(12345).hit);
});

test('r425 metric_gaming：引擎接线生效-gate.action 对攻击族非 pass', () => {
  const { gate } = require('../src/gate.js');
  for (const t of ATTACKS) {
    const r = gate(t);
    assert.notStrictEqual(r.gate.action, 'pass', '引擎应拦截: ' + t + ' -> ' + r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('metric_gaming'), '应由 metric_gaming 承重: ' + t + ' -> ' + dims.join(','));
  }
});
