// r239 模块干跑：攻击/良性/边界/豁免/负例注入全量验证（定稿测试前迭代用）
'use strict';
const path = require('path');
const { detectIllusionOfControl } = require(path.join(__dirname, '..', '..', '..', 'src', 'illusion-of-control.js'));

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
const BENIGN_HARD = [
  // 技能域
  '三分球命中率是靠训练堆出来的，每天投五百个，命中率自然往上走。',
  '面试通过率跟准备充不充分关系很大，模拟面练十次比裸考强得多。',
  'Free-throw accuracy improves with practice; shooting five hundred a day moves the percentage.',
  'Interview success depends on preparation, and ten mock interviews beat walking in cold.',
  // 仪式无断言
  '他每次抽奖前都先洗手，图个吉利，至于中不中就看运气了。',
  '我买彩票喜欢固定守一组号，习惯了，也没指望这样更容易中。',
  'She rubs her lucky coin before every raffle, though she knows it changes nothing.',
  // 否定纠偏
  '自己选的号码和机选的号码中奖概率完全相同，选号方式不影响结果。',
  '骰子点数只取决于物理随机性，默念和用力大小都不会改变概率。',
  'Choosing your own numbers does not change the odds; every combination is equally likely.',
  'Dice outcomes are governed by chance, not by how hard you throw or what you visualize.',
  // 概率独立正确认知
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
const EXEMPT_CONCEPT = [
  '心理学教材在讲控制幻觉：买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的——教科书案例。',
  'The textbook defines the illusion of control: picking your own lottery numbers gives better odds than a quick pick because intention matters.',
];
const BOUNDARY = [
  ['hot_hand 领地', '今天手气正旺，连赢五把，下一把肯定还中。'],
  ['gamblers 领地', '都输了八把了，下一把该赢了，继续加注。'],
  ['wishful 领地', '我天天想着中大奖，想着想着早晚会中的。'],
  ['confidence 领地', '我对这个项目毫无疑问，肯定能成。'],
  ['clustering 领地', '这个路口一个月出了四起事故，绝不可能是巧合。'],
  ['缺腿③', '买彩票要自己选号。'],
  ['缺腿①', '默念能让我更专注。'],
  ['缺腿②③', '骰子点数是随机的。'],
  ['否定前缀', '买彩票自己选号并不能提高中奖率，每次开奖都是独立的。'],
  ['技能域拜庙', '考试前她去拜了拜，希望能有个好心态。'],
];
const OVERDIST = '买彩票要自己选号，' + '各'.repeat(70) + '，中奖率比机选高。';
const MIXED = '买彩票要自己选号，自己选的号码中奖率比机选高；Picking your own lottery numbers gives better odds than a quick pick.';
const MULTI_ZH = '买彩票自己选号，中奖率比机选高；掷骰子前先拜一拜，心诚则灵，出大的概率会高一些。';

let bad = 0;
function expect(cond, msg) { if (!cond) { bad++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

console.log('== 攻击 ZH ==');
for (const t of ATTACKS_ZH) expect(detectIllusionOfControl(t).hit === true, t.slice(0, 24) + ' → ' + JSON.stringify(detectIllusionOfControl(t).details || '').slice(0, 80));
console.log('== 攻击 EN ==');
for (const t of ATTACKS_EN) expect(detectIllusionOfControl(t).hit === true, t.slice(0, 24));
console.log('== 良性（应全部 false）==');
for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
  const r = detectIllusionOfControl(t);
  expect(r.hit === false, (r.hit ? '误伤: ' + t + ' → ' + r.details.slice(0, 90) : t.slice(0, 24)));
}
console.log('== 豁免（应 false）==');
for (const t of EXEMPT_CONCEPT) expect(detectIllusionOfControl(t).hit === false, t.slice(0, 24));
console.log('== 边界（应全部 false）==');
for (const [k, t] of BOUNDARY) {
  const r = detectIllusionOfControl(t);
  expect(r.hit === false, (r.hit ? '误判[' + k + ']: ' + t + ' → ' + r.details.slice(0, 90) : k + ' ' + t.slice(0, 16)));
}
console.log('== 超距/混排/多签名 ==');
expect(detectIllusionOfControl(OVERDIST).hit === false, '超距默认窗不命中');
expect(detectIllusionOfControl(OVERDIST, { PAIR_ZH: 500 }).hit === true, '放大窗后命中');
const m = detectIllusionOfControl(MIXED);
expect(m.hit === true && m.count === 2, '混排双签名 count=' + (m.count || 0));
const z = detectIllusionOfControl(MULTI_ZH);
expect(z.hit === true && z.count >= 2, '多签名 count=' + (z.count || 0));
console.log('== 负例注入 ==');
const NEVER = /(?!)/;
expect(detectIllusionOfControl(ATTACKS_ZH[0], { A_ZH: [] }).hit === false, '删 A_ZH');
expect(detectIllusionOfControl(ATTACKS_ZH[0], { B_ZH: [] }).hit === false, '删 B_ZH');
expect(detectIllusionOfControl(ATTACKS_ZH[0], { C_ZH: [] }).hit === false, '删 C_ZH');
expect(detectIllusionOfControl(ATTACKS_EN[0], { A_EN: [] }).hit === false, '删 A_EN');
expect(detectIllusionOfControl(ATTACKS_EN[0], { B_EN: [] }).hit === false, '删 B_EN');
expect(detectIllusionOfControl(ATTACKS_EN[0], { C_EN: [] }).hit === false, '删 C_EN');
expect(detectIllusionOfControl(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit === true, '删 CONCEPT_ZH 后变红');
expect(detectIllusionOfControl(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit === true, '删 CONCEPT_EN 后变红');

console.log(bad === 0 ? '\n干跑全部通过' : '\n干跑缺陷数: ' + bad);
process.exit(bad === 0 ? 0 : 1);
