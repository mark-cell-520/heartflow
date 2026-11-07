/**
 * test/inverse-gamblers-fallacy.test.js — 逆赌徒谬误维度测试（r248）
 * 模块未接线（src/index.js 由 1 号接线），本测试只测
 * src/inverse-gamblers-fallacy.js 的判别器本身，与 prosecutors-fallacy
 * 测试同构：模块直调 + __internals 注入常量做负例。
 */
'use strict';

const assert = require('node:assert/strict');
const {
  detectInverseGamblersFallacy,
  __internals,
} = require('../src/inverse-gamblers-fallacy.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`ok - ${name}`); }
  catch (e) { failed++; console.log(`FAIL - ${name}: ${e.message}`); }
}

const I = __internals();
const P = (t) => detectInverseGamblersFallacy(t);
const NEVER = /(?!x)x/;
const P2 = (t, inj) => detectInverseGamblersFallacy(t, inj);

// ─── 1. 攻击样本必须命中 ───────────────────────────────────────
check('攻击样本全部命中（中 18 / 英 10）', () => {
  const ZH = [
    '他一上场就进球，肯定是个身经百战的老将',
    '第一次开口就说到重点，这人肯定练了十年',
    '第一把就胡了，这桌肯定打了很多圈',
    '新号第一发就出金，这池子前面肯定垫了很久',
    '新店第一天就排队，背后肯定养了很久的客',
    '一枪就中，这靶前面肯定练过无数回',
    '他第一次出手就做成了，这样的身手背后没有几千次练习是练不出来的',
    '头一回上考场就拿了满分，这孩子之前不知道已经刷了多少套题',
    '刚开张就客流不断，说明这片市场他们早就铺垫了很久',
    '第一把就抽到了隐藏款，前面那些空抽一定已经垫够了次数',
    '头一次尝试就成功，可见之前失败过很多次',
    '第一把就中了，这个奖池前面肯定已经被抽空了好多次',
    '首发就破门，这名球员背后一定经历了上千场比赛的锤炼',
    '第一次抽奖就中了大奖，这个箱子之前肯定被抽空过很多次',
    '新官第一把火就烧成了，说明他之前已经失败了不知道多少回',
    '刚注册就抽到稀有卡，这账号池前面一定垫了很久',
    '第一发就命中靶心，可见之前已经练过无数发',
    '第一把就出金，这池子肯定空了不知道多少',
  ];
  const EN = [
    'He scored on his first shot, so he must have been playing for years',
    'She nailed it on the first try, so the dice must have been rolled many times',
    'The machine paid out immediately, so it must have been building up for hours',
    'He hit the target on the first attempt, so the range must have been used a lot before',
    'It worked the very first time, so the process must have been running long before we arrived',
    'The rookie scored on debut, which means he must have put in thousands of hours already',
    'The first spin hit the jackpot, so the machine must have been primed for hours',
    'She solved it on the first attempt, which means the puzzle must have been attempted thousands of times',
    'He aced the exam on his first try, so he must have failed it many times before',
    'She won the lottery on her very first ticket, so she must have been buying tickets for years',
  ];
  for (const t of ZH) assert.ok(P(t).hit, '应命中: ' + t);
  for (const t of EN) assert.ok(P(t).hit, '应命中: ' + t);
});

// ─── 2. 返回结构 ───────────────────────────────────────────────
check('命中返回完整结构（hit/dimension/severity/score/count/evidence/details/guidance/tags）', () => {
  const r = P('他一上场就进球，肯定是个身经百战的老将');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'inverse_gamblers_fallacy');
  assert.ok(r.severity > 0 && r.severity <= 100);
  assert.ok(r.score > 0 && r.score <= 1);
  assert.ok(r.count >= 1);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(r.evidence[0].length > 0 && r.evidence[0].includes('身经百战'), 'evidence 应含腿②原词: ' + r.evidence[0]);
  assert.ok(r.details.includes('逆赌徒谬误'));
  assert.ok(r.guidance.includes('逆赌徒谬误'));
  assert.ok(r.guidance.includes('inverse gambler'));
  assert.ok(r.tags.includes('inverse-gamblers-fallacy'));
  assert.ok(r.tags.includes('backward-inference'));
});

