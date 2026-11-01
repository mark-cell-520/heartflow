/**
 * test/round-189-appeal-to-wealth.js — 第 186 维度
 * appeal_to_wealth（诉诸财富/诉诸贫穷谬误）负例注入测试 + 变体矩阵。
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
 */
const assert = require('assert');
const { checkAppealToWealth } = require('../src/appeal-to-wealth.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// 负例注入器：永不匹配的正则
const NEVER = /(?!x)x/;

// ─── 攻击样本（中文：裸名词/带修饰/倒装/长句/反问五形全覆盖）──────────
const ATTACK_ZH = [
  '他那么有钱，说的话当然有道理，人家身家几十亿，认知能不比我们高吗？',   // 裸名词+反问尾巴
  '比尔·盖茨这么成功，他关于慈善的建议一定是对的，听成功人士的总没错。',   // 成功修饰形
  '马云说的都是真理，他能赚到几千亿身家，眼光还能错吗？',                 // 倒装（结论先行）+反问路线
  '一个穷得叮当响的人，观点能有什么价值？',                               // 贫困贬值路线+反问
  '他穷过苦日子，所以最懂老百姓的心，说的话才真正靠谱。',                 // 贫困美德化路线
  '马斯克是顶级富豪，他关于AI的判断肯定比普通人高明。',                   // 富豪+高明
  '这位是身家过亿的投资人，他的分析必然靠谱，听大户的准没错。',           // 身家+大户双形态
  '他出身寒门，因此更懂民间疾苦，看问题自然比我们深刻。',                 // 寒门+更懂
  '那个穷人懂什么，他的建议根本不可信。',                                 // 反问「懂什么」（有效性断言被否定守卫挡掉，反问腿承重）
  '他这么有钱，所以眼光独到，判断从没错过。',                             // 连接词居中形
  '这位创业者三十岁就实现了财务自由，因此在座的人都觉得他的商业判断必然高明，纷纷掏钱加入他的基金。', // 长句
  '他的话是对的，因为他身家上亿，见过大世面。',                           // 倒装（腿②先行，因为连接）
  '他们家是本地有名的大户人家，所以他说的话在理。',                       // 大户人家+在理
  '他从小家徒四壁，所以更懂普通人的难处，判断也更靠谱。',                 // 家徒四壁+更懂
];
const ATTACK_EN = [
  'He is a billionaire, so his advice on the economy must be sound.',
  'She married into one of the richest families, so her judgment is obviously superior.',
  'He made billions, so how could his judgment possibly be wrong?',
  'The poor know real life better, so their views are more credible.',
  'She grew up in poverty, so her judgment is clearly credible.',
  'He is loaded, so his take on the market is spot on.',
  'Coming from a poor background, he knows what matters, therefore his advice is sound.',
];

// ─── 良性样本（无注入必须放行；含边缘良性）────────────────────────
const BENIGN = [
  '在扑克和棋类游戏里，一方的收益确实等于另一方的损失，这是典型的零和博弈。',   // 游戏规则事实
  '这场谈判双方都有让步空间，最后达成了各取所需的协议，并不是非赢即输。',     // 双赢陈述
  '战争是国家间矛盾的极端爆发，它是多因共同造成的，不能简单归结为资源争夺。', // 多因陈述
  '贸易可以是双赢的：各国出口自己擅长的产品、进口自己不擅长的，整体福利都会提升。',
  '他创业成功，因此他对创业早期融资节奏的建议来自亲身经历，值得参考。',       // 亲历依据（非有效性断言）
  '这位投资者的历史业绩经过第三方审计，长期年化收益稳定，可以作为业绩证据。', // 实测业绩依据
  '富人也可能犯错，沃伦·巴菲特就多次公开承认自己的投资失误。',               // 错误承认
  '他虽然出身贫寒，但论证逻辑严密、数据扎实，结论应该按证据本身来评估。',     // 按证据评估+转折
  'His wealth came from selling the company he built, so his account of the early days is first-hand experience.',
  'Poverty does not determine whether someone is right — we need to look at the evidence.',
  '他白手起家，靠的是抓住几次关键机遇，不是因为眼光好。',                     // 否定守卫（不是因为）
  '这个实验成功了，说明配方没有问题，可以进入下一阶段。',                     // 「成功」非财富状态
  '数据非常丰富，所以模型的准确率很高，这符合预期。',                         // 「丰富」非富有
  '我们要穷尽所有可能的方案，不能轻易下结论。',                               // 「穷尽」非贫困
  '他从底层架构做起，十年后成为技术专家，靠的是持续学习。',                   // 「底层」非贫困
  '穷人的孩子早当家，这是环境塑造的结果，与认知能力无关。',                   // 环境归因+否认关联
  '山区的孩子更需要教育资源，这是社会公平问题。',                             // 规范主张无有效性断言
  'This dataset is rich, so the model performs well on the benchmark.',       // rich data 良性
  '有钱难买老来瘦，健康才是真正的财富。',                                     // 谚语，无有效性断言
  '他再有钱也是陌生人，说话不能全信。',                                       // 否认有效性
];

console.log('\n[round-189 appeal_to_wealth] 正向：攻击命中 / 良性放行');
t('全部中文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH) assert.ok(checkAppealToWealth(s).hit, '未命中: ' + s);
});
t('全部英文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_EN) assert.ok(checkAppealToWealth(s).hit, '未命中: ' + s);
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) assert.ok(!checkAppealToWealth(s).hit, '误命中: ' + s);
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 STATUS_ZH 后中文攻击停火（财富/贫困状态腿承重）', () => {
  for (const s of ATTACK_ZH) assert.ok(!checkAppealToWealth(s, { STATUS_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 18));
});
t('注入空 STATUS_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) assert.ok(!checkAppealToWealth(s, { STATUS_EN: NEVER }).hit, '仍命中: ' + s.slice(0, 24));
});
t('注入空 VALIDITY_ZH 后连接词形中文攻击停火（有效性结论腿承重）', () => {
  for (const s of ['他那么有钱，说的话当然有道理，人家身家几十亿，认知能不比我们高吗？',
    '比尔·盖茨这么成功，他关于慈善的建议一定是对的，听成功人士的总没错。',
    '马斯克是顶级富豪，他关于AI的判断肯定比普通人高明。']) {
    assert.ok(checkAppealToWealth(s).hit, '基准应命中');
    assert.ok(!checkAppealToWealth(s, { VALIDITY_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 14));
  }
});
t('注入空 VALIDITY_EN 后英文攻击停火', () => {
  for (const s of ['He is a billionaire, so his advice on the economy must be sound.',
    'She grew up in poverty, so her judgment is clearly credible.']) {
    assert.ok(checkAppealToWealth(s).hit, '基准应命中');
    assert.ok(!checkAppealToWealth(s, { VALIDITY_EN: NEVER }).hit, '仍命中');
  }
});
t('注入空 RHETORICAL_ZH 后反问路线攻击停火（反问腿免连接词承重）', () => {
  for (const s of ['马云说的都是真理，他能赚到几千亿身家，眼光还能错吗？',
    '一个穷得叮当响的人，观点能有什么价值？',
    '那个穷人懂什么，他的建议根本不可信。']) {
    assert.ok(checkAppealToWealth(s).hit, '基准应命中');
    assert.ok(!checkAppealToWealth(s, { RHETORICAL_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 12));
  }
});
t('注入空 RHETORICAL_EN 后英文反问攻击停火', () => {
  const s = 'He made billions, so how could his judgment possibly be wrong?';
  assert.ok(checkAppealToWealth(s).hit, '基准应命中');
  assert.ok(!checkAppealToWealth(s, { RHETORICAL_EN: NEVER }).hit, '仍命中');
});
t('注入空 CONNECTOR_ZH 后连接词路线停火（证明路线 A 连接词承重）', () => {
  for (const s of ['他这么有钱，所以眼光独到，判断从没错过。',
    '他们家是本地有名的大户人家，所以他说的话在理。']) {
    assert.ok(checkAppealToWealth(s).hit, '基准应命中');
    assert.ok(!checkAppealToWealth(s, { CONNECTOR_ZH: NEVER }).hit, '仍命中: ' + s.slice(0, 12));
  }
});
t('注入空 CONNECTOR_EN 后英文连接词路线停火', () => {
  const s = 'He is loaded, so his take on the market is spot on.';
  assert.ok(checkAppealToWealth(s).hit, '基准应命中');
  assert.ok(!checkAppealToWealth(s, { CONNECTOR_EN: NEVER }).hit, '仍命中');
});
t('注入空 NEG_ZH + NEG1_ZH 后否定守卫陷阱转为命中（证明否定守卫承重）', () => {
  const s = '他白手起家，靠的是抓住几次关键机遇，不是因为眼光好。';
  assert.ok(!checkAppealToWealth(s).hit, '基准应放行（有效性断言被否定）');
  assert.ok(checkAppealToWealth(s, { NEG_ZH: NEVER, NEG1_ZH: NEVER }).hit, '抹掉否定守卫后应命中');
});
t('注入空 HEDGE_ZH 后对冲结论陷阱转为命中（证明对冲豁免承重）', () => {
  const s = '他那么有钱，所以说的话可能有道理。';
  assert.ok(!checkAppealToWealth(s).hit, '基准应放行（对冲结论）');
  assert.ok(checkAppealToWealth(s, { HEDGE_ZH: NEVER }).hit, '抹掉对冲豁免后应命中');
});
t('注入空 META_EXEMPT_ZH 后概念转述陷阱转为命中（证明概念豁免承重）', () => {
  const s = '诉诸财富的典型形态就是：他那么有钱，说的话当然有道理。';
  assert.ok(!checkAppealToWealth(s).hit, '基准应放行（概念转述）');
  assert.ok(checkAppealToWealth(s, { META_EXEMPT_ZH: NEVER }).hit, '抹掉概念豁免后应命中');
});

console.log('\n[变体矩阵] 真实 gate() 复量（161 轮教训：负例全绿≠不漏）');
const MATRIX_ATTACK = [
  '他那么有钱，说的话当然有道理，人家身家几十亿，认知能不比我们高吗？',     // 规范形
  '一个穷得叮当响的人，观点能有什么价值？',                                 // 裸名词贫困形
  '这位创业者三十岁就实现了财务自由，因此在座的人都觉得他的商业判断必然高明，纷纷掏钱加入他的基金。', // 长句
  '他的话是对的，因为他身家上亿，见过大世面。',                             // 倒装形
  '比尔·盖茨这么成功，他关于慈善的建议一定是对的，听成功人士的总没错。',     // 带修饰+顺带结论
  'He is a billionaire, so his advice on the economy must be sound.',       // 英文
  'She grew up in poverty, so her judgment is clearly credible.',            // 英文贫困路线
];
const MATRIX_BENIGN = [
  '他创业成功，因此他对创业早期融资节奏的建议来自亲身经历，值得参考。',       // 亲历依据
  '这位投资者的历史业绩经过第三方审计，长期年化收益稳定，可以作为业绩证据。', // 实测业绩
  '他虽然出身贫寒，但论证逻辑严密、数据扎实，结论应该按证据本身来评估。',     // 按证据评估
  'Poverty does not determine whether someone is right — we need to look at the evidence.', // EN 否认关联
  'His wealth came from selling the company he built, so his account of the early days is first-hand experience.', // EN 亲历
  '战争是多因共同造成的，不能简单归结为资源争夺。',                           // 边缘良性：多因陈述
  '她出身寒门，凭奖学金完成学业，这份履历值得尊敬。',                         // 边缘良性：贫困状态+成就记录（非有效性断言）
];
t('矩阵攻击变体全部 gate.action 非 pass 且 appeal_to_wealth 承重', () => {
  for (const s of MATRIX_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '变体未拦: ' + s);
    assert.ok((r.findings || []).some(f => f.dimension === 'appeal_to_wealth'),
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
