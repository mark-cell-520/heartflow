#!/usr/bin/env node
// r477 TDD — 新措辞族「运气守恒×到期结算」（gamblers_fallacy 第 148 维扩族）
// 族定义：把「守恒/攒积断言」与「到期结算断言」配成双腿 AND——
//   腿① CONSERVE_ZH/CONSERVE_EN 守恒/攒积/透支/额度/账户/系统纠偏
//   腿② SETTLE_ZH/SETTLE_EN   补偿/兑现/返还/还债/该转运/爆发/均值回归
// 先红：未实现前本文件全部 fail；实现后全绿。
'use strict';
const assert = require('node:assert');
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkGamblersFallacy } = require(path.join(HF, 'src/gamblers-fallacy.js'));
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js'));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL: ' + name + ' — ' + e.message); }
}

// ─── 攻击样本：同族变体（ZH/EN × 攒积分三形态）────────────────────
const ATTACK_ZH = [
  // 账本/攒人品形
  '她现在多干活少拿钱是在攒人品，领导早晚看得见回报。',
  '他吃亏吃到这个份上，老天迟早要补偿他。',
  '她处处忍让是在积攒人品，攒够了自然有人帮。',
  '他现在多吃点亏是在攒人品，好运会存着，以后一次性还给他。',
  '年轻人别计较眼前得失，吃亏是福，运气攒多了总会爆发。',
  '运气是有额度的，前面省着不赢，后面会一次补回来。',
  '倒霉是提前透支的，苦吃完了后面全是甜。',
  '好事做多了就是往运气账户里存钱，到期连本带利返还。',
  '多拜神是在攒功德，功德够了菩萨自然保佑。',
  '好运是有总额度的，年轻时省着用，中年一次爆发。',
  '她这些年太顺了，好运用得太狠，接下来要还的。',
  '他前半生太顺，等于提前透支了好运，现在该还债了。',
  // 概率攒积形
  '这个奖池越等越厚，等得越久中奖概率自然越高。',
  '摇号摇了这么久，概率早就攒够本了，这次该中了。',
  '买得越多中奖概率攒得越足，早晚一次性爆发。',
  '他等这个机会等了十年，概率上早就该兑现了。',
  '这种小概率事件等久了就会来，概率是守恒的。',
  '连续多年参与，中奖概率已经悄悄涨到临界点了。',
  '倒霉攒到顶点就会反转，概率不会永远站在一边。',
  '倒霉攒得够多了，下一轮该轮到好运了。',
  '等待本身就是概率投资，攒够次数自然开花结果。',
  '彩票买得越勤，中奖概率攒得越厚，迟早兑现。',
  '概率是有额度的，亏了十年该回本了。',
  '霉运不会永远跟着他，攒到头就该转运了。',
  // 系统纠偏形
  '输了这么多把，概率系统该拉他一把了。',
  '不会一直倒霉下去的，总有个力量会把运气摆正。',
  '连败是暂时的，概率的纠偏机制马上生效。',
  '冷门不可能永远热，均衡力量早晚把它拉回均值。',
  '倒霉到家就是反转前兆，系统不会允许一直失衡。',
  '输到这份上概率上该补偿了，天平该摆回来了。',
  '连错这么多概率上该给他一次对的了，均值要回归。',
  '系统有自我纠偏，不可能让同一批人一直赢。',
  '输这么多把系统不可能让他一直输，该赢了。',
  '连败到这份上，系统的均衡机制该启动补偿了。',
  '手气不会一直背，概率系统早晚要摆正天平。',
  '倒霉这么久，系统的自我纠偏该发挥作用了。',
];
const ATTACK_EN = [
  'He is banking goodwill now; all that kindness will be repaid later.',
  'She has suffered enough to fill her luck account, so a payoff is coming.',
  'He saved up his good fortune for years, and now it will all come back at once.',
  'Karma is a ledger; everything you put in comes back with interest.',
  'He has deposited so much kindness that a return on it is inevitable.',
  'The longer you wait, the higher your odds become; probability accumulates.',
  'Odds stack up over time, so after years of playing a win is statistically due.',
  'He has waited so long that the probability has built up enough to pay off.',
  'Bad luck accumulates until it must reverse; probability cannot stay one-sided.',
  'Time invested in a lottery ticket raises the chance of winning, not the odds.',
  'A losing streak cannot last; the system will even things out soon.',
  'After so many losses the probability mechanism owes him a correction.',
  'Luck cannot stay one-sided forever; some force will restore the balance.',
  'The system self-corrects, so the same team cannot keep winning indefinitely.',
  'Fortune is conserved: once the bad run ends, the good run must begin.',
  'After this many mistakes, the average is due to correct in his favour.',
];
// 良性样本（必须含该族边缘良性：正确破除陈述）
const BENIGN = [
  '他现在吃点亏未必攒人品，得失要按合同和制度核算，不是情感投资。',
  '吃亏是不是福要看具体情境，长期单方面付出会累积怨气。',
  '做好事是价值选择，回报不确定，不能当成运气存款。',
  '运气没有额度，也无法存储，把得失说成储蓄是比喻不是机制。',
  '等得久不代表概率高，每次摇号都是独立事件，中奖率不变。',
  '奖池厚只影响奖金数额，不改变单张票的中奖概率。',
  '倒霉与运气都不会攒积，触底反弹是把波动当成了趋势。',
  '等待不会提高概率，把时间投入说成概率投资是错觉。',
  '手气背不代表系统会纠偏，每次事件独立，长期均值回归不等于短期补偿。',
  '连败之后胜率不变，把长期均衡当成短期纠偏是赌徒谬误。',
  '冷门与热门都无均衡义务，反转时机不可预测。',
  '不存在补偿机制，长期频率稳定不承诺短期摆正。',
  '多干活是职业素养，报酬应按合同而不是按人品积累结算。',
  '拜神是文化习俗，与功德兑现之间没有可计算的因果关系。',
  '顺境与逆境由多种因素决定，不存在提前透支好运的机制。',
  '等待时间与中奖概率无关，把等待说成投资是比喻不是机制。',
  '连败次数不影响下一局胜率，概率系统没有补偿功能。',
  '运气守恒的说法没有实证支持，不能用于预测下一次结果。',
  '合同履约靠条款，不是靠人情账户的存取平衡。',
  '项目预算按支出口径核算，跟人品积累没有关系。',
  'Doing good is its own reward; expecting repayment turns it into a transaction.',
  'Kindness is not a savings account; outcomes depend on circumstances, not credit.',
  'Goodwill builds relationships over time, but that is reputation, not luck.',
  'Bad luck does not accumulate credit; hardship and reward are unrelated.',
  'Waiting longer does not raise the odds; each draw is an independent event.',
  'A bigger jackpot changes the payout, not the per-ticket probability.',
  'Bad luck does not reverse on schedule; streaks are not due to flip.',
  'Years of entries do not stack the odds; every draw starts fresh.',
  'A losing streak does not oblige the system to correct itself.',
  'Long-run averages do not promise short-run compensation.',
  'Streaks reverse only by chance; no balancing force schedules them.',
  'The same team winning repeatedly is possible; nothing forces a correction.',
];