check('多签名句子 count 更高', () => {
  const single = P('第一次开口就说到重点，这人肯定练了十年');
  const multi = P('第一把就出金，这池子前面肯定垫了很久；刚开张就客流不断，说明他们早就养了很久的客');
  assert.ok(multi.hit);
  assert.ok(multi.count > single.count, '多签名句 count 应更高: ' + multi.count + ' vs ' + single.count);
  assert.ok(multi.count >= 2, 'count 应 >=2，实际 ' + multi.count);
  assert.ok(multi.score >= 0.66);
});

check('未命中返回 {hit:false, score:0}', () => {
  const r = P('今天天气不错，适合出门散步');
  assert.equal(r.hit, false);
  assert.equal(r.score, 0);
  assert.equal(r.detail, '');
  assert.equal(r.count, 0);
});

check('空输入/过短输入不命中', () => {
  assert.equal(P('').hit, false);
  assert.equal(P(null).hit, false);
  assert.equal(P(undefined).hit, false);
  assert.equal(P('第一把').hit, false);
});

// ─── 3. 疑难良性零误伤 ─────────────────────────────────────────
check('疑难良性零误伤（承认运气/指出无法反推/正向归因/单腿/序列）', () => {
  const BENIGN = [
    '第一次就成功很可能只是运气好，过程有多长无从推断',
    '一次成功不能反推他之前练了多少次，得看他平时的训练记录',
    '赌场里连开十把大，并不能说明这台机器之前开了多久',
    '首发命中和过程历史没有必然联系，不能倒着推',
    '头一把就中，也可能纯属偶然，之前发生过什么并不重要',
    'Winning on the first try does not tell us how long the process had been running',
    'Success on the first attempt tells us nothing about how long the process had run',
    '虽然开局不错，但之前的尝试次数需要另外统计',
    '第一次面试就通过，因为他确实准备了很久',
    '第一次就成功，离不开之前几千次的打磨',
    'The first version worked, because we had tested it for months',
    'She won on her first try, though she had been practising for years already',
    '他第一次出手就做成了，他确实练了十年，这是记录在案的',
    '第一把就出金，运气不错',
    '之前失败过很多次，但他没放弃',
    '他连赢了五把，下一把大概率还是他赢',
    '他连赢五把，说明他状态好',
    '有个用户吃了就好转了，这药肯定有效',
    '过去三年每年都涨两成，所以明年也会涨两成',
    'Three users reported improvement, so the drug works',
    'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
    '他一上场就进球，状态肯定不错',
    '第一次开会，这成了我们后续所有决策的基调',
    '第一次上线就卖光了，但我们备货本来就很少',
  ];
  for (const t of BENIGN) assert.equal(P(t).hit, false, '不应命中: ' + t);
});

// ─── 4. 邻接领地零误收 ────────────────────────────────────────
check('邻接领地句零误命中', () => {
  const ADJ = [
    '已经连输十把，下一把赢的概率并不会变大',
    '他连赢五把，下一把大概率还是他赢',
    '见过几个人这样，就断定所有人都这样，证据不足',
    '有个用户吃了就好转了，这药肯定有效',
    'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
    '他一上场就进球，状态肯定不错',
  ];
  for (const t of ADJ) assert.equal(P(t).hit, false, '邻接不应命中: ' + t);
});

// ─── 5. 负例注入：删除常量后守卫必须变红 ───────────────────────
check('负例：腿①整族删除（首次标记+结果词+即时复合形中英）→ 攻击全部不命中', () => {
  const inj = { FIRST_ZH: [], FIRST_EN: [], OUTCOME_ZH: [], OUTCOME_EN: [], IMMEDIATE_ZH: NEVER, IMMEDIATE_EN: NEVER };
  const ZH = ['他一上场就进球，肯定是个身经百战的老将', '第一把就出金，这池子前面肯定垫了很久'];
  const EN = ['He scored on his first shot, so he must have been playing for years'];
  for (const t of ZH) assert.equal(P2(t, inj).hit, false);
  for (const t of EN) assert.equal(P2(t, inj).hit, false);
});

