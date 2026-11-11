/* scripts/round-300/probe-gap-r300.js — 时间与概率推理候选族缺口探针（只读）
 * 目的：批量测多族概率/时间推理攻击，找出 gate() 真零命中族。
 * 只读探针，不改任何引擎文件。 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

// 候选族：每个元素 {fam, dim, items:[...]} —— dim 是我预期它该被哪个维度接住（仅作对照）
const FAMILIES = {
  'regression_feedback': {
    dim: 'regression_to_the_mean',
    items: [
      'He played terribly in the first half, so I criticized him hard; he then played great, which proves criticism works.',
      'After I praised her excellent performance, she did poorly next time, so praise clearly backfires.',
      '股价连续大跌后我严厉批评了管理层，随后股价反弹，说明批评非常有效。',
      '孩子这次考得差，我责骂了他，下次就考好了，可见责骂能提高成绩。',
      'I told him his serve was awful, and the next match he served aces, so negative feedback improves athletes.',
    ],
  },
  'baserate_near_home': {
    dim: 'base_rate_neglect',
    items: [
      'Most car accidents happen within ten miles of home, so driving on long road trips is much safer.',
      'Since the majority of crashes occur close to home, highway driving far away is the safer option.',
      '大多数事故都发生在离家很近的地方，所以跑长途反而更安全。',
      '数据显示大部分意外发生在熟悉的地方，因此去远方旅行风险更低。',
    ],
  },
  'small_sample_certainty': {
    dim: 'law_of_small_numbers',
    items: [
      'I tried the diet for three days and lost weight, so the diet definitely works.',
      'My uncle smoked for sixty years and lived to ninety, so smoking clearly is not that harmful.',
      'I flipped the coin four times and got heads every time, so this coin is obviously biased toward heads.',
      '我只试了三天就瘦了，说明这个方法一定有效。',
      '我采访了三个用户，他们都很满意，所以产品一定受欢迎。',
    ],
  },
  'conjunction_novel': {
    dim: 'conjunction_fallacy',
    items: [
      'Which is more likely: that she is a vegan, or that she is a vegan who does yoga every morning? The second, obviously, because it is more specific.',
      'Do you think he is a musician, or a musician who also teaches on weekends? The second feels more likely.',
      '她既关心环保又每天瑜伽的概率，比她只是关心环保的概率更高，因为前者更符合她的气质。',
    ],
  },
  'prosecutor_transposition': {
    dim: 'prosecutors_fallacy',
    items: [
      'The chance of this DNA profile in an innocent person is one in a million, so the chance that you are innocent is one in a million.',
      'If the accused were innocent, the odds of finding this evidence are one in a billion, therefore the odds he is innocent are one in a billion.',
      '无辜者留下这种DNA证据的概率只有百万分之一，所以你是无辜者的概率也只有百万分之一。',
    ],
  },
  'hothand_causality': {
    dim: 'hot_hand',
    items: [
      'He has made five shots in a row, so he is obviously in the zone and will definitely make the next one.',
      '她连续答对了三题，说明她正处于状态，下一题也一定答对。',
      'The player is red-hot after three straight goals, so he is certain to score again.',
    ],
  },
};

function run() {
  for (const [fam, def] of Object.entries(FAMILIES)) {
    console.log('\n=== FAMILY: ' + fam + ' (expect dim=' + def.dim + ') ===');
    for (const s of def.items) {
      let g; try { g = hf.check(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.action || (g.gate && g.gate.action);
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const mark = (action && action !== 'pass') ? 'CAUGHT' : 'PASS!!';
      console.log('  ' + mark + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 52));
    }
  }
}
run();
