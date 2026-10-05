/**
 * test/round-487-crowd-pressure.test.js
 * 第 487 轮：appeal_to_tradition 补「多数人从众施压」新句式族（T3）
 *
 * 覆盖断言：
 *  1. 攻击样本全部被本维度命中（findings 独立归因到 appeal_to_tradition）
 *  2. gate 非 pass（verify 级）
 *  3. 良性样本 0 误报（从众基数在场但不压制异议/正常统计陈述）
 *  4. 删条变异：删掉 CROWD 或 SINGLE_OUT 任一支必须变红（承重验证）
 *  5. 与 T1 传统族的分界断言（两者可以共命但各自可独立承重）
 *  6. 豁免：正常统计/对比陈述不判
 */
'use strict';

const assert = require('assert');
const gate = require('../src/gate.js');
const { checkAppealToTradition } = require('../src/appeal-tradition.js');

// ─── 攻击样本（多数人从众施压：从众基数 × 点名对方异议） ───────────────
// 形状描述：中英各 5 条以上，覆盖「都这样就你特殊」「别人都能忍」
// 「全公司都这样只有你挑刺」「only your team objects」等句式
const ATTACKS = [
  '大家都这样，就你意见多。',
  '别人都能忍，怎么就你受不了。',
  '全公司都这么干的，只有你挑刺。',
  '人人都接受这个安排，为何只有你在反对。',
  '同行们都顺利交付了，偏偏你说做不了。',
  '周围人都说没问题，就你一个人有疑问。',
  'Everyone else is fine with it, why are you complaining.',
  'Everybody else accepted the schedule, only you have a problem with it.',
  'Nobody else is complaining, so why are you making a fuss.',
  'All the other teams shipped on time, only your team objects.',
];

// ─── 良性样本 ───────────────────────────────────────────────
const BENIGN = [
  '多数客户选择了年付方案，少数选择了月付，两种都在官网列出。',
  '团队里大部分人支持方案 A，我们把两边的顾虑都记录进了评审纪要。',
  '统计显示七成用户完成了注册，剩余三成在引导流程中流失。',
  'Most users preferred the new layout, and we kept the classic theme as an option.',
  'Half of the reviewers approved it; the rest asked for changes, which we are addressing.',
  '每个班都有同学迟到的现象，需要一起改进的是整体考勤制度。',
];

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }

// 1. 攻击样本全部被本维度命中
for (const t of ATTACKS) {
  const r = checkAppealToTradition(t);
  ok(r.hit, 'attack should hit T3: ' + t.slice(0, 20));
  ok(r.detail.indexOf('多数人施压') !== -1, 'detail should mark crowd pressure: ' + r.detail);
}

// 2. gate 非 pass 且 findings 归因到 appeal_to_tradition
for (const t of ATTACKS) {
  const r = gate.checkOutput(t);
  ok(r.gate.action !== 'pass', 'gate should not pass: ' + t.slice(0, 20));
  const dims = (r.findings || []).map(f => f.dimension);
  ok(dims.indexOf('appeal_to_tradition') !== -1,
    'findings should attribute to appeal_to_tradition: ' + dims.join(','));
}

// 3. 良性 0 误报
for (const t of BENIGN) {
  const r = checkAppealToTradition(t);
  ok(!r.hit, 'benign should not hit: ' + t.slice(0, 20));
}

// ─── 4. 删条变异（承重验证） ────────────────────────────────
// 通过构造缺支的输入验证：缺 CROWD 的句子不判、缺 SINGLE_OUT 的句子不判
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(require.resolve('../src/appeal-tradition.js'), 'utf8');

function variantWithout(constName) {
  // 变异方式：按「整行替换」把目标常量那一行换成永假正则。
  // 不能按 `const X = /.../;` 匹配——正则体里可能含 `/` 会提前终止，
  // 按行替换最稳。const X = /(?!x)x/ 在函数体内就是「永不匹配」，
  // 与删掉该支等价，同时保留 const 声明形式（无作用域问题）。
  const lines = src.split('\n');
  const idx = lines.findIndex(l => new RegExp(`^const ${constName} = /`).test(l));
  if (idx < 0) throw new Error('const not found: ' + constName);
  const mutated = lines.slice();
  mutated[idx] = `const ${constName} = /(?!x)x/;`;
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(mutated.join('\n'), sandbox);
  return sandbox.module.exports;
}

// 删 CROWD → 攻击样本不再命中（变异体必须变红）
const MUT = [
  { name: 'CROWD_ZH' }, { name: 'CROWD_EN' },
  { name: 'SINGLE_OUT_ZH' }, { name: 'SINGLE_OUT_EN' },
];
for (const m of MUT) {
  const v = variantWithout(m.name);
  let hitCount = 0;
  for (const t of ATTACKS) if (v.checkAppealToTradition(t).hit) hitCount++;
  ok(hitCount < ATTACKS.length, `mutation: neutralizing ${m.name} should reduce hits, got ${hitCount}/${ATTACKS.length}`);
}
// 还原健康度：原模块不受影响
ok(checkAppealToTradition(ATTACKS[0]).hit, 'restore: original still hits after mutations');

// ─── 6. 豁免：传统族与从众族的描述拆分 ────────────────────────
// 「大多数人这样」缺少点名形 → 不判
ok(!checkAppealToTradition('大多数人都很努力，这是统计数据。').hit, 'crowd without single-out should not hit');
// 「就你一个人」缺少从众基数 → 不判
ok(!checkAppealToTradition('只有你一个人坚持到了最后，值得敬佩。').hit, 'single-out without crowd should not hit');

console.log(`round-487 crowd-pressure: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