check('负例：腿①结果词族删除 → 攻击全部不命中', () => {
  const inj = { OUTCOME_ZH: [], OUTCOME_EN: [], IMMEDIATE_ZH: NEVER, IMMEDIATE_EN: NEVER };
  const ZH = ['他一上场就进球，肯定是个身经百战的老将', '第一次开口就说到重点，这人肯定练了十年'];
  const EN = ['He scored on his first shot, so he must have been playing for years'];
  for (const t of ZH) assert.equal(P2(t, inj).hit, false);
  for (const t of EN) assert.equal(P2(t, inj).hit, false);
});

check('负例：腿②过程长度族（TIGHT+LOOSE 中英）删除 → 攻击全部不命中', () => {
  const inj = {
    PROCESS_ZH_TIGHT: [], PROCESS_ZH_LOOSE: [],
    PROCESS_EN_TIGHT: [], PROCESS_EN_LOOSE: [],
    IMMEDIATE_ZH: NEVER, IMMEDIATE_EN: NEVER,
  };
  const ZH = ['他一上场就进球，肯定是个身经百战的老将', '第一把就出金，这池子前面肯定垫了很久'];
  const EN = ['He scored on his first shot, so he must have been playing for years'];
  for (const t of ZH) assert.equal(P2(t, inj).hit, false);
  for (const t of EN) assert.equal(P2(t, inj).hit, false);
});

check('负例：推断标记删除 → LOOSE 形腿②攻击变红', () => {
  const inj = { INFER_ZH: NEVER, INFER_EN: NEVER, IMMEDIATE_ZH: NEVER, IMMEDIATE_EN: NEVER };
  const LOOSE = ['第一把就胡了，这桌肯定打了很多圈', '他第一次出手就做成了，他肯定练了十年'];
  for (const t of LOOSE) assert.equal(P2(t, inj).hit, false, 'LOOSE 应失配: ' + t);
  // TIGHT 形（双重否定）仍应命中
  assert.ok(P2('他第一次出手就做成了，这样的身手背后没有几千次练习是练不出来的', inj).hit);
});

check('负例：距离窗收紧到 0 → 攻击句失配', () => {
  const inj = { W_PAIR_ZH: 0, W_PAIR_EN: 0, W_FIRST_OUT_ZH: 0, W_FIRST_OUT_EN: 0, IMMEDIATE_ZH: NEVER, IMMEDIATE_EN: NEVER };
  assert.equal(P2('他一上场就进球，肯定是个身经百战的老将', inj).hit, false);
  assert.equal(P2('He scored on his first shot, so he must have been playing for years', inj).hit, false);
});

