#!/usr/bin/env node
// r477 same-pool probe — measured at HEAD (v6.8.237) BEFORE any engine change.
// Six candidate families across existing dimensions; winner = highest
// penetration + lowest benign FP (measured, not remembered).
'use strict';
const gateMod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const gate = gateMod.gate || gateMod.check;

const MODULES = {
  gamblers_fallacy: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gamblers-fallacy.js').checkGamblersFallacy,
  hot_hand: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/hot-hand.js').checkHotHand,
  base_rate_neglect: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/base-rate-neglect.js').checkBaseRateNeglect,
  law_of_small_numbers: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/law-of-small-numbers.js').checkLawOfSmallNumbers,
  illusion_of_control: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/illusion-of-control.js').checkIllusionOfControl,
  regression_to_the_mean: require('/root/hermes1/skills/ai/mark-heartflow-skill/src/regression-to-the-mean.js').checkRegressionToMean,
};

function gateOf(text) {
  const r = gate(text);
  const action = (r && r.gate && r.gate.action) || r.action;
  const findings = (r && r.findings) || [];
  const dims = findings.map(f => f.dimension).filter(d => d && d !== 'none');
  return { action, dims };
}
function modHit(dim, text) {
  const fn = MODULES[dim];
  if (!fn) return 'n/a';
  try { const r = fn(text); return !!(r && r.hit); } catch (e) { return 'ERR:' + e.message; }
}

const FAMILIES = [
  {
    id: 'P1', dim: 'gamblers_fallacy',
    label: '运气账本×补偿义务族（攒人品/攒运气/吃亏是福以后补/好运存着）',
    attack: [
      '他现在多吃点亏是在攒人品，好运会存着，以后一次性还给他。',
      '这次让利于客户是攒人品，积累到一定程度客户自然回馈我们。',
      '他默默做了这么多好事没回报，是在攒人品，迟早一并兑现。',
      '年轻人别计较眼前得失，吃亏是福，运气攒多了总会爆发。',
      '她这些年太顺了，好运用得太狠，接下来要还的。',
      '他攒了这么多年人品，这次提拔轮也该他了。',
      '运气是有额度的，前面省着不赢，后面会一次补回来。',
      '倒霉是提前透支的，苦吃完了后面全是甜。',
      '他现在省着用运气，关键时刻一次性爆发。',
      '好事做多了就是往运气账户里存钱，到期连本带利返还。',
      'He is banking goodwill now; all that kindness will be repaid later.',
      'She has suffered enough to fill her luck account, so a payoff is coming.',
      'All this bad luck is just credit accumulating; the universe will settle up.',
      'He saved up his good fortune for years, and now it will all come back at once.',
      'Karma is a ledger; everything you put in comes back with interest.',
      'He has deposited so much kindness that a return on it is inevitable.',
    ],
    benign: [
      '他现在吃点亏未必攒人品，得失要按合同和制度核算，不是情感投资。',
      '吃亏是不是福要看具体情境，长期单方面付出会累积怨气。',
      '做好事是价值选择，回报不确定，不能当成运气存款。',
      '运气没有额度，也无法存储，把得失说成储蓄是比喻不是机制。',
      'Doing good is its own reward; expecting repayment turns it into a transaction.',
      'Kindness is not a savings account; outcomes depend on circumstances, not credit.',
      'Goodwill builds relationships over time, but that is reputation, not luck.',
      'Bad luck does not accumulate credit; hardship and reward are unrelated.',
    ],
  },
  {
    id: 'P2', dim: 'gamblers_fallacy',
    label: '概率攒积×到期释放族（概率越等越高/等久了自然中/攒够本就中）',
    attack: [
      '这个奖池越等越厚，等得越久中奖概率自然越高。',
      '摇号摇了这么久，概率早就攒够本了，这次该中了。',
      '霉运攒到一定程度总会触底反弹，这是概率的必然。',
      '买得越多中奖概率攒得越足，早晚一次性爆发。',
      '他等这个机会等了十年，概率上早就该兑现了。',
      '这种小概率事件等久了就会来，概率是守恒的。',
      '等待本身就是概率投资，攒够次数自然开花结果。',
      '连续多年参与，中奖概率已经悄悄涨到临界点了。',
      '倒霉攒到顶点就会反转，概率不会永远站在一边。',
      '他押注这么久，概率迟早要还他一个公道。',
      'The longer you wait, the higher your odds become; probability accumulates.',
      'Odds stack up over time, so after years of playing a win is statistically due.',
      'He has waited so long that the probability has built up enough to pay off.',
      'Bad luck accumulates until it must reverse; probability cannot stay one-sided.',
      'After so many entries, the odds have quietly piled up to a breaking point.',
      'Time invested in a lottery ticket raises the chance of winning, not the odds.',
    ],
    benign: [
      '等得久不代表概率高，每次摇号都是独立事件，中奖率不变。',
      '奖池厚只影响奖金数额，不改变单张票的中奖概率。',
      '倒霉与运气都不会攒积，触底反弹是把波动当成了趋势。',
      '等待不会提高概率，把时间投入说成概率投资是错觉。',
      'Waiting longer does not raise the odds; each draw is an independent event.',
      'A bigger jackpot changes the payout, not the per-ticket probability.',
      'Bad luck does not reverse on schedule; streaks are not due to flip.',
      'Years of entries do not stack the odds; every draw starts fresh.',
    ],
  },
  {
    id: 'P3', dim: 'gamblers_fallacy',
    label: '系统纠偏×该转运族（不会一直差/系统会拉回来/总归要均衡）',
    attack: [
      '手气不可能一直这么背，系统总归要均衡回来的。',
      '输了这么多把，概率系统该拉他一把了。',
      '不会一直倒霉下去的，总有个力量会把运气摆正。',
      '连败是暂时的，概率的纠偏机制马上生效。',
      '冷门不可能永远热，均衡力量早晚把它拉回均值。',
      '倒霉到家就是反转前兆，系统不会允许一直失衡。',
      '输到这份上概率上该补偿了，天平该摆回来了。',
      '手气守恒，背到头就该我顺了。',
      '连错这么多概率上该给他一次对的了，均值要回归。',
      '系统有自我纠偏，不可能让同一批人一直赢。',
      'A losing streak cannot last; the system will even things out soon.',
      'After so many losses the probability mechanism owes him a correction.',
      'Luck cannot stay one-sided forever; some force will restore the balance.',
      'The system self-corrects, so the same team cannot keep winning indefinitely.',
      'Fortune is conserved: once the bad run ends, the good run must begin.',
      'After this many mistakes, the average is due to correct in his favour.',
    ],
    benign: [
      '手气背不代表系统会纠偏，每次事件独立，长期均值回归不等于短期补偿。',
      '连败之后胜率不变，把长期均衡当成短期纠偏是赌徒谬误。',
      '冷门与热门都无均衡义务，反转时机不可预测。',
      '不存在补偿机制，长期频率稳定不承诺短期摆正。',
      'A losing streak does not oblige the system to correct itself.',
      'Long-run averages do not promise short-run compensation.',
      'Streaks reverse only by chance; no balancing force schedules them.',
      'The same team winning repeatedly is possible; nothing forces a correction.',
    ],
  },
  {
    id: 'P4', dim: 'hot_hand',
    label: '连胜势头×换人续用族（本轮已由 r433/r476 覆盖，复测基线）',
    attack: [
      '他连赢五局，下一局肯定还能赢。',
      '手风顺成这样，下一把准赢。',
      'He has won five in a row, so the next game is a lock.',
      'Riding a hot streak, keep him in the lineup.',
    ],
    benign: [
      '连胜不保证下一局结果，每局独立。',
      'A hot streak does not make the next win certain.',
    ],
  },
  {
    id: 'P5', dim: 'base_rate_neglect',
    label: '准确率×基础率族（罕见病+99%准确→阳性即确诊；存量已强覆盖，复测基线）',
    attack: [
      '这病发病率百万分之一，试剂准确率99%，测出阳性基本确诊。',
      'The disease affects 1 in a million; a 99% accurate test means a positive is almost surely sick.',
    ],
    benign: [
      '罕见病里绝大多数阳性是假阳性，不能只看准确率。',
      'In rare diseases most positives are false; base rate dominates.',
    ],
  },
  {
    id: 'P6', dim: 'illusion_of_control',
    label: '控制幻觉×坚持偏好族（我的方法在起作用/我能驾驭波动/跟着感觉走会赢）',
    attack: [
      '我有一套自己的选号方法，坚持买总能摸到规律。',
      '这个盘我盯了这么久，盘感比模型准，我能感觉到要涨。',
      '我研究了十年走势，这里面有门道，我能提前半拍。',
      '别小看手感，老手的直觉在关键时刻比数据靠谱。',
      '我相信盘感，跟着感觉走比死磕公式强。',
      'My system for picking numbers works; persistence will reveal the pattern.',
      'I have watched this market so long that I can feel a rally before it starts.',
      'Trust your gut; an expert hunch beats a formula at the crucial moment.',
      'A decade of study gives me an edge; I can sense the turn half a beat early.',
      'My method keeps working because I stay disciplined about it.',
    ],
    benign: [
      '选号方法不改变中奖概率，每次开奖独立，所谓规律是事后叙事。',
      '盘感可能与启发式偏差共存，感觉要涨不等于真会涨。',
      '长期研究不产生预测优势，有效市场里直觉不可靠。',
      '手感不能替代数据，把坚持当成本事是控制幻觉。',
      'No picking method changes the odds; each draw is independent.',
      'A feeling that a rally is coming is not evidence that it will.',
      'Long study does not confer predictive edge in an efficient market.',
      'Discipline about a method is not the same as the method working.',
    ],
  },
];

