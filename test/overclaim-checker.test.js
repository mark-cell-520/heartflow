// test/overclaim-checker.test.js — 第 93 维 overclaim 检测器回归
// 守卫目标：src/overclaim-checker.js 的判定边界。
// 铁律：只判表述形态，不判事实真假 —— 带完整限定的真话必须归零放行。
// 修 2026-10-08：实测四个既有检测器（capability_overclaim / absolute_claim /
//   verify / perfect_error）对「纳维-斯托克斯方程已被 AI 彻底解决」全部零命中
//   或反向放行，discriminate 甚至判「可信」。本测试守住补上来的这条边界。

'use strict';
const assert = require('assert');
const path = require('path');

const { checkOverclaim, COMPLETION_VERBS, QUALIFIERS } = require(
  path.join(__dirname, '..', 'src', 'overclaim-checker.js')
);

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  OK  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

// ─── 一、必须拦：无保留完成态 ───
t('中文无保留完成态 → count=1', () => {
  const r = checkOverclaim('纳维-斯托克斯方程已被 AI 彻底解决');
  assert.strictEqual(r.count, 1, '应命中 1 句');
  assert.strictEqual(r.level, 'flag');
  assert.ok(r.claims[0].intensifiers.includes('彻底'), '应识别出无保留副词');
  assert.ok(r.claims[0].subject.includes('AI'), '应识别出权威主体');
});

t('英文无保留完成态 → count=1', () => {
  const r = checkOverclaim('The problem has been completely solved');
  assert.strictEqual(r.count, 1);
  assert.strictEqual(r.claims[0].sentence.length > 0, true);
});

t('完成态动词单独出现也拦（无副词）', () => {
  const r = checkOverclaim('该难题已解决');
  assert.strictEqual(r.count, 1, '完成态动词本身即构成无保留宣称');
  assert.strictEqual(r.claims[0].intensifiers.length, 0, '本例无副词');
});

t('三句以上堆叠 → systemic', () => {
  const r = checkOverclaim('问题一已解决。问题二已攻克。问题三已破解。');
  assert.strictEqual(r.count, 3);
  assert.strictEqual(r.systemic, true);
  assert.strictEqual(r.level, 'systemic');
});

t('claims 保留句子便于 caller 追溯', () => {
  const r = checkOverclaim('据称该系统已完全解决延迟问题');
  assert.ok(r.claims.length >= 1);
  assert.strictEqual(typeof r.claims[0].sentence, 'string');
  assert.strictEqual(typeof r.claims[0].reason, 'string');
});

// ─── 二、必须放行：带限定的真话（误报控制，最关键） ───
t('带「仅覆盖某情形」的真话 → 放行', () => {
  const r = checkOverclaim('纳维-斯托克斯方程已被 AI 彻底解决，但仅覆盖 Clay C/D 带外力情形');
  assert.strictEqual(r.count, 0, '有限定的完成态必须归零');
  assert.strictEqual(r.qualified.length, 1, '应进 qualified 区');
  assert.strictEqual(r.level, 'clean');
});

t('带「尚未认证」的真话 → 放行', () => {
  const r = checkOverclaim('该方案部分解决了延迟问题，尚未通过认证');
  assert.strictEqual(r.count, 0);
});

t('带「仍需观察」的真话 → 放行', () => {
  const r = checkOverclaim('本季度故障率已下降到 0.3%，仍需持续观察');
  assert.strictEqual(r.count, 0);
});

t('英文带 subject to / only 的真话 → 不拦', () => {
  // 注意：本句动词形态 'solved' 不在 COMPLETION_VERBS（词表收的是
  // 'has been solved' 这类完整形态），所以整句不进入判定、qualified 也为 0。
  // 这里断言的是「不被拦」这个对外行为，不限定走哪条分支。
  const r = checkOverclaim('Partially solved, subject to further validation');
  assert.strictEqual(r.count, 0);
  assert.strictEqual(r.level, 'clean');
});

t('英文完成态 + subject to 的真话 → 走 qualified 放行', () => {
  // 同句含完整完成态形态 'fully solved'，应命中动词再被限定词挡下，
  // 必须进 qualified 区而不是 claims 区。
  const r = checkOverclaim('Fully solved only in the case of smooth initial data');
  assert.strictEqual(r.count, 0, '带限定的真话不得计入 claims');
  assert.strictEqual(r.qualified.length, 1, '应进 qualified 区');
});

// ─── 三、噪声与边界 ───
t('普通陈述不误报', () => {
  const r = checkOverclaim('今天团队开了一个会，讨论了下个迭代的排期');
  assert.strictEqual(r.count, 0);
});

t('空字符串安全', () => {
  const r = checkOverclaim('');
  assert.strictEqual(r.count, 0);
  assert.strictEqual(r.level, 'clean');
});

t('null / 非字符串安全', () => {
  for (const v of [null, undefined, 123, {}, []]) {
    const r = checkOverclaim(v);
    assert.strictEqual(r.count, 0, '非字符串输入必须安全返回');
  }
});

t('中英混排句子切分不串句', () => {
  // 第一句有限定，第二句无限定 —— 只能拦第二句
  const r = checkOverclaim('该系统已解决已知问题，但仅在测试环境验证。生产环境的崩溃已彻底解决。');
  assert.strictEqual(r.count, 1, '只应拦无保留的那句，不能因同段有限定词就全放行');
});

t('词表导出完整', () => {
  assert.ok(Array.isArray(COMPLETION_VERBS) && COMPLETION_VERBS.length > 10);
  assert.ok(Array.isArray(QUALIFIERS) && QUALIFIERS.length > 10);
  assert.ok(COMPLETION_VERBS.includes('彻底解决'));
  assert.ok(QUALIFIERS.includes('未认证'));
});

t('summary 可读', () => {
  const r = checkOverclaim('该问题已彻底解决');
  assert.strictEqual(typeof r.summary, 'string');
  assert.ok(r.summary.length > 0);
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
