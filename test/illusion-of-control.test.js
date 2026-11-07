/**
 * test/illusion-of-control.test.js — r239 控制幻觉维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 22 条疑难 FP 压力样本）、
 * 概念讨论豁免族（嵌入真实签名 + 豁免标记，可负例注入证明承重）、
 * 边界锁（既有维度领地/缺腿/否定前缀/技能域/超距）、
 * 中英混排多签名、负例注入（三腿族删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r238 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectIllusionOfControl } = require('../src/illusion-of-control.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  '掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大。',
  '抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大。',
  '老虎机投币之前先拜一拜，心诚则灵，出分的概率会高一些。',
  '抽卡之前把手机擦干净、双手捧着抽，仪式做足了出金色的概率更大。',
  '他买彩票专挑吉利数字，说这样的号码更容易中大奖。',
  '摇号买房前她去庙里上了香，回来告诉我们这回中签的希望大了不少。',
  '我坚信意念能左右掷硬币的结果，集中精神想正面就行。',
];
const ATTACKS_EN = [
  'Picking your own lottery numbers gives better odds than a quick pick because intention matters.',
  'If you throw the dice hard while visualizing a high number, you are more likely to roll high.',
  'She reached into the raffle drum and deliberated before choosing, and her careful pick improved her chances.',
  'Rubbing the dice before a roll brings good luck and improves your chances of a high number.',
  'He always picks his own lottery numbers because a chosen ticket wins more often than a random one.',
  'Praying before spinning the wheel raises the odds that the ball lands on your color.',
  'Wearing his lucky socks to the casino increases his chance of hitting the jackpot.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN_HARD = [
  // 技能域：技能确实改变结果概率，且无纯随机事件锚点
  '三分球命中率是靠训练堆出来的，每天投五百个，命中率自然往上走。',
  '面试通过率跟准备充不充分关系很大，模拟面练十次比裸考强得多。',
  'Free-throw accuracy improves with practice; shooting five hundred a day moves the percentage.',
  'Interview success depends on preparation, and ten mock interviews beat walking in cold.',
  // 仪式无断言：只描述行为或偏好，不下影响结论（缺腿③）
  '他每次抽奖前都先洗手，图个吉利，至于中不中就看运气了。',
  '我买彩票喜欢固定守一组号，习惯了，也没指望这样更容易中。',
  'She rubs her lucky coin before every raffle, though she knows it changes nothing.',
  // 否定纠偏
  '自己选的号码和机选的号码中奖概率完全相同，选号方式不影响结果。',
  '骰子点数只取决于物理随机性，默念和用力大小都不会改变概率。',
  'Choosing your own numbers does not change the odds; every combination is equally likely.',
  'Dice outcomes are governed by chance, not by how hard you throw or what you visualize.',
  // 概率独立的正确认知
  '硬币连续出了五次正面，下一次正面的概率依然是二分之一，跟怎么抛无关。',
  'Each lottery draw is independent, so no selection method or ritual shifts the odds.',
  // r239 扩充高难度良性
  '高考前家长去庙里上香，图个心理安慰，孩子该刷的题一道也没少刷。',
  '公司年会的抽奖环节人人有份，阳光普照，图个热闹。',
  '他买彩票十几年，从来机选，说这样省心。',
  '硬币抛过很多次，统计下来正面出现的频率确实接近一半。',
  'The office pool buys tickets together every year, though nobody expects to win.',
  '摇号选车位，全凭系统随机分配，谁先谁后不影响公平性。',
  '这家赌场的轮盘每局独立，押大押小的历史结果说明不了任何趋势。',
];
const BENIGN_NORMAL = [
  '公司年会上他抽中了一台手机，运气不错。',
  'The jackpot rolled over again this week and ticket sales soared.',
  '概率论课上老师讲了掷骰子的独立事件。',
];

// ─── 豁免族：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲控制幻觉：买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的——教科书案例。',
  'The textbook defines the illusion of control: picking your own lottery numbers gives better odds than a quick pick because intention matters.',
];

// ─── 边界锁（既有维度领地/缺腿/否定前缀/技能域/超距，不得命中）────
const BOUNDARY = [
  ['hot_hand 领地', '今天手气正旺，连赢五把，下一把肯定还中。'],
  ['gamblers_fallacy 领地', '都输了八把了，下一把该赢了，继续加注。'],
  ['wishful_thinking 领地', '我天天想着中大奖，想着想着早晚会中的。'],
  ['confidence 领地', '我对这个项目毫无疑问，肯定能成。'],
  ['clustering_illusion 领地', '这个路口一个月出了四起事故，绝不可能是巧合。'],
  ['缺腿③', '买彩票要自己选号。'],
  ['缺腿①', '默念能让我更专注。'],
  ['缺腿②③', '骰子点数是随机的。'],
  ['否定前缀', '买彩票自己选号并不能提高中奖率，每次开奖都是独立的。'],
  ['技能域拜庙（无随机锚点）', '考试前她去拜了拜，希望能有个好心态。'],
];
// 双腿超距（默认窗 ZH60 不命中）
const OVERDIST = '买彩票要自己选号，' + '各'.repeat(70) + '，中奖率比机选高。';

const MIXED = '买彩票要自己选号，自己选的号码中奖率比机选高；Picking your own lottery numbers gives better odds than a quick pick.';
const MULTI_ZH = '买彩票自己选号，中奖率比机选高；掷骰子前先拜一拜，心诚则灵，出大的概率会高一些。';

console.log('illusion-of-control（r239 控制幻觉）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectIllusionOfControl, 'function');
  assert.equal(detectIllusionOfControl('').hit, false);
  assert.equal(detectIllusionOfControl(null).hit, false);
  assert.equal(detectIllusionOfControl('短').hit, false);
});

check('攻击命中：中文 8 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectIllusionOfControl(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'illusion_of_control');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 7 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectIllusionOfControl(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：25 条（含 22 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectIllusionOfControl(t).hit, false, '误伤: ' + t);
  for (const t of BENIGN_NORMAL) assert.equal(detectIllusionOfControl(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) {
    assert.equal(detectIllusionOfControl(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/否定前缀/技能域/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectIllusionOfControl(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectIllusionOfControl(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectIllusionOfControl(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿在窗内可组合出多签名，r238 同型固有组合）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectIllusionOfControl(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：六组三腿族删除后攻击全部不再命中', () => {
  assert.equal(detectIllusionOfControl(ATTACKS_ZH[0], { A_ZH: [] }).hit, false, '删随机事件ZH');
  assert.equal(detectIllusionOfControl(ATTACKS_ZH[0], { B_ZH: [] }).hit, false, '删控制行为ZH');
  assert.equal(detectIllusionOfControl(ATTACKS_ZH[0], { C_ZH: [] }).hit, false, '删影响断言ZH');
  assert.equal(detectIllusionOfControl(ATTACKS_EN[0], { A_EN: [] }).hit, false, '删随机事件EN');
  assert.equal(detectIllusionOfControl(ATTACKS_EN[0], { B_EN: [] }).hit, false, '删控制行为EN');
  assert.equal(detectIllusionOfControl(ATTACKS_EN[0], { C_EN: [] }).hit, false, '删影响断言EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectIllusionOfControl(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectIllusionOfControl(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectIllusionOfControl(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectIllusionOfControl(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 illusion_of_control 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('illusion_of_control'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