// ─── 1) 腿常量暴露（负例脚本注入用）────────────────────────────────
const I = require(path.join(HF, 'src/gamblers-fallacy.js')).__internals();
t('CONSERVE_ZH 暴露为 RegExp', () => {
  assert.ok(I.CONSERVE_ZH instanceof RegExp);
});
t('CONSERVE_EN 暴露为 RegExp', () => {
  assert.ok(I.CONSERVE_EN instanceof RegExp);
});
t('SETTLE_ZH 暴露为 RegExp', () => {
  assert.ok(I.SETTLE_ZH instanceof RegExp);
});
t('SETTLE_EN 暴露为 RegExp', () => {
  assert.ok(I.SETTLE_EN instanceof RegExp);
});
t('CONSERVE_ZH 单腿即命中「攒人品」', () => {
  assert.ok(I.CONSERVE_ZH.test('他是在攒人品'));
});
t('SETTLE_ZH 单腿即命中「补偿」', () => {
  assert.ok(I.SETTLE_ZH.test('老天迟早要补偿他'));
});

// ─── 2) 攻击样本全命中 ─────────────────────────────────────────────
ATTACK_ZH.forEach((s, i) => {
  t('ZH-ATK-' + (i + 1) + ' 命中', () => {
    const r = checkGamblersFallacy(s);
    assert.strictEqual(r.hit, true, '应命中: ' + s);
  });
});
ATTACK_EN.forEach((s, i) => {
  t('EN-ATK-' + (i + 1) + ' 命中', () => {
    const r = checkGamblersFallacy(s);
    assert.strictEqual(r.hit, true, '应命中: ' + s);
  });
});

// ─── 3) 良性样本全不命中 ───────────────────────────────────────────
BENIGN.forEach((s, i) => {
  t('BEN-' + (i + 1) + ' 不命中', () => {
    const r = checkGamblersFallacy(s);
    assert.strictEqual(r.hit, false, '不应命中: ' + s);
  });
});

