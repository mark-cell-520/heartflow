#!/usr/bin/env node
// r477 三族双腿诊断：逐条判定存量腿正则为何不命中，用于确定新腿设计。
// 新腿候选：
//   A. LEDGER_ZH/EN —— 运气账本（攒人品/存运气/运气账户/透支/额度/守恒/还）
//   B. ACCUM_ZH/EN  —— 概率攒积（等得越久概率越高/攒够/越买越多/临界点/守恒）
//   C. CORRECT_ZH/EN—— 系统纠偏（系统纠偏/均衡回来/摆正/拉回来/自我纠偏/compensate）
'use strict';
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gamblers-fallacy.js');
const I = mod.__internals();

const FAMS = [
  { id: 'P1-账本', att: [
    '他现在多吃点亏是在攒人品，好运会存着，以后一次性还给他。',
    '他默默做了这么多好事没回报，是在攒人品，迟早一并兑现。',
    '运气是有额度的，前面省着不赢，后面会一次补回来。',
    '倒霉是提前透支的，苦吃完了后面全是甜。',
    '好事做多了就是往运气账户里存钱，到期连本带利返还。',
    'He is banking goodwill now; all that kindness will be repaid later.',
    'She has suffered enough to fill her luck account, so a payoff is coming.',
    'He saved up his good fortune for years, and now it will all come back at once.',
    'Karma is a ledger; everything you put in comes back with interest.',
    'He has deposited so much kindness that a return on it is inevitable.',
  ], ben: [
    '他现在吃点亏未必攒人品，得失要按合同和制度核算，不是情感投资。',
    '做好事是价值选择，回报不确定，不能当成运气存款。',
    '运气没有额度，也无法存储，把得失说成储蓄是比喻不是机制。',
    'Doing good is its own reward; expecting repayment turns it into a transaction.',
    'Kindness is not a savings account; outcomes depend on circumstances, not credit.',
    'Bad luck does not accumulate credit; hardship and reward are unrelated.',
  ] },
  { id: 'P2-攒积', att: [
    '这个奖池越等越厚，等得越久中奖概率自然越高。',
    '摇号摇了这么久，概率早就攒够本了，这次该中了。',
    '买得越多中奖概率攒得越足，早晚一次性爆发。',
    '他等这个机会等了十年，概率上早就该兑现了。',
    '这种小概率事件等久了就会来，概率是守恒的。',
    '连续多年参与，中奖概率已经悄悄涨到临界点了。',
    '倒霉攒到顶点就会反转，概率不会永远站在一边。',
    'The longer you wait, the higher your odds become; probability accumulates.',
    'Odds stack up over time, so after years of playing a win is statistically due.',
    'He has waited so long that the probability has built up enough to pay off.',
    'Bad luck accumulates until it must reverse; probability cannot stay one-sided.',
    'Time invested in a lottery ticket raises the chance of winning, not the odds.',
  ], ben: [
    '等得久不代表概率高，每次摇号都是独立事件，中奖率不变。',
    '奖池厚只影响奖金数额，不改变单张票的中奖概率。',
    '倒霉与运气都不会攒积，触底反弹是把波动当成了趋势。',
    'Waiting longer does not raise the odds; each draw is an independent event.',
    'A bigger jackpot changes the payout, not the per-ticket probability.',
    'Bad luck does not reverse on schedule; streaks are not due to flip.',
    'Years of entries do not stack the odds; every draw starts fresh.',
  ] },
  { id: 'P3-纠偏', att: [
    '输了这么多把，概率系统该拉他一把了。',
    '不会一直倒霉下去的，总有个力量会把运气摆正。',
    '连败是暂时的，概率的纠偏机制马上生效。',
    '冷门不可能永远热，均衡力量早晚把它拉回均值。',
    '倒霉到家就是反转前兆，系统不会允许一直失衡。',
    '输到这份上概率上该补偿了，天平该摆回来了。',
    '连错这么多概率上该给他一次对的了，均值要回归。',
    '系统有自我纠偏，不可能让同一批人一直赢。',
    'A losing streak cannot last; the system will even things out soon.',
    'After so many losses the probability mechanism owes him a correction.',
    'Luck cannot stay one-sided forever; some force will restore the balance.',
    'The system self-corrects, so the same team cannot keep winning indefinitely.',
    'Fortune is conserved: once the bad run ends, the good run must begin.',
    'After this many mistakes, the average is due to correct in his favour.',
  ], ben: [
    '手气背不代表系统会纠偏，每次事件独立，长期均值回归不等于短期补偿。',
    '连败之后胜率不变，把长期均衡当成短期纠偏是赌徒谬误。',
    '冷门与热门都无均衡义务，反转时机不可预测。',
    '不存在补偿机制，长期频率稳定不承诺短期摆正。',
    'A losing streak does not oblige the system to correct itself.',
    'Long-run averages do not promise short-run compensation.',
    'Streaks reverse only by chance; no balancing force schedules them.',
    'The same team winning repeatedly is possible; nothing forces a correction.',
  ] },
];

const KEYS = ['STREAK_ZH','STREAK_DAILY_ZH','STREAK_COUNT_ZH','DUE_ZH','DUE_DAILY_ZH','TURN_ZH','LLN_ZH','STREAK_EN','STREAK_COUNT_EN','DUE_EN','TURN_EN','LLN_EN','CHASE_ZH','CHASE_EN'];
for (const F of FAMS) {
  console.log('\n===== ' + F.id + ' =====');
  for (const t of F.att) {
    const hits = KEYS.filter(k => { try { return I[k].test(t); } catch (e) { return 'ERR'; } });
    const r = mod.checkGamblersFallacy(t);
    console.log((r.hit ? 'HIT ' : 'miss') + ' ' + (hits.join(',') || '-') + ' | ' + t.slice(0, 44));
  }
  console.log('  --- benign ---');
  for (const t of F.ben) {
    const hits = KEYS.filter(k => { try { return I[k].test(t); } catch (e) { return 'ERR'; } });
    const r = mod.checkGamblersFallacy(t);
    console.log((r.hit ? 'HIT ' : 'pass') + ' ' + (hits.join(',') || '-') + ' | ' + t.slice(0, 44));
  }
}
