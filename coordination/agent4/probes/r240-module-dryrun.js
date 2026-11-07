// r240 模块干跑：攻击/良性/边界/豁免/负例注入全量验证（定稿测试前迭代用）
'use strict';
const path = require('path');
const { detectDispositionEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'disposition-effect.js'));

const ATTACKS_ZH = [
  '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  '赚钱的股票赚一点我就卖，亏钱的反而越跌越拿，实践证明这样心态最稳。',
  '基金浮盈的先赎回保住成果，浮亏的那只继续补仓摊低成本，等下一轮反弹。',
  '散户的通病就是赚钱的票拿不久，赚几个点就跑，亏钱的票反而敢长期捂着等解套。',
  '我这几年炒股的心得是：涨了先落袋，跌了不砍仓，利润跑了太难受，割肉下不去手。',
  '一看翻红了我就想卖，碧绿碧绿的仓位反而舍不得动，总觉得放放就能回本。',
  '房价涨了我赶紧出手套现，跌了的房子捂着等回暖，反正不急用钱。',
];
const ATTACKS_EN = [
  'I cash out winners as soon as they are up a notch, but I ride losers for months because they will bounce back.',
  'He sells winning positions early and holds losing ones for years, calling it prudent risk management.',
  'Take profits quickly but give losing trades time to recover — that is how regret is avoided.',
  'Retail investors are quick to sell a stock once it turns green but hold red positions for years waiting to break even.',
  'Winners get sold too fast and losers get held too long; realizing a gain feels good, realizing a loss feels terrible.',
  'My rule of thumb: bank the gains while they are small, but never realize a loss — wait for it to come back.',
];
const BENIGN_HARD = [
  // 估值/纪律驱动
  '我在买入前就设好止损和止盈线，价格触线机械执行，浮盈浮亏不影响判断。',
  '这只票涨到估值上限了，按计划分批卖出；那只基本面恶化了，按纪律止损。',
  'My exit rules are valuation-based: trim when the price exceeds fair value, cut when the thesis breaks, regardless of paper P&L.',
  // 反向持有
  '虽然浮盈了不少，但基本面没变，我继续持有，没到目标价就不卖。',
  '虽然被套了，但重新分析后认为逻辑破了，我果断止损，换更好的标的。',
  'Even though the position is deeply underwater, the numbers still work, so I keep holding — it is conviction, not denial.',
  // 单边（沉没成本/心理账户领地，无双链）
  '这个项目已经投了两百万，现在停掉前面的钱就全打水飘了，只能硬着头皮做完。',
  '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。',
  'We have already invested two million, so quitting now would waste it all.',
  // 否定纠偏
  '我的股票从不赚钱就卖，也从不亏了死扛，两侧都按同一套纪律来。',
  '股票涨了我也不会急着卖，跌了该止损就止损，不让盈亏状态影响决策。',
  'I never sell a winner just because it is up, and I never keep a loser just because it is down.',
  'The stock rose but I did not bank the gains, and the loss did not stop me from cutting.',
  // 定投/再平衡
  '定投指数基金我从不择时，止盈止损都不看，就按估值百分位再平衡。',
  // 赌博 escalation（无证券锚点，归沉没成本领地）
  '这把牌输了就得加注翻本，下一把肯定能赢回来。',
  // 非金融语境
  '猪肉涨价了，铺子不卖了，改做牛肉生意。',
  '这段感情里，好的时候我患得患失，吵了架又舍不得放手。',
];
const BENIGN_NORMAL = [
  '他买了三年基金，最近一笔赎回是因为要付首付。',
  'The fund reported a loss last quarter and the manager explained the drawdown.',
];
const EXEMPT_CONCEPT = [
  '心理学教材在讲处置效应：散户赚钱的票拿不久，赚几个点就跑，亏钱的捂着等解套——教科书案例。',
  'The textbook defines the disposition effect: retail investors sell winners quickly and hold losers for years — the classic case.',
];
// 负例注入专用见证句（每族删掉后必须不再命中）
const WITNESS = {
  CTX_ZH: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。',
  WIN_STATE_ZH: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。',
  WIN_DISP_ZH: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。',
  LOSE_STATE_ZH: '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。',
  LOSE_DISP_ZH: '股票跌了我就死扛着，涨了反而落袋为安。',
  LOSE_DISP_NEG_ZH: '股票跌了我下不去手割肉，涨了就赶紧落袋为安。',
  CTX_EN: 'I cash out winners as soon as they are up, but I ride losers for months.',
  WIN_STATE_EN: 'I cash out winners as soon as they are up, but I ride losers for months.',
  WIN_DISP_EN: 'I cash out winners as soon as they are up, but I ride losers for months.',
  LOSE_STATE_EN: 'I cash out winners as soon as they are up, but I ride losers for months.',
  LOSE_DISP_EN: 'The stock is down and I just hold the position, while I sell winners quickly.',
  LOSE_DISP_NEG_EN: 'The stock is down and I never realize a loss, while I sell winners quickly.',
};
const OVERDIST = '股票涨了先落袋为安，' + '各'.repeat(200) + '，跌了就捂着等解套。';

let bad = 0;
function expect(cond, msg) { if (!cond) { bad++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

console.log('== 攻击 ZH ==');
for (const t of ATTACKS_ZH) expect(detectDispositionEffect(t).hit === true, t.slice(0, 26) + ' → ' + JSON.stringify(detectDispositionEffect(t).details || '').slice(0, 90));
console.log('== 攻击 EN ==');
for (const t of ATTACKS_EN) expect(detectDispositionEffect(t).hit === true, t.slice(0, 26) + ' → ' + JSON.stringify(detectDispositionEffect(t).details || '').slice(0, 90));
console.log('== 良性（应全部 false）==');
for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
  const r = detectDispositionEffect(t);
  expect(r.hit === false, (r.hit ? '误伤: ' + t + ' → ' + r.details.slice(0, 90) : t.slice(0, 26)));
}
console.log('== 豁免（应 false）==');
for (const t of EXEMPT_CONCEPT) expect(detectDispositionEffect(t).hit === false, t.slice(0, 26));
console.log('== 超距 ==');
expect(detectDispositionEffect(OVERDIST).hit === false, '默认链间窗超距不命中');
expect(detectDispositionEffect(OVERDIST, { CROSS_ZH: 500 }).hit === true, '放大链间窗后命中');
console.log('== 负例注入（逐族删除，见证句必须不再命中）==');
const NEVER = /(?!)/;
for (const k of Object.keys(WITNESS)) {
  const r = detectDispositionEffect(WITNESS[k], { [k]: [] });
  expect(r.hit === false, '删 ' + k + ' 后不再命中');
}
expect(detectDispositionEffect(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit === true, '删 CONCEPT_ZH 后豁免句变红');
expect(detectDispositionEffect(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit === true, '删 CONCEPT_EN 后豁免句变红');

console.log(bad === 0 ? '\n干跑全部通过' : '\n干跑缺陷数: ' + bad);
process.exit(bad === 0 ? 0 : 1);
