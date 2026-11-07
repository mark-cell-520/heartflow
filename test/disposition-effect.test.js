/**
 * test/disposition-effect.test.js — r240 处置效应维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 17 条疑难 FP 压力样本）、
 * 概念讨论豁免族（嵌入真实签名 + 豁免标记，可负例注入证明承重）、
 * 边界锁（既有维度领地/单边/否定前缀/非金融语境/超距）、
 * 中英混排多签名、负例注入（双腿链族逐族删除/豁免删除/链间窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r239 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectDispositionEffect } = require('../src/disposition-effect.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：盈利链×亏损链双腿共现）──────────────────
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

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN_HARD = [
  // 估值/纪律驱动：处置依据是估值与规则，不是盈亏状态
  '我在买入前就设好止损和止盈线，价格触线机械执行，浮盈浮亏不影响判断。',
  '这只票涨到估值上限了，按计划分批卖出；那只基本面恶化了，按纪律止损。',
  'My exit rules are valuation-based: trim when the price exceeds fair value, cut when the thesis breaks, regardless of paper P&L.',
  // 反向持有：盈利侧不退出/亏损侧不拖延，缺对应链
  '虽然浮盈了不少，但基本面没变，我继续持有，没到目标价就不卖。',
  '虽然被套了，但重新分析后认为逻辑破了，我果断止损，换更好的标的。',
  'Even though the position is deeply underwater, the numbers still work, so I keep holding — it is conviction, not denial.',
  // 单边行为：沉没成本/心理账户领地，无双腿链
  '这个项目已经投了两百万，现在停掉前面的钱就全打水飘了，只能硬着头皮做完。',
  '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。',
  'We have already invested two million, so quitting now would waste it all.',
  // 否定纠偏：两侧同一套纪律
  '我的股票从不赚钱就卖，也从不亏了死扛，两侧都按同一套纪律来。',
  '股票涨了我也不会急着卖，跌了该止损就止损，不让盈亏状态影响决策。',
  'I never sell a winner just because it is up, and I never keep a loser just because it is down.',
  'The stock rose but I did not bank the gains, and the loss did not stop me from cutting.',
  // 定投/再平衡
  '定投指数基金我从不择时，止盈止损都不看，就按估值百分位再平衡。',
  // 赌博 escalation：无证券领域锚点，归沉没成本领地
  '这把牌输了就得加注翻本，下一把肯定能赢回来。',
  // 非金融语境：领域锚点缺失
  '猪肉涨价了，铺子不卖了，改做牛肉生意。',
  '这段感情里，好的时候我患得患失，吵了架又舍不得放手。',
];
const BENIGN_NORMAL = [
  '他买了三年基金，最近一笔赎回是因为要付首付。',
  'The fund reported a loss last quarter and the manager explained the drawdown.',
];

// ─── 豁免族：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲处置效应：散户赚钱的票拿不久，赚几个点就跑，亏钱的捂着等解套——教科书案例。',
  'The textbook defines the disposition effect: retail investors sell winners quickly and hold losers for years — the classic case.',
];

// ─── 边界锁（既有维度领地/单边/否定前缀/非金融语境/超距，不得命中）──
const BOUNDARY = [
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水飘了，只能硬着头皮做完。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['赌博escalation领地', '这把牌输了就得加注翻本，下一把肯定能赢回来。'],
  ['单边-只亏不卖', '这只基金套了三年，我就放在那儿没管，当忘了这笔钱。'],
  ['单边-只盈不卖', '股票涨了五成我都没卖，看好长期基本面，仓位继续拿着。'],
  ['否定前缀-双侧', '我的股票从不赚钱就卖，也从不亏了死扛，两侧都按同一套纪律来。'],
  ['否定前缀-EN双侧', 'I never sell a winner just because it is up, and I never keep a loser just because it is down.'],
  ['非金融语境', '猪肉涨价了，铺子不卖了，改做牛肉生意。'],
  ['非金融语境-感情', '这段感情里，好的时候我患得患失，吵了架又舍不得放手。'],
];
// 双腿链超距（默认链间窗 ZH150 不命中）
const OVERDIST = '股票涨了先落袋为安，' + '各'.repeat(200) + '，跌了就捂着等解套。';

const MIXED = '赚钱的股票赚一点我就卖，亏钱的越跌越拿；I cash out winners as soon as they are up, but I ride losers for months.';
const MULTI_ZH = '散户赚钱的票拿不久，赚几个点就跑，亏钱的捂着等解套；我自己的仓位也是涨了先落袋，跌了死扛等回本。';

console.log('disposition-effect（r240 处置效应）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectDispositionEffect, 'function');
  assert.equal(detectDispositionEffect('').hit, false);
  assert.equal(detectDispositionEffect(null).hit, false);
  assert.equal(detectDispositionEffect('短').hit, false);
});

check('攻击命中：中文 7 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectDispositionEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'disposition_effect');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 6 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectDispositionEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：19 条（含 17 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectDispositionEffect(t).hit, false, '误伤: ' + t);
  for (const t of BENIGN_NORMAL) assert.equal(detectDispositionEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) {
    assert.equal(detectDispositionEffect(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/单边/否定前缀/非金融语境/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectDispositionEffect(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectDispositionEffect(OVERDIST).hit, false, '默认链间窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectDispositionEffect(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿链在窗内可组合出多签名，r238 同型固有组合）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectDispositionEffect(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文双腿链族删除后攻击全部不再命中', () => {
  assert.equal(detectDispositionEffect(ATTACKS_ZH[0], { CTX_ZH: [] }).hit, false, '删领域锚点ZH');
  assert.equal(detectDispositionEffect(ATTACKS_ZH[0], { WIN_STATE_ZH: [] }).hit, false, '删盈利状态ZH');
  assert.equal(detectDispositionEffect(ATTACKS_ZH[0], { WIN_DISP_ZH: [] }).hit, false, '删盈利处置ZH');
  assert.equal(detectDispositionEffect(ATTACKS_ZH[0], { LOSE_STATE_ZH: [] }).hit, false, '删亏损状态ZH');
  assert.equal(detectDispositionEffect(ATTACKS_ZH[0], { LOSE_DISP_ZH: [] }).hit, false, '删亏损处置ZH');
  assert.equal(detectDispositionEffect('股票跌了我下不去手割肉，涨了就赶紧落袋为安。', { LOSE_DISP_NEG_ZH: [] }).hit, false, '删否定式退出ZH');
});

check('负例注入：英文双腿链族删除后攻击全部不再命中', () => {
  assert.equal(detectDispositionEffect(ATTACKS_EN[0], { CTX_EN: [] }).hit, false, '删领域锚点EN');
  assert.equal(detectDispositionEffect(ATTACKS_EN[0], { WIN_STATE_EN: [] }).hit, false, '删盈利状态EN');
  assert.equal(detectDispositionEffect(ATTACKS_EN[0], { WIN_DISP_EN: [] }).hit, false, '删盈利处置EN');
  assert.equal(detectDispositionEffect(ATTACKS_EN[0], { LOSE_STATE_EN: [] }).hit, false, '删亏损状态EN');
  assert.equal(detectDispositionEffect(ATTACKS_EN[0], { LOSE_DISP_EN: [] }).hit, false, '删亏损处置EN');
  assert.equal(detectDispositionEffect(ATTACKS_EN[5], { LOSE_DISP_NEG_EN: [] }).hit, false, '删否定式退出EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectDispositionEffect(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectDispositionEffect(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：链间距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectDispositionEffect(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectDispositionEffect(OVERDIST, { CROSS_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 disposition_effect 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('disposition_effect'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