// ─── 4) 消融：删任一条腿后命中数下降（腿独立承重）────────────────
t('ABLATE-1: 删腿①后中文命中数下降', () => {
  const blank = /(?!)/;
  const withBoth = ATTACK_ZH.filter(s => checkGamblersFallacy(s).hit).length;
  const withoutLeg1 = ATTACK_ZH.filter(s => checkGamblersFallacy(s, { CONSERVE_ZH: blank }).hit).length;
  assert.ok(withoutLeg1 < withBoth, '删腿①应下降: ' + withBoth + ' -> ' + withoutLeg1);
});
t('ABLATE-2: 删腿②后中文命中数下降', () => {
  const blank = /(?!)/;
  const withBoth = ATTACK_ZH.filter(s => checkGamblersFallacy(s).hit).length;
  const withoutLeg2 = ATTACK_ZH.filter(s => checkGamblersFallacy(s, { SETTLE_ZH: blank }).hit).length;
  assert.ok(withoutLeg2 < withBoth, '删腿②应下降: ' + withBoth + ' -> ' + withoutLeg2);
});
t('ABLATE-3: 删腿①后英文命中数下降', () => {
  const blank = /(?!)/;
  const withBoth = ATTACK_EN.filter(s => checkGamblersFallacy(s).hit).length;
  const withoutLeg1 = ATTACK_EN.filter(s => checkGamblersFallacy(s, { CONSERVE_EN: blank }).hit).length;
  assert.ok(withoutLeg1 < withBoth, '删腿①应下降: ' + withBoth + ' -> ' + withoutLeg1);
});
t('ABLATE-4: 删腿②后英文命中数下降', () => {
  const blank = /(?!)/;
  const withBoth = ATTACK_EN.filter(s => checkGamblersFallacy(s).hit).length;
  const withoutLeg2 = ATTACK_EN.filter(s => checkGamblersFallacy(s, { SETTLE_EN: blank }).hit).length;
  assert.ok(withoutLeg2 < withBoth, '删腿②应下降: ' + withBoth + ' -> ' + withoutLeg2);
});
t('ABLATE-5: 删腿①后良性不命中数不下降（无误伤回潮）', () => {
  const blank = /(?!)/;
  const withBoth = BENIGN.filter(s => !checkGamblersFallacy(s).hit).length;
  const withoutLeg1 = BENIGN.filter(s => !checkGamblersFallacy(s, { CONSERVE_ZH: blank }).hit).length;
  assert.ok(withoutLeg1 >= withBoth - 2, '删腿①良性不应大幅回潮');
});

// ─── 5) 既有豁免仍生效（不因新族破坏）────────────────────────────
t('EXEMPT-1: 元话语概念引述仍豁免', () => {
  const r = checkGamblersFallacy('赌徒谬误是把守恒当成补偿义务的典型');
  assert.strictEqual(r.hit, false);
});
t('EXEMPT-2: 正确概率陈述在场仍豁免', () => {
  const r = checkGamblersFallacy('他攒人品是想图回报，但每次事件都是独立事件，回报与概率无关');
  assert.strictEqual(r.hit, false);
});

// ─── 6) 边界：单腿不判 ─────────────────────────────────────────────
t('BOUNDARY-1: 只有腿①（无结算断言）不判', () => {
  const r = checkGamblersFallacy('他天天做好事，说是在攒人品');
  assert.strictEqual(r.hit, false, '单腿不应命中');
});
t('BOUNDARY-2: 只有腿②（无守恒断言）不判', () => {
  const r = checkGamblersFallacy('这个项目迟早会爆发增长');
  assert.strictEqual(r.hit, false, '单腿不应命中');
});
t('BOUNDARY-3: 否定破除语境不判', () => {
  const r = checkGamblersFallacy('他自以为在攒人品，其实不存在人品守恒这回事');
  assert.strictEqual(r.hit, false, '否定破除应豁免');
});
t('BOUNDARY-4: 值班分派义不判', () => {
  const r = checkGamblersFallacy('这周轮到小李值班，下周轮到小王');
  assert.strictEqual(r.hit, false);
});
t('BOUNDARY-5: 短文本不判', () => {
  const r = checkGamblersFallacy('攒人品');
  assert.strictEqual(r.hit, false);
});

// ─── 7) gate 层 ───────────────────────────────────────────────────
t('GATE-1: 新族攻击在 gate 层非 pass', () => {
  const r = gate.checkOutput('他现在多吃点亏是在攒人品，好运会存着，以后一次性还给他。');
  const findings = r.findings || [];
  const g = findings.find(f => f.dimension === 'gamblers_fallacy');
  assert.ok(g, 'gate findings 应有 gamblers_fallacy');
});
t('GATE-2: 良性样本在 gate 层 pass', () => {
  const r = gate.checkOutput('等得久不代表概率高，每次摇号都是独立事件，中奖率不变。');
  const findings = r.findings || [];
  const g = findings.find(f => f.dimension === 'gamblers_fallacy');
  assert.ok(!g, '良性不应触发 gamblers_fallacy');
});
t('GATE-3: dimensions 键仍含 gamblers_fallacy', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('gamblers_fallacy'));
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
