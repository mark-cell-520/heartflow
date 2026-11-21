// 负例注入测试：choice_architecture_manipulation（选择结构操纵 / dark pattern）第 279 维度（r438）
// 验证：五个操纵族全部命中 + 四组豁免全部 pass + 逐常量承重（负例测试之外的
// 同族变体矩阵由 scripts/round-438/ 下探针另行实测）。
// 射程：界面结构层选择权剥夺——界面元素在场 × 操纵手段在场 × 用户选择后果陈述。
// 与 false_urgency（时间压迫）/ baseline_omission（比例基线缺失）射程分工：
// 本维度判据是「结构 + 手段 + 选择后果」，不是时间词也不是比例词。
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const m = require(path.join(__dirname, '..', 'src', 'choice-architecture-manipulation.js'));
const { checkChoiceArchitectureManipulation } = m;

let passed = 0, failed = 0;
const failures = [];

function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(name + ': ' + e.message); }
}
function hit(text) {
  const r = checkChoiceArchitectureManipulation(text);
  assert.equal(r.hits > 0, true, '未命中（hits=' + r.hits + '）');
  return r;
}
function miss(text) {
  const r = checkChoiceArchitectureManipulation(text);
  assert.equal(r.hits, 0, '误命中（hits=' + r.hits + ' subFamilies=' + JSON.stringify(r.subFamilies) + '）');
  return r;
}

// ============ 族1 隐瞒 / 藏匿（hide）============
t('族1-ZH 灰色小字放在角落', () => hit('把拒绝订阅的按钮做成灰色小字放在角落，用户就找不到，退订率立刻降下来了。'));
t('族1-ZH 藏到最后一步才显示', () => hit('把真实价格藏到最后一步才显示，用户付款时才发现被多扣了钱。'));
t('族1-EN tiny grey decline link', () => hit('Make the decline button a tiny grey link so users cannot find it and cancellation rates drop.'));
t('族1-EN hide price until checkout', () => hit('Hide the real price until the final checkout step so buyers see the fee only after entering card details.'));

// ============ 族2 伪装措辞（disguise）============
t('族2-ZH 同意即表示已阅读', () => hit('页面写「同意即表示已阅读全部条款」，用户不看也能直接过。'));
t('族2-EN by continuing you agree', () => hit('By continuing you agree to all terms, so users click through without reading.'));

// ============ 族3 强迫行动（force）============
t('族3-ZH 不共享通讯录就无法进入下一页', () => hit('不共享通讯录就无法进入下一页，只能同意授权才能继续用。'));
t('族3-EN Force users to share contacts', () => hit('Force users to share contacts before they can proceed to the next screen.'));
t('族3-EN must grant permission to continue', () => hit('Users must grant permission to continue using the app.'));

// ============ 族4 误导阻碍（obstruct）============
t('族4-ZH 取消要打客服等三个工作日', () => hit('把取消订阅的入口藏起来，要打客服等三个工作日才能退。'));
t('族4-ZH 按钮颜色做成浅灰没人注意', () => hit('按钮颜色做成浅灰，用户压根注意不到，就这样没人点拒绝。'));
t('族4-EN cancel requires phone call', () => hit('Cancelling requires a phone call and a three-day waiting period, so subscribers stay enrolled.'));

// ============ 族5 伪造数据（fake）============
t('族5-ZH 首页写死今日浏览数', () => hit('首页写死一个「今日已有8923人浏览」的数字，制造紧迫感，转化率明显提升。'));
t('族5-ZH 仅剩件数是编造的', () => hit('活动页上写着仅剩 3 件的数字是编造的，库存其实充足，用户以为要抢才赶紧下单。'));
t('族5-EN countdown loops forever', () => hit('The countdown timer never actually ends, it just loops to keep pressuring buyers.'));

// ============ 豁免组1 善意 UX 改进（正面效果陈述）============
t('豁免1-ZH 注册步骤减少', () => miss('新版本把注册步骤从七步减少到两步，转化率提升了 30%。'));
t('豁免1-ZH 明码标价金额一致', () => miss('结算页把服务费和运费都明码标价，金额和购物车一致，用户觉得很放心。'));
t('豁免1-EN simplified flow no hidden fees', () => miss('We simplified the sign-up flow to three steps and removed all hidden fees.'));

// ============ 豁免组2 无障碍 / 可及性设计============
t('豁免2-ZH 对比度调高加文字标签', () => miss('按钮对比度调高到 4.5:1，并加了文字标签，视障用户用读屏软件也能操作。'));
t('豁免2-EN prices displayed upfront', () => miss('Prices are displayed upfront with no additional charges at checkout.'));

