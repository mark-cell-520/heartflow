// 负例注入测试：intervention_effect_without_baseline（干预效果无对照宣告）第 278 维度（r437）
// 验证：攻击族全部命中 + 四组豁免全部 pass + 逐常量承重（负例测试之外的
// 同族变体矩阵由 scripts/round-437/ 下探针另行实测）。
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const m = require(path.join(__dirname, '..', 'src', 'intervention-effect-without-baseline.js'));
const { checkInterventionEffectWithoutBaseline } = m;

let passed = 0, failed = 0;
const failures = [];

function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(name + ': ' + e.message); }
}

// ============ 攻击族（正例，两腿/三腿共现）============

// 族1 中文——逗号并置形（干预分句 ∥ 效果分句，无显式连接词）
t('族1-ZH 上线新系统+满意度明显提升（逗号并置）', () => {
  const r = checkInterventionEffectWithoutBaseline('我们上线了新系统，客户满意度明显提升了。');
  assert.equal(r.hit, true);
});
t('族1-ZH 推行弹性工作制+流失率显著下降', () => {
  const r = checkInterventionEffectWithoutBaseline('团队推行了弹性工作制，员工流失率显著下降了。');
  assert.equal(r.hit, true);
});
t('族1-ZH 组织架构调整+效率大幅改善', () => {
  const r = checkInterventionEffectWithoutBaseline('公司做了组织架构调整，运营效率大幅改善了。');
  assert.equal(r.hit, true);
});

// 族2 中文——显式连接词形
t('族2-ZH 新政策实施以后+治安明显好转', () => {
  const r = checkInterventionEffectWithoutBaseline('新政策实施以后，治安状况明显好转了。');
  assert.equal(r.hit, true);
});
t('族2-ZH 开展课后服务+负担明显减轻', () => {
  const r = checkInterventionEffectWithoutBaseline('学校开展了课后服务，家长负担明显减轻了。');
  assert.equal(r.hit, true);
});
t('族2-ZH 部署补丁+故障率随之下降', () => {
  const r = checkInterventionEffectWithoutBaseline('补丁已经部署到生产环境，故障率随之下降了。');
  assert.equal(r.hit, true);
});

// 族3 中文——换主语/换指标（证明不是词表单点依赖）
t('族3-ZH 更换供应商+成本明显降低', () => {
  const r = checkInterventionEffectWithoutBaseline('我们更换了供应商，原材料成本明显降低了。');
  assert.equal(r.hit, true);
});
t('族3-ZH 新版App发布+日活大幅增长', () => {
  const r = checkInterventionEffectWithoutBaseline('新版App发布以后，日活跃用户大幅增长了。');
  assert.equal(r.hit, true);
});
t('族3-ZH 调整营销策略+获客成本显著下降', () => {
  const r = checkInterventionEffectWithoutBaseline('我们调整了营销策略，获客成本显著下降了。');
  assert.equal(r.hit, true);
});
t('族3-ZH 引进自动化设备+生产误差明显减少', () => {
  const r = checkInterventionEffectWithoutBaseline('引进了自动化设备，生产误差明显减少了。');
  assert.equal(r.hit, true);
});
t('族3-ZH 安全生产培训+事故数量大幅下降', () => {
  const r = checkInterventionEffectWithoutBaseline('开展了安全生产培训，事故数量大幅下降了。');
  assert.equal(r.hit, true);
});
t('族3-ZH 新绩效考核+积极性明显提高', () => {
  const r = checkInterventionEffectWithoutBaseline('实施了新的绩效考核，员工积极性明显提高了。');
  assert.equal(r.hit, true);
});

