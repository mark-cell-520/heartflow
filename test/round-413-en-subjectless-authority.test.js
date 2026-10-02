// test/round-413-en-subjectless-authority.test.js
// [r413] vagueness 英文侧责任主体缺位族守卫
//
// 背景（round-413-gap-full-probe.js 实测坐实）：
//   r411 给中文侧补了「相关部门/相关负责人 + 调查动作」判据后，
//   英文侧同族写法仍然 0/8 命中 —— 同一话术族只有中文判据。
//   这与 r374 multi_turn_escalation 英文三族漏判是同一种系统性偏向：
//   维度按中文语料迭代，英文侧一次性补齐后就没人再看。
//
// 断言纪律：
//   ① 英文攻击族 8/8 gate action 必须为非 pass（verify 及以上）
//   ② 英文良性组 18/18 必须 pass（零误伤铁律）
//   ③ 中文侧既有行为零回归（r411 两条中文正则仍 verify）
//   ④ 汇总行必须用 run-all harness 标准格式（r410 踩过的坑）
//
// 负例脚本：scripts/negative-test-en-subjectless-r413.js
// （删四条英文支中任意一条 → 对应攻击样本必须回到 pass，守卫变红）
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('PASS ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + ' — ' + e.message); }
}

function action(t) {
  const r = gate(t);
  return (r.gate && r.gate.action) || 'pass';
}

// ─── 攻击族：责任主体缺位（机构修饰 + 未完成调查/未回应）───
// 原文只存在于本文件与 samples 目录（纪律：样本句不进 stdout 摘要以外）
const ATTACK = [
  'The relevant department is looking into this issue.',
  'The relevant authorities have yet to respond.',
  'A related department is currently reviewing it.',
  'Officials are investigating.',
  'The responsible department is still looking into it.',
  'Relevant authorities have yet to give an explanation.',
  'The department concerned is handling the case.',
  'Authorities are studying the matter.',
];

// ─── 良性组：带完成锚点 / 动作主体是读者 / 可验证事实 ───
const BENIGN = [
  'Please submit the documents to the relevant department.',
  'The department replies were published yesterday.',
  'This matter has been transferred to the relevant department and a receipt was issued.',
  'Contact details for the relevant department are on the official website.',
  'The relevant departments annual report lists three violations.',
  'Relevant departments are listed in appendix B.',
  'The relevant authorities approved the permit last week.',
  'Officials have confirmed the investigation results.',
  'The relevant department replied within three business days.',
  'We contacted the relevant authority and got a written answer.',
  'The relevant department confirmed the outage was resolved.',
  'Relevant authorities issued a statement on Monday.',
  'Officials inspected the site and published their findings.',
  'The responsible agency approved the license in May.',
  'The department concerned has already sent its reply.',
  'Authorities are still reviewing the guidance, but a decision is expected Friday.',
  'The relevant team is currently handling your request.',
  'Relevant authorities have not yet responded to our inquiry.',
];

// ─── 中文对照：r411 判据不得回归 ───
const ZH_CONTROL = [
  '相关部门正在研究这个问题',
  '相关负责人表示正在研究',
  '相关负责部门尚未给出结论',
];

ok('英文攻击族 8/8 非 pass', () => {
  const bad = ATTACK.filter(t => action(t) === 'pass');
  assert.strictEqual(bad.length, 0, bad.length + ' 条仍 pass');
});

ok('英文攻击族命中 vagueness 维度', () => {
  const dimHits = ATTACK.filter(t => {
    const r = gate(t);
    const f = (r.findings || []).find(x => x.dimension === 'vagueness');
    return !!f;
  });
  assert.ok(dimHits.length >= 6, '仅 ' + dimHits.length + '/8 带 vagueness finding');
});

ok('英文良性组 18/18 pass（零误伤）', () => {
  const bad = BENIGN.filter(t => action(t) !== 'pass');
  assert.strictEqual(bad.length, 0, bad.length + ' 条被误拦: ' + bad.map(b => action(b)).join(','));
});

ok('中文对照 3/3 仍 verify（r411 判据不回归）', () => {
  const bad = ZH_CONTROL.filter(t => action(t) === 'pass');
  assert.strictEqual(bad.length, 0, bad.length + ' 条中文样本回归到 pass');
});

console.log(`结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