// ============ 豁免组3 教学 / 分析 / 监管转述（元陈述）============
t('豁免3-ZH UX 教材分析 dark pattern', () => miss('这本 UX 教材分析了十种常见的 dark pattern，提醒设计者避免误导用户。'));
t('豁免3-ZH 欧盟拟列入黑名单', () => miss('欧盟拟把十种操纵性设计列入黑名单，消费者权益组织对此表示欢迎。'));
t('豁免3-ZH 方法论提问', () => miss('如果把拒绝按钮做得不显眼，退订率会下降吗？这是设计伦理要回答的问题。'));

// ============ 豁免组4 纯描述无操纵手段 / 无效果陈述============
t('豁免4-ZH 纯风格描述', () => miss('这个页面的按钮是灰色的，尺寸也不大，整体风格比较克制。'));
t('豁免4-ZH 入口一样显眼', () => miss('我们把订阅入口都改成了一样显眼，用户反馈说找起来方便多了。'));

// ============ 逐常量承重（删掉关键常量该样本即失效——证明判据不是词表单点）============
t('承重1: STRUCTURE_ZH 删「按钮」后浅灰句失效', () => {
  const rest = m.STRUCTURE_ZH.source.replace('按钮|', '');
  assert.equal(/\|\|/.test(rest), false, '删除后残留空分支，测试构造无效');
  const without = new RegExp(rest);
  const txt = '按钮做成浅灰，用户压根注意不到，就这样没人点拒绝。';
  assert.equal(without.test(txt), false, 'STRUCTURE_ZH 去「按钮」后仍命中，说明判据另有来源');
});
t('承重2: MANEUVER_HIDE_ZH 删「灰色小字」后该句失效', () => {
  const rest = m.MANEUVER_HIDE_ZH.source.replace('灰色小字|', '');
  assert.equal(/\|\|/.test(rest), false, '删除后残留空分支，测试构造无效');
  const without = new RegExp(rest);
  const txt = '把拒绝订阅的按钮做成灰色小字放在角落，用户就找不到，退订率立刻降下来了。';
  assert.equal(without.test(txt), false, 'MANEUVER_HIDE_ZH 去「灰色小字」后仍命中');
});
t('承重3: EFFECT_ZH 删「压根…不知道」后折叠菜单句失效', () => {
  const rest = m.EFFECT_ZH.source.replace('压根[儿不]?不知道|', '');
  assert.equal(/\|\|/.test(rest), false, '删除后残留空分支，测试构造无效');
  const without = new RegExp(rest);
  const txt = '按钮藏在折叠菜单里，用户压根不知道还有拒绝这一项。';
  assert.equal(without.test(txt), false, 'EFFECT_ZH 去「压根…不知道」后仍命中，说明该分支是唯一承重');
});

// ============ 射程分工回归锚 ============
t('射程: 纯时间压迫（无结构手段）不归本维度', () => {
  const r = checkChoiceArchitectureManipulation('限时优惠仅剩两小时，错过不再有。');
  assert.equal(r.hits, 0, '纯倒计时压迫被本维度误收（应归 false_urgency）');
});
t('射程: 纯比例基线缺失（无结构手段）不归本维度', () => {
  const r = checkChoiceArchitectureManipulation('新系统上线后投诉率明显下降了，从 18% 降到 9%。');
  assert.equal(r.hits, 0, 'before-after 比例陈述被本维度误收（应归 baseline_omission）');
});

// ============ r438 修复回归锚（裸词形）============
t('回归: MANEUVER_FAKE_ZH 裸「写死」命中', () => {
  assert.equal(m.MANEUVER_FAKE_ZH.test('首页写死一个数字'), true);
});
t('回归: MANEUVER_HIDE_EN 裸动词 pre-check 命中', () => {
  assert.equal(m.MANEUVER_HIDE_EN.test('Pre-check the box'), true);
});
t('回归: MANEUVER_HIDE_EN 过去分词 pre-checked 仍命中', () => {
  assert.equal(m.MANEUVER_HIDE_EN.test('the box is pre-checked'), true);
});
t('回归: MANEUVER_FORCE_EN 裸祈使 Force users 命中', () => {
  assert.equal(m.MANEUVER_FORCE_EN.test('Force users to share contacts'), true);
});
t('回归: MANEUVER_OBSTRUCT_ZH 裸形容词浅灰命中', () => {
  assert.equal(m.MANEUVER_OBSTRUCT_ZH.test('颜色做成浅灰'), true);
});
t('回归: STRUCTURE_ZH 首页裸形命中', () => {
  assert.equal(m.STRUCTURE_ZH.test('首页'), true);
});

console.log('choice_architecture_manipulation 负例注入测试: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { failures.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
