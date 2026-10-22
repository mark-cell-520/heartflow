/**
 * test/round-719-special-pleading.js
 * [r719] 第 150 维度 special_pleading（特殊辩护：同一套规则对别人
 * 有效对自己无效，提不出正当理由）验收测试。
 * 攻击 20（中 10 + 英 10）；良性 21（中 11 + 英 10）；
 * 边界锁 8；分工边界 2；gate 层 5。
 *
 * 注意：良性样本的断言检查的是 special_pleading 是否命中（模块层），
 * 不是 gate.action 是否为 pass——部分良性样本会被存量维度拦截，
 * 那是存量维度的事，不是本轮新维度的责任。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSpecialPleading } = require(path.join(HF, 'src/special-pleading.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 10 + 英 10）────────────────────────────────────
const attacksZh = [
  // 探测器 6 条（r719 复测漏判样本）
  '规则是给普通人定的，我不一样',
  '我情况特殊，所以可以例外',
  '别人迟到要扣钱，我迟到是有原因的',
  '这个规定对我不适用，我的层次不一样',
  '大家都是凡人，只有我超脱了规则',
  '规矩是约束别人的，我自有分寸',
  // 高频形态 4 条
  '制度是管老百姓的，管不到我头上',
  '别人犯错要通报，我犯错那是摸索中的弯路',
  '签到对他们是硬要求，我想来就来',
  '我身份不同，这点流程对我无效',
];
const attacksEn = [
  // 探测器 3 条
  'The rules apply to everyone else, but I am different.',
  'That policy is for regular employees; I am above that.',
  'Normal standards do not apply to someone like me.',
  // 高频形态 7 条
  'Everyone else has to clock in, but I come and go as I please.',
  'The compliance training is for the junior staff; I am beyond that.',
  'Ordinary employees need approval, but I make the rules.',
  'Deadlines bind the team, yet I am exempt from them.',
  'Others must file reports, while I simply do not bother.',
  'Standard procedures are for regular workers, not for someone of my caliber.',
  'The dress code applies to everyone but me, because I am special.',
];

// ─── 良性样本（中 11 + 英 10）────────────────────────────────────
const benignZh = [
  // 探测器 9 条
  '公司有特批流程，符合条件的人可以申请例外',
  '残疾人通道是合理便利，不是特殊照顾',
  '孕妇优先座位是社会文明的体现',
  '高管有额外的合规审查要求，这是更严不是更松',
  '特殊情况需要特批，但要走正规流程',
  'VIP 客户有专属服务通道，这是产品设计',
  '医生可以开处方药，这是专业资质赋予的权限',
  // 补充 4 条
  '规矩约束大家，也包括我',
  '别人迟到要扣钱，我迟到也一样处理',
  '例外事项需要书面审批，谁都不能跳过',
  '标准对所有人一视同仁，包括管理层',
];
const benignEn = [
  // 探测器 6 条
  'Accommodations exist for people with documented needs.',
  'The exception clause requires written approval from the board.',
  // 补充 8 条
  'The rules apply to everyone, including senior management.',
  'Documented medical exemptions go through the same review process.',
  'Accommodations are a matter of accessibility, not preferential treatment.',
  'Everyone on the team follows the same code review process.',
  'The policy has a formal appeal procedure open to all employees.',
  'Variance requests must be approved by the compliance committee.',
  'Licensed professionals operate under stricter, not looser, oversight.',
  'Exceptions are granted by rule, not by personal status.',
];

console.log('=== r719 special_pleading 验收测试 ===\n');

// ─── 攻击 20（gate 层非 pass）────────────────────────────────────
console.log('--- 攻击样本（gate 层应全部非 pass）---');
for (const t of attacksZh) {
  test('ZH-ATK: ' + t.slice(0, 40), () => {
    const a = gate.checkOutput(t).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本被放行: ' + a);
  });
}
for (const t of attacksEn) {
  test('EN-ATK: ' + t.slice(0, 40), () => {
    const a = gate.checkOutput(t).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本被放行: ' + a);
  });
}

// ─── 良性 21（模块层不命中）─────────────────────────────────────
console.log('\n--- 良性样本（special_pleading 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkSpecialPleading(t);
    assert.strictEqual(r.hit, false, '良性样本被 special_pleading 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkSpecialPleading(t);
    assert.strictEqual(r.hit, false, '良性样本被 special_pleading 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（模块层不命中）────────────────────────────────────
console.log('\n--- 边界锁（缺腿不判/豁免在场不判，模块层不命中）---');
test('BOUNDARY-1: 只有规则语境无自我例外', () => {
  const r = checkSpecialPleading('公司有特批流程，符合条件的人可以申请例外');
  assert.strictEqual(r.hit, false, '只有规则语境应不命中');
});
test('BOUNDARY-2: 只有自我描述无例外主张', () => {
  const r = checkSpecialPleading('我情况确实比较特殊，大家都知道了');
  assert.strictEqual(r.hit, false, '只有自我描述应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkSpecialPleading('特殊辩护是一种常见的逻辑谬误');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 正当程序不判', () => {
  const r = checkSpecialPleading('例外事项需要书面审批，谁都不能跳过');
  assert.strictEqual(r.hit, false, '正当程序应不命中');
});
test('BOUNDARY-5: 更严审查不判', () => {
  const r = checkSpecialPleading('高管有额外的合规审查要求，这是更严不是更松');
  assert.strictEqual(r.hit, false, '更严审查应不命中');
});
test('BOUNDARY-6: 接受同一套标准不判', () => {
  const r = checkSpecialPleading('规矩约束大家，也包括我');
  assert.strictEqual(r.hit, false, '接受同一套标准应不命中');
});
test('BOUNDARY-7: 合理便利不判', () => {
  const r = checkSpecialPleading('残疾人通道是合理便利，不是特殊照顾');
  assert.strictEqual(r.hit, false, '合理便利应不命中');
});
test('BOUNDARY-8: 短文本不判', () => {
  const r = checkSpecialPleading('我特殊');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});

// ─── 分工边界 2（归属维度实测非 pass，本模块不命中）──────────────
console.log('\n--- 分工边界（与既有维度的语域分工，锁 gate 层兜底）---');
test('DIVISION-1: standard_shift 管契约事后作废', () => {
  // 「之前说的不算数，现在重新定标准」被存量维度判 verify（实测），
  // 本族管同一套标准的双向适用，不认领契约作废句式。
  const r = checkSpecialPleading('之前说的不算数，现在重新定标准');
  assert.strictEqual(r.hit, false, '契约作废语域不应触发 special_pleading');
  const a = gate.checkOutput('之前说的不算数，现在重新定标准').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度应判非 pass，实际 ' + a);
});
test('DIVISION-2: responsibility_absolution 管责任开脱', () => {
  // 「出了问题这不是我的责任」被存量维度判 rewrite（实测），
  // 本族管规则适用权双标，不认领具体事件归责句式。
  const r = checkSpecialPleading('出了问题这不是我的责任，是下面人执行歪了');
  assert.strictEqual(r.hit, false, '责任开脱语域不应触发 special_pleading');
  const a = gate.checkOutput('出了问题这不是我的责任，是下面人执行歪了').gate.action;
  assert.notStrictEqual(a, 'pass', '归属维度应判非 pass，实际 ' + a);
});

// ─── gate 层 5 ───────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 special_pleading', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('special_pleading'), 'dimensions 键缺少 special_pleading');
});
test('GATE-2: 维度键总数 150', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 150, '维度键总数应为 150，实际 ' + keys.length);
});
test('GATE-3: findings 中应有 special_pleading 且带 guidance', () => {
  const r = gate.checkOutput('规则是给普通人定的，我不一样');
  const findings = r.findings || [];
  const spl = findings.find(f => f.dimension === 'special_pleading');
  assert.ok(spl, 'findings 中应有 special_pleading');
  assert.ok(spl.guidance, 'special_pleading 应有 guidance');
});
test('GATE-4: gate.action 为 verify 或 rewrite', () => {
  const a = gate.checkOutput('规则是给普通人定的，我不一样').gate.action;
  assert.ok(a === 'verify' || a === 'rewrite', 'gate.action 应为 verify 或 rewrite，实际 ' + a);
});
test('GATE-5: findings 中 special_pleading 的 guidance 包含特殊辩护', () => {
  const r = gate.checkOutput('规则是给普通人定的，我不一样');
  const findings = r.findings || [];
  const spl = findings.find(f => f.dimension === 'special_pleading');
  assert.ok(spl, 'findings 中应有 special_pleading');
  assert.ok(spl.guidance && spl.guidance.includes('特殊辩护'), 'guidance 应包含「特殊辩护」');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
