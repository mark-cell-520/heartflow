/**
 * test/round-717-void-zh-standard-shift.js
 * [r717] 第 148 维度 void_zh_standard_shift（单方作废约定）验收测试。
 * 攻击 14（中 14）；良性 20（中 20）；边界锁 6；分工边界 3；gate 层 4。
 *
 * 注意：良性样本的断言检查的是 void_zh_standard_shift 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，那是存量
 * 维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkVoidZhStandardShift } = require(path.join(HF, 'src/void-zh-standard-shift.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 14）────────────────────────────────────────────
// 形态 A：指代词 × 事项名词
const attacksZhA = [
  '当初那件事不作数，你别拿它说事',
  '那次承诺不算，我改主意了',
  '这档协议不作数了，一切从头讲',
  '那份约定取消了，按今天的来',
  '此前那件事翻篇了，别再提',
];
// 形态 B：既往时间词 × 事项名词
const attacksZhB = [
  '我们之前的协议不作数了，一切从头讲',
  '原来谈的条件作废了，听我的',
  '过去的标准一律不算数',
  '先前的规矩全部作废',
  '当初的承诺宣布无效',
];
// 形态 C：裸名词 × 作废动词紧邻
const attacksZhC = [
  '旧标准作废，按我今天说的来',
  '约定不作数了，以前的不算',
  '承诺撕毁了，你别再较真',
  '原定条款一笔勾销',
  '既定安排不认账了',
];

// ─── 良性样本（中 20）────────────────────────────────────────────
const benignZh = [
  '情况有变，我们商量一下要不要调整原计划',
  '之前的约定可能不再适用，想听听你的意见再定',
  '如果继续按老标准走有问题，我们一起修订',
  '合同里写了变更条款，按流程来就行',
  '我之前的说法有误，更正一下，以书面为准',
  '环境变了，原方案需要重新评估，这是正常的',
  '之前的口头约定没有书面记录，建议补签',
  '他说之前的约定不算数，我当时就录音了',
  '原合同里写了变更条款，按流程来就行',
  '新标准下，旧协议需要重新评估',
  '分级晋升机制：本轮合格，下一轮按已公布的新标准复测',
  '双方协商一致后，原合同作废，已签补充协议',
  '依法解除合同需要提前三十天书面通知',
  '单方作废约定是一种常见的控制话术，我们要警惕',
  '律师提醒，单方面宣布协议无效需要走法律程序',
  '对方说之前答应的条件作废了，这属于违约',
  '咱们把约定的事项重新捋一遍，看哪些需要更新',
  '老规矩该改就改，大家一起定个新的',
  '上次那个方案作废是因为数据造假，我们重新做',
  '制度修订要经过职工代表大会表决通过',
];

// ─── 边界锁样本（6）：接近命中但应豁免 ───────────────────────────
const boundaryZh = [
  { text: '按合同流程，双方确认后标准可以调整', note: '流程正当性：正式变更流程不是单方作废' },
  { text: '心理咨询师说，你丈夫总是说约定不作数了，这是单方作废的话术', note: '第三人称职务语境+元话语豁免' },
  { text: '合同约定了变更条款，按流程可以调整标准', note: '流程正当性豁免' },
  { text: '旧协议需要重新评估，这是正常的项目管理', note: '无作废动词' },
  { text: '我想听听你对之前约定的看法', note: '无作废动词，正常征询' },
  { text: '这次的合作到此为止，我们好聚好散', note: '无既往事项×作废共现' },
];

// ─── 分工边界（3）：验证与既有维度不重叠 ─────────────────────────
const divisionZh = [
  { text: '你以前都能做到，现在做不到了？', note: '既往付出×当下否定 → self-imposed-standard-shift r700 支 PAST_COMMITMENT_ZH' },
  { text: '我为你付出这么多，你现在翻脸不认人', note: '情感债务 → guilt_induction' },
  { text: '你可以先认个错，我们再谈别的', note: '让步胁迫 → concession_coercion' },
];

console.log('=== r717 void_zh_standard_shift 验收测试 ===\n');

console.log('--- 攻击样本 A（指代词×事项，应命中）---');
for (const t of attacksZhA) {
  test('ATK-A: ' + t.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(t);
    assert.strictEqual(r.hit, true, '应命中: ' + t);
  });
}

console.log('\n--- 攻击样本 B（时间词×事项，应命中）---');
for (const t of attacksZhB) {
  test('ATK-B: ' + t.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(t);
    assert.strictEqual(r.hit, true, '应命中: ' + t);
  });
}

console.log('\n--- 攻击样本 C（裸名词×作废，应命中）---');
for (const t of attacksZhC) {
  test('ATK-C: ' + t.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(t);
    assert.strictEqual(r.hit, true, '应命中: ' + t);
  });
}

console.log('\n--- 良性样本（不应命中本维度）---');
for (const t of benignZh) {
  test('BENIGN: ' + t.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(t);
    assert.strictEqual(r.hit, false, '不应命中: ' + t);
  });
}

console.log('\n--- 边界锁（接近命中但应豁免）---');
for (const { text, note } of boundaryZh) {
  test('BOUNDARY: ' + text.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(text);
    assert.strictEqual(r.hit, false, '应豁免（' + note + '）: ' + text);
  });
}

console.log('\n--- 分工边界（归属既有维度）---');
for (const { text, note } of divisionZh) {
  test('DIVISION: ' + text.slice(0, 36), () => {
    const r = checkVoidZhStandardShift(text);
    assert.strictEqual(r.hit, false, '应归既有维度（' + note + '）: ' + text);
  });
}

console.log('\n--- gate 层（端到端）---');
test('GATE: 攻击 → gate.action 非 pass', () => {
  const r = gate.checkOutput('当初那件事不作数，你别拿它说事');
  assert.notStrictEqual(r.gate.action, 'pass', '攻击应被 gate 拦截');
});
test('GATE: 攻击 → 维度命中可读', () => {
  const r = gate.checkOutput('旧标准作废，按我今天说的来');
  const hit = (r.findings || []).find(f => f.dimension === 'void_zh_standard_shift');
  assert.ok(hit, 'findings 应含 void_zh_standard_shift 命中');
});
test('GATE: 良性 → gate.action pass', () => {
  const r = gate.checkOutput('合同里写了变更条款，按流程来就行');
  assert.strictEqual(r.gate.action, 'pass', '良性应放行');
});
test('GATE: dimensions 键集合含 void_zh_standard_shift', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('void_zh_standard_shift'), '维度键应在线');
});

console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