check('负例：距离窗放大到 500 → 超距句变命中（证明窗承重）', () => {
  const OVER = '他一上场就进球，从那以后大家聊了很久，聊到去年的训练营，聊到他的体能报告，聊到他每天加练到深夜，聊到他带伤坚持完成全部科目，聊到他赛后主动加练两组力量，最后一致认为肯定是个身经百战的老将';
  assert.equal(P(OVER).hit, false, '默认窗不命中');
  assert.equal(P2(OVER, { W_PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('负例：因果守卫删除 → 正向归因句变命中（证明守卫承重）', () => {
  const inj = { CAUSAL_ZH: NEVER, CAUSAL_EN: NEVER };
  // TIGHT 形腿②（双重否定）+ 因果标记
  assert.equal(P2('他第一次出手就做成了，因为没有几千次练习是练不出来的', inj).hit, true);
  // LOOSE 形腿② + 因果标记 + 推断标记
  assert.equal(P2('第一次面试就通过，因为肯定准备了很久', inj).hit, true);
  // 英文：because + 过程长度推断
  assert.equal(P2('He scored on his first shot, because he must have been playing for years', inj).hit, true);
});

check('负例：否定守卫删除 → 前史否定句变命中（证明守卫承重）', () => {
  const inj = { NEG_BEFORE_ZH: NEVER, NEG_BEFORE_EN: NEVER, NEG_INSIDE_ZH: NEVER };
  assert.equal(P2('他第一次出手就做成了，但他之前没有失败过很多次', inj).hit, true);
});

check('负例：CONCEPT 豁免删除 → 概念教学句变命中（证明豁免承重）', () => {
  const inj = { CONCEPT_ZH: NEVER, CONCEPT_EN: NEVER };
  assert.equal(P2('逆赌徒谬误指的是他一上场就进球，肯定是个身经百战的老将', inj).hit, true);
  assert.equal(P2('The inverse gambler fallacy is illustrated by: he scored on his first shot, so he must have been playing for years', inj).hit, true);
});

check('负例：CORRECTIVE 豁免删除 → 承认运气句变命中（证明豁免承重）', () => {
  const inj = { CORRECTIVE_ZH: NEVER, CORRECTIVE_EN: NEVER };
  assert.equal(P2('第一次就成功，只是运气，肯定不是之前失败过很多次', inj).hit, true);
  assert.equal(P2('He scored on his first shot. It could be just luck, but the process must have been running for years', inj).hit, true);
});

check('负例：HEDGE/INTERROGATIVE 豁免删除 → 对冲与疑问句变命中', () => {
  const inj = { HEDGE_ZH: NEVER, HEDGE_EN: NEVER, INTERROGATIVE: NEVER };
  assert.equal(P2('第一次就成功，可能说明之前失败过很多次', inj).hit, true);
  assert.equal(P2('She won on her first try, so perhaps the dice must have been rolled many times', inj).hit, true);
});

// ─── 6. 常量完备性（防止负例脚本删错名字）──────────────────────
check('__internals 导出全部承重常量', () => {
  for (const k of ['FIRST_ZH', 'OUTCOME_ZH', 'FIRST_EN', 'OUTCOME_EN', 'IMMEDIATE_ZH', 'IMMEDIATE_EN',
    'PROCESS_ZH_TIGHT', 'PROCESS_ZH_LOOSE', 'PROCESS_EN_TIGHT', 'PROCESS_EN_LOOSE',
    'INFER_ZH', 'INFER_EN', 'W_FIRST_OUT_ZH', 'W_FIRST_OUT_EN', 'W_PAIR_ZH', 'W_PAIR_EN',
    'CAUSAL_ZH', 'CAUSAL_EN', 'NEG_BEFORE_ZH', 'NEG_BEFORE_EN', 'NEG_INSIDE_ZH',
    'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECTIVE_ZH', 'CORRECTIVE_EN', 'HEDGE_ZH', 'HEDGE_EN', 'INTERROGATIVE']) {
    assert.ok(I[k] !== undefined, '缺少常量: ' + k);
  }
  assert.ok(Array.isArray(I.PROCESS_ZH_TIGHT) && I.PROCESS_ZH_TIGHT.length >= 4);
  assert.ok(Array.isArray(I.PROCESS_ZH_LOOSE) && I.PROCESS_ZH_LOOSE.length >= 3);
  assert.ok(Array.isArray(I.PROCESS_EN_TIGHT) && I.PROCESS_EN_TIGHT.length >= 8);
  assert.ok(Array.isArray(I.PROCESS_EN_LOOSE) && I.PROCESS_EN_LOOSE.length >= 2);
});

// ─── 7. 引擎闸：良性样本不得以 inverse_gamblers_fallacy 进 findings
check('引擎闸：良性样本不得以 inverse_gamblers_fallacy 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  const BENIGN_HARD = [
    '第一次就成功很可能只是运气好，过程有多长无从推断',
    '一次成功不能反推他之前练了多少次，得看他平时的训练记录',
    '第一次面试就通过，因为他确实准备了很久',
    '他连赢了五把，下一把大概率还是他赢',
    '有个用户吃了就好转了，这药肯定有效',
    'Winning on the first try does not tell us how long the process had been running',
  ];
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('inverse_gamblers_fallacy'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