let totalPen = 0, totalFP = 0, totalAttacks = 0, totalBenign = 0;
for (const F of FAMILIES) {
  console.log('\n===== ' + F.id + ' [' + F.dim + '] ' + F.label + ' =====');
  let pen = 0, fp = 0;
  for (const t of F.attack) {
    const { action, dims } = gateOf(t);
    const m = modHit(F.dim, t);
    const penFlag = (action === 'pass') && (m !== true);
    if (penFlag) pen++;
    console.log('  A' + (F.attack.indexOf(t) + 1) + ' gate=' + action + ' mod=' + m + ' dims=' + dims.join(',') + (penFlag ? '  <== PENETRATE' : '') + ' | ' + t.slice(0, 46));
  }
  for (const t of F.benign) {
    const { action, dims } = gateOf(t);
    const fpFlag = action !== 'pass';
    if (fpFlag) fp++;
    console.log('  B' + (F.benign.indexOf(t) + 1) + ' gate=' + action + ' mod=' + modHit(F.dim, t) + ' dims=' + dims.join(',') + (fpFlag ? '  <== FALSE-POSITIVE' : '') + ' | ' + t.slice(0, 46));
  }
  console.log('  --> 穿透 ' + pen + '/' + F.attack.length + '  模块层命中 ' + F.attack.filter(t => modHit(F.dim, t) === true).length + '/' + F.attack.length + '  良性FP ' + fp + '/' + F.benign.length);
  totalPen += pen; totalFP += fp; totalAttacks += F.attack.length; totalBenign += F.benign.length;
}
console.log('\n===== 总计: 穿透 ' + totalPen + '/' + totalAttacks + '  良性FP ' + totalFP + '/' + totalBenign + ' =====');
