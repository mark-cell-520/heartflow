/**
 * test/round-720-post-hoc.js
 * [r720] post_hoc（后此谬误，第 151 维度）轮次验收测试。
 * 形态纪律：
 * - 攻击样本 20 条（中英各 10），模块层 checkPostHoc 必须 count>0
 * - 良性样本 21 条，模块层必须零命中
 * - 边界锁：同一干预+变化但缺时序连接不得判；带调查语境标记不得判
 * - 分工边界锁：样本走 gate.checkOutput()，动作必须非 pass（归属维度真兜底）
 * - gate 登记断言：维度键集合含 post_hoc
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ph = require(path.join(ROOT, 'src', 'post-hoc.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => ph.checkPostHoc(s).count > 0;

// ── 1. 攻击样本：中英各 10 ──────────────────────────────────────
const attacksZh = [
  '自从换了领导，业绩就下滑了，肯定是领导的问题',          // R1
  '上次调整了策略，之后销量就涨了，说明策略对了',          // R1
  '他来了之后团队就出问题，都是他带来的',                  // R1
  '自从用了新系统，bug 就多了，新系统不行',                // R1
  '装了这个杀毒软件之后电脑就没蓝屏了，果然是它的功劳',    // R1
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',        // R1
  '我吃了这个药就好了，所以这药有效',                      // R2
  '换了个手机号，孩子成绩就上去了',                        // R2
  '昨天没带护身符今天就出事，以后必须带',                  // R3
  '那天没去加班，第二天就出了乱子，以后我不敢缺席了',      // R3
];
const attacksEn = [
  'After the new manager arrived, sales dropped, so it is his fault.',            // R1
  'Since we changed the strategy, revenue went up, proving it was right.',        // R1
  'Ever since I installed this app, my phone stopped freezing — it works.',       // R1
  'After the update, the crashes decreased, which proves the update fixed it.',   // R1
  'Ever since we hired him, sales went up, so it is thanks to him.',              // R1
  'Once I started drinking this tea, my headaches went away, so that is why it helps.', // R1
  'I took the medicine and got better, so the medicine works.',                   // R2
  'I updated the app and the crashes stopped, so it works.',                      // R2
  "I didn't wear my lucky socks and things went wrong, never again.",             // R3
  "He sat in that chair and we lost three games; get him out of there.",          // R4
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本 21 ─────────────────────────────────────────────
const benign = [
  // 调查语境（豁免）
  '换了领导后业绩下滑，我们需要分析具体原因',
  '补丁发布后出现了故障，正在排查是否是补丁引入的',
  '相关性不等于因果，需要更多数据才能下结论',
  '吃了药之后症状缓解了，但这只是相关性，需要双盲验证',
  'The crash happened after the update; we need to investigate confounders.',
  'Sales rose after the campaign, but correlation is not causation.',
  // 中性记录（无突变形状）
  '今天出了故障，正在排查',
  '我昨天去医院做了检查，医生说没什么问题',
  '昨天发布了一个新版本',
  '他昨天辞职了',
  'The system went down yesterday.',
  'We changed the database schema last week.',
  // 元陈述 / 知识讲解
  '后此谬误是指把时间先后当作因果的逻辑错误',
  '这篇文章讲的是拉丁语 post hoc ergo propter hoc 的由来',
  '统计学上要控制变量才能排除共同原因',
  'Post hoc ergo propter hoc is a common logical fallacy.',
  'A controlled experiment is the standard way to establish causation.',
  // 无因果语境的单纯时序
  '先吃饭，再写作业',
  '开完会之后我们就散了',
  'After the meeting we all went home.',
  'Once the rain stopped, we continued walking.',
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-缺连接词不判', () => {
  assert.ok(!hit('业绩下滑了，肯定是领导的问题'), '缺时序腿不应判');
});
t('边界-缺干预不判', () => {
  assert.ok(!hit('业绩就下滑了'), '缺时序腿不应判');
});
t('边界-R2缺干预不判', () => {
  assert.ok(!hit('业绩就好了，所以有效'), '缺干预腿不应判');
});
t('边界-R3缺规避不判', () => {
  assert.ok(!hit('昨天没带护身符今天就出事'), '缺规避腿不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(ph.checkPostHoc(undefined).count, 0);
  assert.strictEqual(ph.checkPostHoc('').count, 0);
});
t('边界-空输入不标 zeroHit', () => {
  // 空输入是守卫路径，不应伪装成"扫描过但没命中"
  assert.strictEqual(ph.checkPostHoc(undefined).zeroHit, false);
});

// ── 4. 分工边界锁（gate 层必须非 pass）────────────────────────
t('分工-gate对归因句判非pass', () => {
  const r = gate.checkOutput('自从换了领导，业绩就下滑了，肯定是领导的问题');
  assert.notStrictEqual(r.gate.action, 'pass', '归属维度必须兜底');
});
t('分工-gate对R3样本判非pass', () => {
  const r = gate.checkOutput('昨天没带护身符今天就出事，以后必须带');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('分工-gate对EN样本判非pass', () => {
  const r = gate.checkOutput('He sat in that chair and we lost three games; get him out of there.');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('分工-gate对良性句放行', () => {
  const r = gate.checkOutput('相关性不等于因果，需要更多数据才能下结论');
  assert.strictEqual(r.gate.action, 'pass');
});

// ── 5. gate 登记断言 ───────────────────────────────────────────
t('登记-维度键含post_hoc', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('post_hoc'), '维度键未登记');
});
t('登记-index导出checkPostHoc', () => {
  const idx = require(path.join(ROOT, 'src', 'index.js'));
  assert.strictEqual(typeof idx.checkPostHoc, 'function');
});
t('登记-VERIFY_DIMS含post_hoc', () => {
  // VERIFY_DIMS 是 index.js 内部 Set 不导出，用源码段断言登记
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(m, 'VERIFY_DIMS 定义段未找到');
  assert.ok(m[1].includes("'post_hoc'"), 'VERIFY_DIMS 未登记 post_hoc');
});
t('登记-verify级在gate生效', () => {
  // post_hoc 命中必须让 verdict 落到「需验证」或更差（良性句保持可信）
  const r1 = gate.checkOutput('换了新系统之后 bug 就多了');
  assert.notStrictEqual(r1.verdict, '可信');
  const r2 = gate.checkOutput('后此谬误是指把时间先后当作因果的逻辑错误');
  assert.strictEqual(r2.verdict, '可信');
});

console.log('passed: ' + pass + ', failed: ' + fails.length);
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
