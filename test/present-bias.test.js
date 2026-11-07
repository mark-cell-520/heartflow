/**
 * test/present-bias.test.js — r243 现时偏差（双曲贴现）维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 32 条疑难 FP 压力样本）、
 * 概念讨论/正确跨期计划两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（既有维度领地/单腿/否定前缀/A不A疑问形/超距）、中英混排多签名、
 * 负例注入（双腿族逐族删除/豁免删除/距离窗承重）、引擎闸良性守卫。
 * 与 r228-r242 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectPresentBias } = require('../src/present-bias.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：现在即时满足 × 未来代价被推迟或贴现）────
const ATTACKS_ZH = [
  '体检以后再说，今晚先痛快吃了，以后的事以后再说。',
  '明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样。',
  '房贷三十年慢慢还，眼下先刷爆卡过上自己想要的日子。',
  '戒烟从下周开始，今天这根先抽完。',
  '未来的健康打八折，眼前的火锅一分不能少。',
  '知道存钱重要，可双十一的爽是今天的，账户里的数字是以后的事。',
  '牙疼忍到开学再说，现在的关键是先把这局游戏打完。',
  '复习明天再说，今晚的开黑就差我一个。',
  '先刷卡住进想要的房子，还款是未来自己的问题。',
  '长寿不长寿是几十年后的事，这根烟的快感现在就能拿到。',
];
const ATTACKS_EN = [
  'saving is for later, right now I need to enjoy what I can actually feel.',
  'why save for retirement when I can be happy today, the future is a discount away.',
  'I know it will hurt me later, but the pleasure is right here today.',
  'future me can deal with the consequences, I want it now.',
  'The report can wait until tomorrow; tonight I just want to party and feel good.',
  'Deadline is next week, but tonight the game is calling and I deserve to enjoy right now.',
  'My health is a problem for future me, so tonight I deserve to enjoy every bite of this dessert.',
];

// ─── 良性样本（不得命中：32 条，含 20 条疑难 FP 压力样本）──────
const BENIGN_HARD = [
  // 正确跨期计划/自控
  '截止日期前一周开始每天做一点，比最后通宵更可靠。',
  '虽然眼前很累，但体检报告提醒我这周就去约。',
  '及时行乐也要有度，我每月固定存下收入的四成。',
  '我们知道拖延的代价，所以把大目标拆成今天就能完成的小步。',
  '从下周一开始戒糖，我已经把购物清单都换了。',
  '明天的会议材料今晚写完，免得早上手忙脚乱。',
  '先写完作业再玩，这是从小养成的习惯。',
  '今日事今日毕，晚上才能安心睡觉。',
  'commit early and reward yourself after the milestone is done.',
  'I break the goal into small steps and finish each one today.',
  'I will deal with the report now, not later, so the weekend stays free.',
  'We save automatically every month before any spending happens.',
  // 概念讨论
  'present bias is a well-documented finding in intertemporal choice research.',
  '实验预注册可以有效降低分析中的确认偏误。',
  '双曲贴现模型解释了为什么人们对即时奖励的偏好偏离指数贴现。',
  '跨期选择研究里，Thaler 和 Shefrin 的自我控制模型很有名。',
  'Present-biased preferences are common in savings and health decisions.',
  // 第三方转述/纠正
  '他总是拖到明天再说，我劝他设个闹钟把任务拆成小块。',
  'He keeps saying he will do it later, so we set a deadline for today.',
  // 单腿：只现在满足无未来贴现
  '今晚先痛快吃了，这家火锅排队也值。',
  'I want it now and I have the money to buy it today.',
  // 单腿：只未来推迟无现在满足
  '体检以后再说，最近实在抽不出时间。',
  '先记在备忘录里，下周再统一处理。',
  // 否定前缀
  '并不是现在就该享受，未来的账迟早要还。',
  '我不会再说明天再说了，今天的事今天做完。',
  'It is not that I want it now; the bill is due tomorrow and I will pay it.',
  // A不A 疑问形中的「不」不是否定（不得因假否定漏判攻击，也不得误伤）
  '好不好是以后的事，先把今天过好。',
  // 既有维度领地
  '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。',
  '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。',
  '以后会更好的，未来一定证明今天的坚持值得。',
  '他答应我下个月一定加薪，让我再相信他一次。',
  '今天不买就是亏，逛街不能空手回去。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲现时偏差：体检以后再说，今晚先痛快吃了，以后的事以后再说——教科书案例。',
  '行为经济学用双曲贴现解释：明知道熬夜伤身，可凌晨的快乐是现在就有的，谁管明天怎么样。',
  'The textbook defines present bias: saving is for later, right now I need to enjoy what I can actually feel.',
];

// ─── 豁免族 B：正确跨期计划（真实签名 + 计划标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '虽然今晚想先痛快吃了，体检以后再说，但我把大目标拆成这周就能去的小步，今日事今日毕。',
  '他说还款是以后的事，今晚想先痛快吃了，我劝他每月固定存钱，截止日期前提前动手，别等明天。',
  'I want it now, saving can wait for later, but I break the goal into small steps and save automatically every month.',
];

// ─── 边界锁（既有维度领地/单腿/否定前缀/A不A/超距）────────────
const BOUNDARY = [
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['诉诸未来领地', '以后会更好的，未来一定证明今天的坚持值得。'],
  ['虚假承诺领地', '他答应我下个月一定加薪，让我再相信他一次。'],
  ['单腿-只现在满足', '今晚先痛快吃了，这家火锅排队也值。'],
  ['单腿-只未来推迟', '体检以后再说，最近实在抽不出时间。'],
  ['否定前缀-ZH', '并不是现在就该享受，未来的账迟早要还。'],
  ['否定前缀-EN', 'It is not that I want it now; the bill is due tomorrow and I will pay it.'],
];
// 双腿超距（默认邻近窗 ZH60 不命中）
const OVERDIST = '今晚先痛快吃了。' + '各'.repeat(200) + '体检以后再说。';

const MIXED = '今晚先痛快吃了，体检以后再说；saving is for later, right now I need to enjoy what I can actually feel.';
const MULTI_ZH = '今晚先痛快吃了，体检以后再说；复习明天再说，今晚的开黑就差我一个。';

console.log('present-bias（r243 现时偏差/双曲贴现）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectPresentBias, 'function');
  assert.equal(detectPresentBias('').hit, false);
  assert.equal(detectPresentBias(null).hit, false);
  assert.equal(detectPresentBias('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectPresentBias(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'present_bias');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 7 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectPresentBias(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：32 条（含 20 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectPresentBias(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 3 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectPresentBias(t).hit, false, '误伤: ' + t);
});

check('豁免族：正确跨期计划（中英 3 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectPresentBias(t).hit, false, '误伤: ' + t);
});

check('边界锁：既有维度领地/单腿/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectPresentBias(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectPresentBias(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectPresentBias(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿链各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectPresentBias(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文双腿族删除后攻击全部不再命中', () => {
  assert.equal(detectPresentBias(ATTACKS_ZH[0], { NOW_ZH: [] }).hit, false, '删现在即时满足ZH');
  assert.equal(detectPresentBias(ATTACKS_ZH[0], { LATER_ZH: [] }).hit, false, '删未来推迟贴现ZH');
  assert.equal(detectPresentBias(ATTACKS_ZH[3], { NOW_ZH: [] }).hit, false, '删现在即时满足ZH-2');
  assert.equal(detectPresentBias(ATTACKS_ZH[6], { LATER_ZH: [] }).hit, false, '删未来推迟贴现ZH-2');
});

check('负例注入：英文双腿族删除后攻击全部不再命中', () => {
  assert.equal(detectPresentBias(ATTACKS_EN[0], { NOW_EN: [] }).hit, false, '删现在即时满足EN');
  assert.equal(detectPresentBias(ATTACKS_EN[0], { LATER_EN: [] }).hit, false, '删未来推迟贴现EN');
  assert.equal(detectPresentBias(ATTACKS_EN[2], { NOW_EN: [] }).hit, false, '删现在即时满足EN-2');
  assert.equal(detectPresentBias(ATTACKS_EN[3], { LATER_EN: [] }).hit, false, '删未来推迟贴现EN-2');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectPresentBias(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectPresentBias(EXEMPT_CONCEPT[2], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：正确跨期计划豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectPresentBias(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删跨期计划ZH');
  assert.equal(detectPresentBias(EXEMPT_CORRECTIVE[2], { CORRECTIVE_EN: NEVER }).hit, true, '删跨期计划EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectPresentBias(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectPresentBias(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 present_bias 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('present_bias'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