// 族4 英文
t('族4-EN CRM+sales improved dramatically', () => {
  const r = checkInterventionEffectWithoutBaseline('We implemented the new CRM and sales performance improved dramatically.');
  assert.equal(r.hit, true);
});
t('族4-EN productivity improved noticeably', () => {
  const r = checkInterventionEffectWithoutBaseline('We implemented the new CRM and sales team productivity improved noticeably.');
  assert.equal(r.hit, true);
});
t('族4-EN pricing launched+revenue grew significantly', () => {
  const r = checkInterventionEffectWithoutBaseline('The new pricing strategy was launched and revenue grew significantly.');
  assert.equal(r.hit, true);
});
t('族4-EN churn dropped noticeably', () => {
  const r = checkInterventionEffectWithoutBaseline('The new pricing strategy was launched and churn dropped noticeably.');
  assert.equal(r.hit, true);
});
t('族4-EN daily standups+delivery predictability improved markedly', () => {
  const r = checkInterventionEffectWithoutBaseline('We introduced daily standups and delivery predictability improved markedly.');
  assert.equal(r.hit, true);
});
t('族4-EN redesign shipped+engagement went up substantially', () => {
  const r = checkInterventionEffectWithoutBaseline('The redesign was shipped and user engagement went up substantially.');
  assert.equal(r.hit, true);
});
t('族4-EN new ops lead+incident counts fell sharply', () => {
  const r = checkInterventionEffectWithoutBaseline('We hired a new ops lead and incident counts fell sharply.');
  assert.equal(r.hit, true);
});

// ============ 豁免组（负例，必须零命中）============

// 豁免① 基线/对照纪律语言在场
t('豁免①-ZH 干预前后数值+报表', () => {
  const r = checkInterventionEffectWithoutBaseline('我们上线了新系统，客户满意度从80分提升到95分，数据见月度报表。');
  assert.equal(r.hit, false);
});
t('豁免①-ZH 前值后值+台账', () => {
  const r = checkInterventionEffectWithoutBaseline('团队推行了弹性工作制，员工流失率从18%降到9%，HR台账可查。');
  assert.equal(r.hit, false);
});
t('豁免①-ZH 对照组+随机分组', () => {
  const r = checkInterventionEffectWithoutBaseline('新流程上线后，处理时效明显加快了，我们有对照组和随机分组。');
  assert.equal(r.hit, false);
});
t('豁免①-ZH 测量口径+样本量', () => {
  const r = checkInterventionEffectWithoutBaseline('新的培训体系实施以后，考试合格率明显提高了，统计口径和样本量都记录在案。');
  assert.equal(r.hit, false);
});
t('豁免①-EN from-to 数值', () => {
  const r = checkInterventionEffectWithoutBaseline('We implemented the new CRM and sales went from 12 to 15 deals per month, per the dashboard.');
  assert.equal(r.hit, false);
});
t('豁免①-EN baseline/control group', () => {
  const r = checkInterventionEffectWithoutBaseline('We introduced daily standups and delivery predictability improved markedly in the control group.');
  assert.equal(r.hit, false);
});

// 豁免② 多因破除/归因谨慎
t('豁免②-ZH 受季节因素影响', () => {
  const r = checkInterventionEffectWithoutBaseline('客户满意度提升可能受季节因素影响，需要对照实验确认。');
  assert.equal(r.hit, false);
});
t('豁免②-ZH 多因共同影响', () => {
  const r = checkInterventionEffectWithoutBaseline('系统稳定性受多因共同影响，不能只归功于这次上线。');
  assert.equal(r.hit, false);
});
t('豁免②-EN confounded/multiple factors', () => {
  const r = checkInterventionEffectWithoutBaseline('Sales improved dramatically, but the results are confounded by multiple factors.');
  assert.equal(r.hit, false);
});

// 豁免③ 对冲/疑问
t('豁免③-ZH 可能+待观察', () => {
  const r = checkInterventionEffectWithoutBaseline('我们上线了新系统，客户满意度可能提升了，但还需要观察。');
  assert.equal(r.hit, false);
});
t('豁免③-EN not measured yet', () => {
  const r = checkInterventionEffectWithoutBaseline('We implemented the new CRM and sales performance improved, though we have not measured it yet.');
  assert.equal(r.hit, false);
});

// 豁免④ 统计教学/谬误分析转述
t('豁免④-ZH 谬误案例剖析', () => {
  const r = checkInterventionEffectWithoutBaseline('这是把一切改善归功于单一干预的谬误案例，课堂用来剖析归因偏误。');
  assert.equal(r.hit, false);
});
t('豁免④-EN fallacy case study', () => {
  const r = checkInterventionEffectWithoutBaseline('This is a typical example of the fallacy of attributing all improvement to one intervention.');
  assert.equal(r.hit, false);
});

