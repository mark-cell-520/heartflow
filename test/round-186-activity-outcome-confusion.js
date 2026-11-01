/**
 * test/round-186-activity-outcome-confusion.js — 第 184 维度
 * activity_outcome_confusion（活动/投入当成果：以工代果）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该腿的攻击必须停止命中（证明不是
 *      装饰）；依赖某豁免的陷阱样本在抹掉该豁免后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass，
 * ≥5 良性全部 pass）。
 */
const assert = require('assert');
const { checkActivityOutcomeConfusion } = require('../src/activity-outcome-confusion.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（可计数活动名词腿）────────────────────────────────────
const ATTACK_STRONG = [
  '我们开了 50 场会、发了 100 份文件，所以项目推进得很好。',
  '代码写了几万行，可见进展巨大。',
  '今年走访了几百户群众，因此基层工作成效显著。',
  '培训办了几十期，可见人才培养卓有成效。',
  '邮件发了好几百封，足以说明沟通推进得很顺利。',
  '报告堆成了山，可见绩效十分突出。',
  '仅开会就开了上百场，足以证明工作落实有力。',
];
// 攻击样本（泛指投入腿：投入/付出 + 强度标记；句中无任何可计数活动名词）
const ATTACK_EFFORT = [
  '公司投入了大量人力物力，项目进展十分顺利。',
  '团队长期投入了大量精力，项目成效显著。',
];
const ATTACK_EN = [
  'We held dozens of meetings, so the project is clearly on track.',
  'The team pulled countless all-nighters, which shows remarkable results.',
  'We sent thousands of emails, therefore outreach is highly effective.',
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '会议只是过程，关键要看交付物和用户反馈，不能只看开了多少会。',   // 正确分离
  '加班多不等于产出高，我们要看实际完成的需求和数据指标。',         // 拒绝推断/正确分离
  '代码行数不代表进度，功能交付和缺陷率才是有效度量。',             // 正确分离
  'Meeting count is an activity metric; outcomes are what matter.', // EN 正确分离
  '忙碌不等于高效，得看最终解决了什么问题。',                       // 正确分离
  '我们开了 50 场会，交付了 3 个模块，项目推进得很好。',            // 具体成果在场
  '团队加班三个月，系统终于按时上线了，进展顺利。',                 // 具体成果在场
  '投入研发需要时间，可能会有突破，但不一定。',                     // 对冲
  '用户真正获得价值才是目标，停留时长只是过程。',                   // 正确分离（才是…目标）
  'Engagement time is only a proxy; real user value is the actual goal.', // EN 分离
  '投入了大量研发，产品成功占领了市场，收入翻倍。',                 // 具体成果在场（收入）
  '为什么开了这么多会，项目还是没有进展？',                         // 疑问句
  '他虽然开了很多会，但是项目进展并不顺利。',                       // 转折并置（反向陈述）
];

console.log('\n[round-186 activity_outcome_confusion] 正向：攻击命中 / 良性放行');
t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_STRONG.concat(ATTACK_EFFORT, ATTACK_EN)) {
    const r = checkActivityOutcomeConfusion(s);
    assert.ok(r.hit, '未命中: ' + s);
  }
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    const r = checkActivityOutcomeConfusion(s);
    assert.ok(!r.hit, '误命中: ' + s);
  }
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 ACT_ZH 后可计数活动名词攻击停火', () => {
  for (const s of ATTACK_STRONG) {
    assert.ok(!checkActivityOutcomeConfusion(s, { ACT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 EFFORT_ZH 后泛指投入攻击停火', () => {
  for (const s of ATTACK_EFFORT) {
    assert.ok(!checkActivityOutcomeConfusion(s, { EFFORT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 INTENSITY_ZH 后泛指投入攻击停火（投入词无强度标记不算）', () => {
  for (const s of ATTACK_EFFORT) {
    assert.ok(!checkActivityOutcomeConfusion(s, { INTENSITY_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 OUT_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_STRONG.concat(ATTACK_EFFORT)) {
    assert.ok(!checkActivityOutcomeConfusion(s, { OUT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 CONN_ZH 后「无逗号+显式连接词」攻击停火（证明连接词承重）', () => {
  // 该样本两腿间只有显式连接词、无逗号并置，抹掉 CONN 后既不满足连接词、
  // 也不满足并置，必须停火——证明 CONN 常量在承重而非并置兜底。
  const s = '我们发了50份文件所以项目推进得很好。';
  assert.ok(checkActivityOutcomeConfusion(s).hit, '基准应命中');
  assert.ok(!checkActivityOutcomeConfusion(s, { CONN_ZH: [] }).hit, '仍命中');
});
t('注入空 ACT_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkActivityOutcomeConfusion(s, { ACT_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 OUT_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkActivityOutcomeConfusion(s, { OUT_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 CONN_EN 后「无逗号+显式连接词」英文攻击停火（证明连接词承重）', () => {
  // 无逗号、仅靠 so 连接；抹掉 CONN_EN 后无连接词亦无并置，必须停火。
  const s = 'We held dozens of meetings so the project is clearly on track.';
  assert.ok(checkActivityOutcomeConfusion(s).hit, '基准应命中');
  assert.ok(!checkActivityOutcomeConfusion(s, { CONN_EN: [] }).hit, '仍命中');
});

console.log('\n[承重] 豁免腿：诸腿俱在的陷阱样本，抹掉对应豁免必须转为命中');
// 三条陷阱：活动腿×抽象成果腿×因果连接俱在，各被一条豁免正确放行
const TRAP_SEP = '我们开了 50 场会，项目推进得很好，会议只是对齐信息的过程，关键要看最终的产出。';
const TRAP_CONCRETE = '我们开了 50 场会，所以项目推进得很好，期间交付了 3 个模块。';
const TRAP_HEDGE = '我们开了 50 场会，所以项目可能推进得不错。';
t('三条陷阱无注入时放行', () => {
  for (const s of [TRAP_SEP, TRAP_CONCRETE, TRAP_HEDGE]) {
    assert.ok(!checkActivityOutcomeConfusion(s).hit, '陷阱被误命中: ' + s);
  }
});
t('抹掉 EXEMPT_SEP_ZH 后正确分离陷阱转为命中', () => {
  assert.ok(checkActivityOutcomeConfusion(TRAP_SEP, { EXEMPT_SEP_ZH: [] }).hit);
});
t('抹掉 EXEMPT_CONCRETE_ZH 后具体成果陷阱转为命中', () => {
  assert.ok(checkActivityOutcomeConfusion(TRAP_CONCRETE, { EXEMPT_CONCRETE_ZH: [] }).hit);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.ok(checkActivityOutcomeConfusion(TRAP_HEDGE, { EXEMPT_HEDGE_ZH: [] }).hit);
});

console.log('\n[变体矩阵] 真实 gate() 复量（161 轮教训：负例全绿≠不漏）');
// 同族攻击变体：中英双语 / 裸名词 / 带修饰 / 逗号并置 / 长句
const VARIANT_ATTACK = [
  '我们开了 50 场会、发了 100 份文件，所以项目推进得很好。',                 // 基准形
  '代码写了几万行，可见进展巨大。',                                          // 裸名词形
  '团队天天加班到深夜，说明大家成绩显著。',                                  // 带修饰
  '今年走访了几百户群众，足以证明基层工作卓有成效。',                        // 逗号并置+足证
  '公司投入了大量人力物力，项目进展十分顺利。',                              // 泛指投入+强度+并置
  'We held dozens of meetings, so the project is clearly on track.',         // EN
];
// 同族良性（含边缘良性：正确分离 / 具体成果在场 / 泛指投入+具体成果）
const VARIANT_BENIGN = [
  '会议只是过程，关键要看交付物和用户反馈，不能只看开了多少会。',            // 边缘良性：正确分离
  '我们开了 50 场会，交付了 3 个模块，项目推进得很好。',                     // 边缘良性：具体成果在场
  '投入了大量研发，产品成功占领了市场，收入翻倍。',                          // 边缘良性：投入+具体成果
  'Meeting count is an activity metric; outcomes are what matter.',          // EN 良性
  '加班多不等于产出高，我们要看实际完成的需求和数据指标。',                  // 拒绝推断
];
t('变体矩阵：≥5 攻击变体全部 gate.action 非 pass', () => {
  assert.ok(VARIANT_ATTACK.length >= 5, '攻击变体不足 5 个');
  for (const s of VARIANT_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '变体未拦截: ' + s + ' → ' + r.gate.action);
  }
});
t('变体矩阵：≥5 良性样本全部 gate.action = pass', () => {
  assert.ok(VARIANT_BENIGN.length >= 5, '良性样本不足 5 个');
  for (const s of VARIANT_BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '良性被误拦: ' + s + ' → ' + r.gate.action + ' / ' + JSON.stringify(r.findings && r.findings.map(f => f.dimension)));
  }
});
t('新维度在 gate 结果中可读（findings 含 activity_outcome_confusion）', () => {
  const r = gate('我们开了 50 场会、发了 100 份文件，所以项目推进得很好。');
  const inFindings = (r.findings || []).some(f => f.dimension === 'activity_outcome_confusion');
  assert.ok(inFindings, 'gate findings 中读不到 activity_outcome_confusion');
});
t('登记断言：checkActivityOutcomeConfusion 已从 index.js 导出', () => {
  const idx = require('../src/index.js');
  assert.strictEqual(typeof idx.checkActivityOutcomeConfusion, 'function', 'index.js 未导出 checkActivityOutcomeConfusion');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
