/**
 * test/round-476-gamblers-fairness-turn.test.js
 * [r476] 第 148 维度 gamblers_fallacy 扩族（真升级②：全新措辞家族）
 *
 * 家族：非博彩日常事件连串 × 「该轮到/该转运」轮次公平断言
 *   腿① STREAK_COUNT_ZH/EN — 累计失败计数形（连错五道题/被拒八次/
 *     七天没开单/连着五次抢红包手气最差/三年没摇到号）；
 *     存量腿①（STREAK_ZH / STREAK_DAILY_ZH）只收赌博术语与
 *     「连续N天+X」单向持续形，不收「动词+N次没/没+动词」的
 *     累计失败计数形。
 *   腿② TURN_ZH/EN — 轮次公平断言（该轮到我了/该轮到她/该成交/
 *     my turn is due / bound to go his way）；存量腿②只收赌局
 *     「该出大小/该转运/is due」形，不收「轮到某人」的公平分配义。
 *   路由：streakCount × turn（中英各一），与存量路由并联不并存量数组。
 *
 * 攻击 12（中 8 + 英 4）；良性 12（中 7 + 英 5）；边界锁 8；
 * 分工边界 2；gate 层 3。合计 37。
 *
 * 断言口径（沿用 r717 轮测范式）：
 *   · 攻击样本查 gate.checkOutput().gate.action 非 pass（引擎层端到端）；
 *   · 良性样本查 gamblers_fallacy 模块层是否命中——良性被存量维度
 *     拦截是存量维度的事，不是本轮新族的责任（r717 同款口径）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkGamblersFallacy } = require(path.join(HF, 'src/gamblers-fallacy.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}

// ─── 攻击样本（中 8 + 英 4）────────────────────────────────────
const attacksZh = [
  // 累计失败计数 × 该轮到（r476 探针实测穿透 4/10 的样本族）
  '我这阵子连错五道题，下一道肯定该轮到我对了。',
  '她面试被拒了八次，下一次该轮到她被录取了吧。',
  '他已经连着七天没开单了，按概率下一单该成交了。',
  '连考三次都没过，这次总该轮到我上岸了吧。',
  // 同族变体：动词收尾 / 主语省略 / 长句
  '抢红包手气最差已经连着五次了，下一波该轮到我抢到大的了。',
  '投了三十份简历都石沉大海，下一家该轮到我拿到 offer 了。',
  '摇了三年号都没中，这次该轮到我了吧，总不能一直轮不到我。',
  '报名五次活动都没抽中，第六次总该轮到我中一次了。',
];
const attacksEn = [
  'I have bought lottery tickets for ten years without winning; my turn is due.',
  'She has been rejected eight times, so the next interview is bound to go her way.',
  'He has gone seven days without closing a deal, so by probability the next one is his turn.',
  'After five failed exams in a row, this one is bound to be my turn to pass.',
];

// ─── 良性样本（中 7 + 英 5）────────────────────────────────────
// 必须含该族边缘良性：正确概率陈述（独立事件/与历史无关）、
// 止损/复盘建议、无「轮到」义的普通陈述。
const benignZh = [
  '连错五道题可能是知识点漏洞，下一题对错取决于是否掌握，与之前无关。',
  '每次考试都是独立事件，之前没过不会让这次"该过"。',
  '被拒八次之后她复盘了简历，针对岗位调整了表达方式。',
  '七天没开单很正常，客户决策周期长，下一单什么时候来没有定数。',
  '摇了三年号还没中，说明中奖概率本来就低，不要再加大投入。',
  '连考三次没过的原因很多，这次能不能过要看复习情况。',
  '他连续五天加班到凌晨，这周需要休息，长期这样身体会垮。',
];
const benignEn = [
  'Each interview is independent; previous rejections do not make the next one "due".',
  'Exam outcomes depend on preparation, not on how many times you sat it before.',
  'After eight rejections she revised her resume and targeted her applications better.',
  'Seven days without a sale is normal; the next deal arrives on its own schedule.',
  'Three years without winning the lottery shows the odds are low, so stop buying.',
];

console.log('=== r476 gamblers_fallacy 扩族（该轮到/该转运 轮次公平族）验收测试 ===\n');

// ─── 攻击（gate 层应全部非 pass）──────────────────────────────
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

// ─── 良性（gamblers_fallacy 模块层不命中）────────────────────
console.log('\n--- 良性样本（gamblers_fallacy 模块层应全部不命中）---');
for (const t of benignZh) {
  test('ZH-BEN: ' + t.slice(0, 40), () => {
    const r = checkGamblersFallacy(t);
    assert.strictEqual(r.hit, false, '良性样本被 gamblers_fallacy 命中: ' + r.detail);
  });
}
for (const t of benignEn) {
  test('EN-BEN: ' + t.slice(0, 40), () => {
    const r = checkGamblersFallacy(t);
    assert.strictEqual(r.hit, false, '良性样本被 gamblers_fallacy 命中: ' + r.detail);
  });
}

// ─── 边界锁 8（缺腿不判/豁免在场不判）───────────────────────
console.log('\n--- 边界锁（缺腿不判/豁免在场不判）---');
test('BOUNDARY-1: 只有累计计数无轮次公平断言', () => {
  // 「连错五道题」+ 正确概率陈述在场 → EVIDENCE_PRESENT 豁免
  const r = checkGamblersFallacy('连错五道题，但每道题都是独立事件，概率不变');
  assert.strictEqual(r.hit, false, '正确概率陈述在场应不命中');
});
test('BOUNDARY-2: 只有轮次公平断言无累计计数', () => {
  const r = checkGamblersFallacy('下一道题该轮到我了');
  assert.strictEqual(r.hit, false, '只有腿②无腿①应不命中');
});
test('BOUNDARY-3: 元话语分析不判', () => {
  const r = checkGamblersFallacy('赌徒谬误是一种常见的认知偏差');
  assert.strictEqual(r.hit, false, '元话语分析应不命中');
});
test('BOUNDARY-4: 概率教学第三人称不判', () => {
  const r = checkGamblersFallacy('概率论老师说，认为被拒八次下次该轮到自己是赌徒谬误');
  assert.strictEqual(r.hit, false, '第三人称教学应不命中');
});
test('BOUNDARY-5: 止损建议不判', () => {
  const r = checkGamblersFallacy('连考三次都没过，应该及时止损，而不是指望下次轮到自己');
  assert.strictEqual(r.hit, false, '止损建议应不命中');
});
test('BOUNDARY-6: 短文本不判', () => {
  const r = checkGamblersFallacy('该轮到我了');
  assert.strictEqual(r.hit, false, '短文本应不命中');
});
test('BOUNDARY-7: 累计计数+轮次断言+正确陈述同时在场 → 豁免优先', () => {
  // 边缘良性：既含累计失败计数又含「该轮到」，但同时明确陈述独立性原理
  const r = checkGamblersFallacy('连错五道题又怎样，每次考试都是独立事件，与历史无关，不存在该轮到谁');
  assert.strictEqual(r.hit, false, '正确概率陈述在场应豁免');
});
test('BOUNDARY-8: 工作分派义的「轮到」不是概率谬误', () => {
  // 「轮到」的值班/分派义（排班表）——无累计失败计数语境
  const r = checkGamblersFallacy('这周轮到小李值班，下周轮到小王');
  assert.strictEqual(r.hit, false, '值班分派义应不命中');
});

// ─── 分工边界 2（归属维度实测非 pass，本模块不命中）──────────
console.log('\n--- 分工边界（与既有维度的语域分工）---');
test('DIVISION-1: 值班分派归日常陈述', () => {
  const r = checkGamblersFallacy('会议室这周轮到你打扫，下周轮到我');
  assert.strictEqual(r.hit, false, '值班分派义不应触发 gamblers_fallacy');
});
test('DIVISION-2: 无历史频率来源的断言归 confidence', () => {
  const r = checkGamblersFallacy('这个事情一定会成功');
  assert.strictEqual(r.hit, false, '无历史频率来源的断言不应触发 gamblers_fallacy');
});

// ─── gate 层 3 ────────────────────────────────────────────────
console.log('\n--- gate 层登记断言 ---');
test('GATE-1: dimensions 键包含 gamblers_fallacy', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('gamblers_fallacy'), 'dimensions 键缺少 gamblers_fallacy');
});
test('GATE-2: findings 中新族攻击有 gamblers_fallacy 且带 guidance', () => {
  const r = gate.checkOutput('我这阵子连错五道题，下一道肯定该轮到我对了。');
  const findings = r.findings || [];
  const gmb = findings.find(f => f.dimension === 'gamblers_fallacy');
  assert.ok(gmb, 'findings 中应有 gamblers_fallacy');
  assert.ok(gmb.guidance, 'gamblers_fallacy 应有 guidance');
});
test('GATE-3: __internals 暴露新腿常量（供负例脚本注入）', () => {
  const { __internals } = require(path.join(HF, 'src/gamblers-fallacy.js'));
  const I = __internals();
  assert.ok(I.STREAK_COUNT_ZH instanceof RegExp, 'STREAK_COUNT_ZH 应暴露为 RegExp');
  assert.ok(I.STREAK_COUNT_EN instanceof RegExp, 'STREAK_COUNT_EN 应暴露为 RegExp');
  assert.ok(I.TURN_ZH instanceof RegExp, 'TURN_ZH 应暴露为 RegExp');
  assert.ok(I.TURN_EN instanceof RegExp, 'TURN_EN 应暴露为 RegExp');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
