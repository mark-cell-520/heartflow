/**
 * test/round-188-most-transitivity.js — 第 185 维度
 * most_transitivity（「大多数」链式传递谬误）负例注入测试 + 变体矩阵。
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
const { checkMostTransitivity } = require('../src/most-transitivity.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文：量词裸名词/带修饰/倒装/长句五形全覆盖）──────────
const ATTACK_ZH = [
  '大多数A队球迷支持主队，大多数支持主队的人会买季票，所以大多数A队球迷会买季票。',
  '大部分用户点了同意，大部分点了同意的人都没读协议，所以大部分用户都没读协议。',
  '多数城市房价高，多数房价高的城市收入也高，所以多数城市居民买房不吃力。',
  '大多数抽烟的人知道有害健康，大多数知道有害健康的人仍继续抽，所以大多数抽烟的人仍在继续抽。',
  '七成受访者表示满意，七成表示满意的受访者购买了会员，所以七成受访者都买了会员。',
  '过半的读者读完了这本书，过半读完这本书的读者写了书评，因此过半读者都写了书评。',
  '大多数报名者提交了作品，大多数提交作品的人进入了复审，可见大多数报名者都进入了复审。',
  '所以大多数参与者都会复购，因为大多数参与者都领了券，大多数领了券的人都复购了。',
  '调查显示大多数员工认为公司有前途，而大多数认为公司有前途的员工都买了公司股票，由此可以推出大多数员工都用真金白银表达了信心。',
  '超过八成的订阅用户打开了邮件，超过八成的打开邮件的人点击了链接，所以超过八成的订阅用户都点击了链接。',
  '大多数A是B，大多数B是C所以大多数A是C。',   // 无逗号紧凑形
];
const ATTACK_EN = [
  'Most students passed the exam, and most people who passed got certificates, so most students got certificates.',
  'Most readers finished the book, most readers who finished it wrote a review, so most readers wrote a review.',
  'The majority of voters supported the bill, and the majority of supporters were under forty, so the majority of voters were under forty.',
];

// ─── 良性样本（无注入必须放行；含边缘良性）────────────────────────
const BENIGN = [
  '大多数吸烟者知道有害健康，他们中也有不少人仍在继续吸。',        // 并列无结论
  '多数人支持这项政策，而多数支持者都在本地居住了十年以上。',      // 并列无结论
  '大部分用户点了同意，这意味着协议条款对他们生效。',              // 结论非大多数
  '大多数A是B，大多数B是C，所以至少有些A是C。',                    // 特称结论（有效存在推论）
  '大多数A是B，大多数B是C，所以A和C之间可能有关系。',              // 对冲结论
  '大多数报名者提交了作品，有些提交作品的人进入了复审。',          // 特称陈述
  '超过半数的人赞成，反对的只占三成，弃权的更少。',                // 并列统计
  '大多数成功的企业家都经历过失败，而大多数经历过失败的人都更谨慎。', // 两前提并列
  '大多数情况下，这个方案是可行的。',                              // 「大多数」副词化
  'Most of the time, the plan works well.',
  '大多数猫是哺乳动物，大多数哺乳动物是温血动物。',                // 两前提无结论
  '绝大多数用户希望功能更稳定，开发团队正在评估优先级。',          // 陈述+行动
  '大多数努力的人成功了，大多数成功的人都很谦逊，可见谦逊是成功的必要条件。', // 结论非大多数形
  '大多数A是B，大多数B是C，所以大多数B是C。',                      // 纯转述（谓项无新内容）
  '大多数用户购买了会员，大多数购买了会员的人给了好评。',          // 并列无链式结论
  'Most users bought the membership, and most buyers left positive reviews.',
  '战争是多因共同造成的。',                                        // 边缘良性：多因陈述
];

console.log('\n[round-188 most_transitivity] 正向：攻击命中 / 良性放行');
t('全部中文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH) assert.ok(checkMostTransitivity(s).hit, '未命中: ' + s);
});
t('全部英文攻击样本命中（无注入）', () => {
  for (const s of ATTACK_EN) assert.ok(checkMostTransitivity(s).hit, '未命中: ' + s);
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) assert.ok(!checkMostTransitivity(s).hit, '误命中: ' + s);
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 MOST_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) assert.ok(!checkMostTransitivity(s, { MOST_ZH: [] }).hit, '仍命中: ' + s);
});
t('注入空 MOST_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) assert.ok(!checkMostTransitivity(s, { MOST_EN: [] }).hit, '仍命中: ' + s);
});
t('注入空 INFER_ZH 后倒装形攻击停火（证明推断词定位结论承重）', () => {
  // 倒装形「所以C，因为P1、P2」：抹掉推断词后结论失去资格（位于两前提之前）
  const s = '所以大多数参与者都会复购，因为大多数参与者都领了券，大多数领了券的人都复购了。';
  assert.ok(checkMostTransitivity(s).hit, '基准应命中');
  assert.ok(!checkMostTransitivity(s, { INFER_ZH: [] }).hit, '仍命中');
});
t('注入空 BOUND_ZH 后系词形攻击停火（证明功能词边界切分承重）', () => {
  // 纯系词形「大多数A是B，大多数B是C所以大多数A是C」：谓词边界只有「是」
  const s = '大多数A是B，大多数B是C所以大多数A是C。';
  assert.ok(checkMostTransitivity(s).hit, '基准应命中');
  assert.ok(!checkMostTransitivity(s, { BOUND_ZH: [] }).hit, '仍命中');
});
t('注入空 VERB_ZH 后双字动词边界攻击停火', () => {
  for (const s of ['大多数报名者提交了作品，大多数提交作品的人进入了复审，可见大多数报名者都进入了复审。',
    '七成受访者表示满意，七成表示满意的受访者购买了会员，所以七成受访者都买了会员。']) {
    assert.ok(checkMostTransitivity(s).hit, '基准应命中: ' + s.slice(0, 12));
    assert.ok(!checkMostTransitivity(s, { VERB_ZH: [] }).hit, '仍命中: ' + s.slice(0, 12));
  }
});
t('注入空 VERB1_ZH 后单字谓词攻击停火（「房价高」——高 即谓词）', () => {
  // 只用单字谓词样本：「过半的读者读完了这本书」的边界被双字动词「读完」
  // 兜底（读完 ∈ VERB_ZH），VERB1 置空后仍能切分，不作本注入的判据
  const s = '多数城市房价高，多数房价高的城市收入也高，所以多数城市居民买房不吃力。';
  assert.ok(checkMostTransitivity(s).hit, '基准应命中');
  assert.ok(!checkMostTransitivity(s, { VERB1_ZH: [] }).hit, '仍命中');
});
t('注入空 HEDGE 后对冲结论陷阱转为命中（证明对冲豁免承重）', () => {
  const s = '大多数A是B，大多数B是C，所以大多数A可能是C。';
  assert.ok(!checkMostTransitivity(s).hit, '基准应放行（对冲结论）');
  assert.ok(checkMostTransitivity(s, { HEDGE: [] }).hit, '抹掉对冲后应命中');
});
t('注入空 META_CONCEPT 后概念转述陷阱转为命中（证明概念豁免承重）', () => {
  const s = '传递性在这里不成立：大多数A是B，大多数B是C，所以大多数A是C。';
  assert.ok(!checkMostTransitivity(s).hit, '基准应放行（概念转述）');
  assert.ok(checkMostTransitivity(s, { META_CONCEPT: [] }).hit, '抹掉概念豁免后应命中');
});
t('注入空 TEACH 后教学语境陷阱转为命中（证明教学豁免承重）', () => {
  const s = '课堂上老师讲：大多数A是B，大多数B是C，所以大多数A是C。';
  assert.ok(!checkMostTransitivity(s).hit, '基准应放行（教学语境）');
  assert.ok(checkMostTransitivity(s, { TEACH: [] }).hit, '抹掉教学豁免后应命中');
});

console.log('\n[变体矩阵] 真实 gate() 复量（161 轮教训：负例全绿≠不漏）');
const MATRIX_ATTACK = [
  '大多数A队球迷支持主队，大多数支持主队的人会买季票，所以大多数A队球迷会买季票。', // 规范形
  '七成受访者表示满意，七成表示满意的受访者购买了会员，所以七成受访者都买了会员。', // 裸名词量词
  '调查显示大多数员工认为公司有前途，而大多数认为公司有前途的员工都买了公司股票，由此可以推出大多数员工都买了公司股票。', // 带前缀修饰+长句
  '所以大多数参与者都会复购，因为大多数参与者都领了券，大多数领了券的人都复购了。',   // 倒装形
  'Most students passed the exam, and most people who passed got certificates, so most students got certificates.', // 英文
  '超过八成的订阅用户打开了邮件，超过八成的打开邮件的人点击了链接，所以超过八成的订阅用户都点击了链接。', // 长句
];
const MATRIX_BENIGN = [
  '大多数A是B，大多数B是C，所以至少有些A是C。',                    // 特称结论
  '大多数报名者提交了作品，有些提交作品的人进入了复审。',          // 并列+特称
  '大多数A是B，大多数B是C，所以A和C之间可能有关系。',              // 对冲结论
  '战争是多因共同造成的。',                                        // 边缘良性
  'Most users bought the membership, and most buyers left positive reviews.', // 英文并列
  '大多数情况下，这个方案是可行的。',                              // 量词副词化
];
t('矩阵攻击变体全部 gate.action 非 pass 且 most_transitivity 承重', () => {
  for (const s of MATRIX_ATTACK) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '变体未拦: ' + s);
    assert.ok((r.findings || []).some(f => f.dimension === 'most_transitivity'),
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
