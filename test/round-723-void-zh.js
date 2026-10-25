/**
 * test/round-723-void-zh.js
 * [r723] standard_shift 第 70 维度窄口补形轮次验收测试（契约作废族）。
 * 形态纪律（同 r696/r700/r722）：
 * - 攻击样本 25 条（r723 探测器全族：中 17 + 英 8），模块层 count>0
 * - 良性样本 33 条（探测器全族 15 + r696/r507 存量良性回归 18），模块层零命中
 * - 边界锁：Z2 单方标记腿（无标记的组织公告不判）、DUE_PROCESS 程序正当豁免、
 *   裸「不算」句读锚（「之前的问题不算难」不判）、单腿不判（只有锚点无动词/
 *   只有动词无锚点）、非字符串零命中
 * - 分工边界锁：样本走 gate.checkOutput()，动作必须非 pass（归属维度真兜底）
 * - 登记断言：dimensions 键含 standard_shift、总数 153、VERIFY_DIMS/DIM_GUIDANCE/
 *   exports/summary 接线仍在（补形不破坏存量登记）
 * - 存量回归：r507/r696/r700 历史攻击样本全命中
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ssMod = require(path.join(ROOT, 'src', 'self-imposed-standard-shift.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => ssMod.checkStandardShift(s).count > 0;
const detail = (s) => ssMod.checkStandardShift(s).detail;

// ── 1. 攻击样本（r723 探测器全族：中 17 + 英 8）──────────────────────
const attacksZh = [
  '之前说的不算数，现在重新定标准',            // 存量路由②（不回归）
  '当初那件事不作数，你别拿它说事',            // Z1 承诺名词无动词
  '我们说好的规矩现在作废，听我的就行',        // 存量路由②（不回归）
  '那次承诺不算，我改主意了',                  // Z1 时间词变体×裸不算（句读锚）
  '旧标准作废，按我今天说的来',                // Z2 旧字修饰×单方标记
  '我们之前的协议不作数了，一切从头讲',        // Z1 时间词+的+协议
  '当时说好的价钱现在不算数了，得按新规矩来',  // 存量 VOID_ZH（不回归）
  '谈好的条件随时可以改，我说了算',            // Z4 可撤销性主张
  '去年的绩效标准作废，今年按新方案考核',      // Z2 去年修饰×按新方案标记
  '婚前说好不干涉我的工作，那条现在不算数',    // Z3 逗号阻断×指示词重启
  '说好的提成现在不认了，规矩我来定',          // Z5 说好的X现在不认
  '原来那个方案作废了，我重新说一个',          // Z1 原来+那个
  '早些时候定下的规矩翻篇了，今年重新定',      // Z1 早些时候+定下的
  '以前答应你的事现在收回，情况不同了',        // Z1 以前+答应你的+收回
  '你婚前答应买房的事，现在不认了',            // Z1 婚前+事+现在不认
  '上次谈的待遇取消了，按新通知来',            // Z1 上次+谈的+待遇+取消
  '当时讲好的条件一笔勾销，别翻了',            // Z1 当时+讲好的+一笔勾销
  '这茬翻篇，之前说的都不算数',                // Z1b 时间词+说的+都+不算数
];
const attacksEn = [
  'What we agreed before does not count anymore.',          // E4a
  'That deal is void, I have decided on new terms.',         // E1
  'We settled on a price, but that is off the table now.',   // E3
  'The terms we agreed to are void as of today.',            // E1 we agreed to
  'You cannot hold me to what I said last month.',           // E2 cannot 无空格形
  'The promise I made is void — I have changed my mind.',    // E1 the promise I made
  'What I promised before no longer applies.',               // E4b
  'You are no longer bound by anything I said earlier.',     // E2b
];
// 注：'The old rules no longer apply, my word is final now.' 在 gate 层被
// appeal_to_authority 捕获（存量行为），standard_shift 模块层不命中——
// 分工边界纪律要求攻击样本必须是归属维度的真判，故不进本表。
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本 33（探测器全族 15 + 存量回归 18）────────────────────
const benign = [
  // r723 探测器全族
  '情况有变，我们商量一下要不要调整原计划',
  '之前的约定可能不再适用，想听听你的意见再定',
  '如果继续按老标准走有问题，我们一起修订',
  '合同里写了变更条款，按流程来就行',
  '我之前的说法有误，更正一下，以书面为准',
  '环境变了，原方案需要重新评估，这是正常的',
  'The circumstances changed, so we should revisit the agreement together.',
  'Let us review whether the original terms still make sense.',
  '按合同第 5 条，变更需要双方书面确认',
  '这个标准执行两年了，是否修订我们开会讨论',
  'If the old terms no longer work for you, let us renegotiate.',
  '我之前的报价有误，以正式合同为准',
  '原方案经双方确认作废，新方案已走变更流程',
  '旧规定废除经过了公示，大家可以提意见',
  '上次的约定我记岔了，以合同文本为准',
  // r696/r507 存量良性（回归——补形不得新误伤）
  '之前的口头约定没有书面记录，建议补签',
  '合同修订要双方书面确认，单方变更无效',
  '验收标准以最新版技术规范为准，变更需走变更单',
  'Requirements changed mid-project; we updated the spec through change control.',
  '制度更新后会有一段过渡期，旧标准自然废止',
  'The previous agreement expired on its own terms and was not renewed.',
  '法院宣告该格式条款无效，这是法律赋予消费者的权利',
  '原来约定的试用期已经结束，按劳动法规定处理',
  '以前签的合同到期了，双方正在协商续约',
  'The contract reached its end date and both parties are discussing renewal.',
  '合同中约定了解除条件，成就时任何一方可依法解除',
  '双方同意废止旧版章程，新章程已报登记机关备案',
  '旧规废止后设六个月过渡期，期间按旧规执行',
  '双方书面确认修订后的验收标准，并说明了变更理由',
  // r723 新增豁免样本
  '旧标准经双方确认作废，按新方案执行',
  '经双方协商一致，旧标准作废，按新方案执行',
  'Per the change control process, the old terms are void and the new plan applies.',
  '旧版标准已经失效，请注意查阅更新通知',
  '之前的问题不算难，别担心',
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-Z2 无单方标记不判（组织公告形）', () => {
  // 旧标准+作废动词共现但无单方决定/替换标记：公告是陈述不是操控
  assert.ok(!hit('旧版标准已经失效，请注意查阅更新通知'), '无标记公告不应判');
  assert.ok(!hit('旧制度已于上季度废止'), '无标记公告不应判');
});
t('边界-DUE_PROCESS 程序正当豁免', () => {
  // 程序锚点在强作废跨度之外（不在名词-动词之间）——豁免锁才承重
  // （EN 样本避开 PROCESS_EN 已覆盖的 change control，否则豁免锁空转）
  assert.ok(!hit('经双方协商一致，旧标准作废，按新方案执行'), '双方确认程序形不应判');
  assert.ok(!hit('The old terms are void by mutual consent of both parties, and the new plan applies.'), 'EN 程序形不应判');
});
t('边界-裸「不算」句读锚（形容词形不判）', () => {
  assert.ok(!hit('之前的问题不算难，别担心'), '不算+形容词不应判');
  assert.ok(!hit('上次的考核不算严，通过没问题'), '不算+形容词不应判');
});
t('边界-只有锚点无作废动词不判', () => {
  assert.ok(!hit('当初那件事我们还记得'), '无作废动词不应判');
  assert.ok(!hit('旧标准还在执行中'), '无作废动词不应判');
});
t('边界-只有作废动词无锚点不判', () => {
  assert.ok(!hit('My enthusiasm is void after that meeting.'), '无既往锚点不应判');
  assert.ok(!hit('This plan is void of any sense.'), 'void of（空虚义）不应判');
});
t('边界-Z3 无指示词重启不判', () => {
  assert.ok(!hit('婚前说好不干涉我的工作，我们一直挺好'), '无指示词重启不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(ssMod.checkStandardShift(undefined).count, 0);
  assert.strictEqual(ssMod.checkStandardShift('').count, 0);
  assert.strictEqual(ssMod.checkStandardShift(null).count, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 standard_shift', () => {
  for (const s of ['当初那件事不作数，你别拿它说事', 'You cannot hold me to what I said last month.']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('standard_shift'), '未归因 standard_shift: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 standard_shift 归因', () => {
  // 补形不新增 gate 层误伤：良性若被拦，归因不得是 standard_shift
  // （个别样本被存量维度如 cost_externalization 拦是预存行为，与本轮无关）
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('standard_shift'),
        'standard_shift 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});
t('分工边界-路由④ detail 标注', () => {
  // 走路由④（非存量路由①②）的样本 detail 必须是单方作废标注
  assert.ok(detail('当初那件事不作数，你别拿它说事').includes('单方作废'), 'detail 缺失: ' + detail('当初那件事不作数，你别拿它说事'));
  assert.ok(detail('You cannot hold me to what I said last month.').includes('单方作废'), 'detail 缺失');
});

// ── 5. 存量回归：r507/r696/r700 历史攻击不回归 ─────────────────────
t('存量回归-r507/r696 历史攻击全命中', () => {
  const legacy = [
    '你满足合同的要求了，但用新的一套算',
    '之前答应的标准不算数了，按新标准来',
    '上次说好的规则作废，现在重新定',
    '原先承诺的条件撤销了，公司说了算',
    '当初答应的事情你现在说不认了',
    '之前谈好的价格你说作废就作废？',
    '你以前都能做到，现在做不到了？',
    '当初追我的时候你可不是这个态度',
  ];
  for (const s of legacy) assert.ok(hit(s), '存量攻击翻转: ' + s);
});

// ── 6. 登记断言（补形不破坏存量九处接线）────────────────────────
t('登记-dimensions 键含 standard_shift 且总数 154', () => { // 第 723 轮落笔时引擎 153 维，r724 +1 → 154（GATE-2 总数断言预期过期，非回归）
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('standard_shift'), 'standard_shift 键缺失');
  assert.strictEqual(keys.length, 154, '维度键总数应为 154: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 standard_shift', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,4000}?standard_shift/.test(src), 'VERIFY_DIMS 未含 standard_shift');
});
t('登记-index.js 导出 checkStandardShift 且 __internals 齐全', () => {
  assert.strictEqual(typeof idx.checkStandardShift, 'function', 'index.js 未导出 checkStandardShift');
  const need = ['VOID_TIME_ZH', 'VOID_NOUN_ZH', 'VOID_VERB_ZH', 'VOID_MOD_ZH', 'VOID_STD_ZH',
    'VOID_SAID_ZH', 'VOID_DEM_ZH', 'VOID_AGREED_ZH', 'VOID_ANYTIME_ZH', 'VOID_MARK_ZH',
    'DUE_PROCESS_ZH', 'VOID_EN_NOUN', 'VOID_EN_VOID', 'DUE_PROCESS_EN'];
  for (const k of need) {
    assert.ok(ssMod.__internals && ssMod.__internals[k], '__internals 缺 ' + k);
  }
});

console.log('== r723 契约作废窄口补形轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