// 边缘良性（正确多因陈述与无关句）
t('边缘良性：正确多因陈述', () => {
  const r = checkInterventionEffectWithoutBaseline('战争是多因共同造成的。');
  assert.equal(r.hit, false);
});
t('边缘良性：计划讨论句（无效果腿）', () => {
  const r = checkInterventionEffectWithoutBaseline('我们讨论一下上线新系统的计划。');
  assert.equal(r.hit, false);
});
t('边缘良性：无干预动作的纯事实变化', () => {
  const r = checkInterventionEffectWithoutBaseline('系统的性能提高了三倍。');
  assert.equal(r.hit, false);
});
t('边缘良性：无关日常句', () => {
  const r = checkInterventionEffectWithoutBaseline('今天天气很好，我们去公园散步。');
  assert.equal(r.hit, false);
});

// ============ 逐常量承重（枚举腿不许有空转常量）============

t('常量 INTERVENTION_ZH 上线', () => {
  assert.ok(m.__internals().INTERVENTION_ZH.test('我们上线了新系统'));
});
t('常量 INTERVENTION_ZH 开展', () => {
  assert.ok(m.__internals().INTERVENTION_ZH.test('开展了安全生产培训'));
});
t('常量 INTERVENTION_EN implemented', () => {
  assert.ok(m.__internals().INTERVENTION_EN.test('We implemented the new CRM'));
});
t('常量 METRIC_ZH 满意度', () => {
  assert.ok(m.__internals().METRIC_ZH.test('客户满意度明显提升了'));
});
t('常量 METRIC_ZH 事故', () => {
  assert.ok(m.__internals().METRIC_ZH.test('事故数量大幅下降了'));
});
t('常量 CHANGE_ZH 明显+提升', () => {
  assert.ok(m.__internals().CHANGE_ZH.test('明显提升'));
});
t('常量 CHANGE_ZH 大幅+下降', () => {
  assert.ok(m.__internals().CHANGE_ZH.test('大幅下降'));
});
t('常量 METRIC_EN churn', () => {
  assert.ok(m.__internals().METRIC_EN.test('churn dropped noticeably'));
});
t('常量 CHANGE_EN dramatically', () => {
  assert.ok(m.__internals().CHANGE_EN.test('improved dramatically'));
});
t('常量 CONNECTION_ZH 之后', () => {
  assert.ok(m.__internals().CONNECTION_ZH.test('实施以后，治安好转'));
});
t('常量 CONNECTION_EN and', () => {
  assert.ok(m.__internals().CONNECTION_EN.test('shipped and engagement went up'));
});
t('常量 EXEMPT_BASELINE_ZH 从X到Y', () => {
  assert.ok(m.__internals().EXEMPT_BASELINE_ZH.test('满意度从80分提升到95分'));
});
t('常量 EXEMPT_MULTICAUSE_ZH 多因', () => {
  assert.ok(m.__internals().EXEMPT_MULTICAUSE_ZH.test('受多因共同影响'));
});

// ============ 射程划界：属别维度射程的样本本维度不判 ============

t('射程划界：空完成宣称归 completion_evidence（无效果变化腿）', () => {
  const r = checkInterventionEffectWithoutBaseline('这个问题已经修复了，全部完成了。');
  assert.equal(r.hit, false);
});
t('射程划界：比例结果疗效断言归 baseline_omission 射程（无干预动作腿）', () => {
  const r = checkInterventionEffectWithoutBaseline('该药的治愈率明显高于对照组以外的历史水平。');
  assert.equal(r.hit, false);
});
t('射程划界：宣称核验完成归 claimed_verification_without_trail', () => {
  const r = checkInterventionEffectWithoutBaseline('我们已经核实过这个数字，确认无误。');
  assert.equal(r.hit, false);
});

// ============ 报告 ============
console.log('intervention_effect_without_baseline 负例注入测试: ' + passed + ' passed / ' + (passed + failed) + ' total');
if (failures.length) {
  console.log('FAILED:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
