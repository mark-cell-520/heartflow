/* test/round-332-winners-curse-digital-bidding.test.js
 * r332 轮测：winners_curse「数字竞价域」新措辞家族
 *   （关键词竞价/广告位/直播坑位/主播签约/域名NFT × 市场认可流量价值/
 *    商业价值/签约费花得值；探针实证 6/6 穿透存量四链）
 * 组别：
 *   A gate 归因（攻击样本 → gate action != pass 且 econ_reasoning_gate 承重）
 *   B 模块直调（detectWinnersCurse hit=true）
 *   C 良性（官方良性语料 378 条 + 本轮新增良性 12 条，模块 hit=false）
 *   D 存量回归（r237/r316 原攻击样本仍命中、概念豁免仍不判）
 *   E 常量级注入（删整组新常量 → 攻击不再命中）
 *   F 元素级注入（逐个删除本轮新增正则元素 → 专属最小样本不再命中）
 *   G 入口双路（gate() / checkOutput() 均非 pass）
 *   H 登记纪律（__internals 导出、头注记 r332、维度计数 255 不变）
 * 用法: node test/round-332-winners-curse-digital-bidding.test.js
 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const WC = require('../src/winners-curse.js');
const I = WC.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
const NEVER = /(?!)/;

// ─── A 族：数字竞价域攻击样本（v6.8.184 基线探针 6/6 穿透 + 语料扩充）──
const WC_ATTACKS = [
  // 探针原始穿透样本（6 条）
  '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。',
  '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。',
  '抢到了这个黄金广告位，可见我们的判断没错，这个位置就值这个钱。',
  '拍到这块牌照说明它确实值这个价，我们的竞价得到了验证。',
  'We won the keyword auction, which confirms this traffic is worth what we bid.',
  'Signing the star streamer for that fee proves the platform accepts her market value.',
  // 语料扩充（腿①/腿②各新形变体）
  '投得首页流量坑位意味着市场认可了我们的出价策略，这个坑位就值这个价。',
  '斩获头部网红后公司证明了它的变现价值，这个达人签得值。',
  '关键词被对手拍走正说明这个词值这个钱，市场很认这个流量价值。',
  '这次广告位拍卖我们赢了，说明市场认可这个流量的商业价值。',
  '高价挖来这个主播说明平台很认他的号召力，这笔签约费没白花。',
  '经过三轮加价，我们最终竞得了这个核心关键词的展示位，可见我们的眼光没错，这个位置物有所值。',
  '砸钱签下这个明星之后，平台用实际行动证明了它的市场价值。',
  '首页广告位拍卖的成交价出炉了，这说明市场认可这个流量的价值。',
  '这次竞拍瞄准了首页坑位，说明市场认可这个位置的价值。',
  'We landed the top influencer after bidding, which shows advertisers recognize her commercial value.',
  'Winning the ad slot auction means the market validated our bid for this placement.',
  'The sponsorship went to the highest bidder, and that proves the traffic is worth it.',
  'Snapping up the creator for that signing fee was money well spent — the platform values her audience.',
  'Winning the NFT auction confirms the collection has real market value.',
];

// ─── 良性样本（模块层必须不判）──
const WC_BENIGN = [
  // 概念讨论（CURSE 豁免）
  '赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。',
  "The winner's curse means winning a common-value auction is evidence we overpaid, not that the asset is worth it.",
  // 否定守卫（本轮补的「并不」族）
  '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。',
  '天价签下主播并不能证明平台认可他的商业价值，溢价要单独核算。',
  'Winning the keyword auction does not prove the market recognizes this traffic value.',
  // 独立估值/纠正语境
  '这个广告位的价值要用点击转化数据独立核算，成交价本身不说明任何问题。',
  '主播签约费是按效果折算的，我们按独立评估的转化数据核的价，没有参考别家出价。',
  '天价签下主播后业绩不及预期，说明竞价胜利不等于价值证明。',
  'We treat the keyword auction result as data, not as evidence of the traffic value.',
  'The signing fee was benchmarked against comparable deals before we committed.',
  // 非竞价事实陈述
  '最后三个广告位以底价成交，没有竞价。',
  'We lost the ad slot auction, which says nothing about the placement worth.',
];

// ─── D 族：存量回归样本（r237 传统竞价域 / r316 抢地族仍须命中）──
const WC_REGRESSION = [
  '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  '我们抢到了新地王，十几家开发商挤破头，说明这块地真的值这个价',
  '牌照竞拍价创了新高，可见市场很认这个价格，值',
  'We outbid everyone, so the painting was clearly undervalued—a real bargain.',
];

// ─── E 族：常量级注入（删整组新常量）──
const CONST_INJECTS = [
  ['WIN_ZH4', '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。'],
  ['WIN_EN4', 'We won the keyword auction, which confirms this traffic is worth what we bid.'],
  ['VALUE_ZH4', '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。'],
  ['VALUE_EN4', 'Signing the star streamer for that fee proves the platform accepts her market value.'],
];

// ─── F 族：元素级注入（逐模式删条 + 存量腿新增词 + 否定守卫新增词）──
function delAt(list, i) { return list.map((r, j) => (j === i ? NEVER : r)); }
const ELEM_INJECTS = [
  // 腿① ZH 五新模式
  ['WIN_ZH4#0 ①-m 竞得动词×数字标的', '抢到了核心关键词说明市场认可这个价值。', () => ({ WIN_ZH4: delAt(I.WIN_ZH4, 0) })],
  ['WIN_ZH4#1 ①-n 被动归属形', '主播被别家签走正说明市场认可他的价值。', () => ({ WIN_ZH4: delAt(I.WIN_ZH4, 1) })],
  ['WIN_ZH4#2 ①-o 竞价语境×数字标的', '这次竞拍瞄准了首页坑位，说明市场认可这个位置的价值。', () => ({ WIN_ZH4: delAt(I.WIN_ZH4, 2) })],
  ['WIN_ZH4#3 ①-p 签约竞价族', '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。', () => ({ WIN_ZH4: delAt(I.WIN_ZH4, 3) })],
  ['WIN_ZH4#4 ①-q 逆序形', '首页广告位拍卖的成交价出炉了，这说明市场认可这个流量的价值。', () => ({ WIN_ZH4: delAt(I.WIN_ZH4, 4) })],
  // 腿① EN 三新模式
  ['WIN_EN4#0 ①-m3 won the X auction', 'We won the premium keyword auction, which confirms this traffic is worth what we bid.', () => ({ WIN_EN4: delAt(I.WIN_EN4, 0) })],
  ['WIN_EN4#1 ①-m4 signed the streamer', 'Signing the star streamer for that fee proves the platform accepts her market value.', () => ({ WIN_EN4: delAt(I.WIN_EN4, 1) })],
  ['WIN_EN4#2 ①-m5 went to highest bidder', 'The sponsorship went to the highest bidder, and that proves the traffic is worth it.', () => ({ WIN_EN4: delAt(I.WIN_EN4, 2) })],
  // 腿② ZH 三新模式
  ['VALUE_ZH4#0 ②-i 推断×认可×价值', '竞拍到关键词说明平台认可这个价值。', () => ({ VALUE_ZH4: delAt(I.VALUE_ZH4, 0) })],
  ['VALUE_ZH4#1 ②-j 标的×值这个价', '抢到了这个黄金广告位，这个位置就值这个钱。', () => ({ VALUE_ZH4: delAt(I.VALUE_ZH4, 1) })],
  ['VALUE_ZH4#2 ②-k 推断×价值名词', '天价签下头部网红后，平台用实际行动证明了它的变现价值。', () => ({ VALUE_ZH4: delAt(I.VALUE_ZH4, 2) })],
  // 腿② EN 五新模式
  ['VALUE_EN4#0 ②-i3 confirms×market×value', 'We won the keyword auction, which confirms advertisers recognize this value.', () => ({ VALUE_EN4: delAt(I.VALUE_EN4, 0) })],
  ['VALUE_EN4#1 ②-i4 X is worth it', 'We won the premium keyword auction, and the keyword we bid on was worth the price we paid.', () => ({ VALUE_EN4: delAt(I.VALUE_EN4, 1) })],
  ['VALUE_EN4#2 ②-i5 signing fee worth it', 'Snapping up the creator for that signing fee was money well spent — the platform values her audience.', () => ({ VALUE_EN4: delAt(I.VALUE_EN4, 2) })],
  ['VALUE_EN4#3 ②-i6 confirms×commercial value', 'Winning the ad slot auction means our commercial value is confirmed.', () => ({ VALUE_EN4: delAt(I.VALUE_EN4, 3) })],
  ['VALUE_EN4#4 ②-i7 market validated bid', 'Winning the ad slot auction indicates the market validated our bid for this placement.', () => ({ VALUE_EN4: delAt(I.VALUE_EN4, 4) })],
  // 存量腿新增词（删除后翻未命中）
  ['WIN_ZH ①-a 补「拍到」', '拍到这块牌照说明它确实值这个价，我们的竞价得到了验证。', () => ({ WIN_ZH: I.WIN_ZH.map((r, j) => (j === 0 ? /(?:中标|竞得|拍得|拍下|夺标|标王)/ : r)) })],
  ['WIN_ZH ①-a 补「拍走」', '最后一件拍品被我们拍走了，说明市场认可这个价格。', () => ({ WIN_ZH: I.WIN_ZH.map((r, j) => (j === 0 ? /(?:中标|竞得|拍得|拍下|拍到|夺标|标王)/ : r)) })],
  ['VALUE_ZH ②-a 补「值这个钱」', '拍到这块牌照说明它确实值这个钱。', () => ({ VALUE_ZH: I.VALUE_ZH.map((r, j) => (j === 0 ? new RegExp(I.VALUE_ZH[0].source.replace('|值这个钱', ''), I.VALUE_ZH[0].flags) : r)) })],
  // 否定守卫新增词（反向：删词后否定句翻命中）
  ['NEG 补「并不」', '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。', () => ({
    NEG_BEFORE: /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)[^。，！？；\n]{0,5}$/,
    NEG_INSIDE: /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)/,
  })],
];

// ═══════════════ 组别 A：gate 归因 ═══════════════
check('A gate 归因：20 条攻击 action!=pass 且 econ_reasoning_gate 承重', () => {
  for (const t of WC_ATTACKS) {
    const r = gateFn(t);
    const ts = r.traceSummary || '';
    assert.ok(r.action !== 'pass', `未拦截: ${t.slice(0, 30)} (action=${r.action})`);
    assert.ok(ts.includes('econ_reasoning_gate'), `归因缺失: ${t.slice(0, 30)} (trace=${ts})`);
  }
});

// ═══════════════ 组别 B：模块直调 ═══════════════
check('B 模块直调：20 条攻击 hit=true', () => {
  for (const t of WC_ATTACKS) {
    const r = WC.detectWinnersCurse(t);
    assert.strictEqual(r.hit, true, `模块未命中: ${t.slice(0, 30)}`);
  }
});

// ═══════════════ 组别 C：良性 ═══════════════
check('C 良性：本轮 12 条良性模块层 hit=false', () => {
  for (const t of WC_BENIGN) {
    assert.strictEqual(WC.detectWinnersCurse(t).hit, false, `良性误伤: ${t.slice(0, 30)}`);
  }
});
check('C 良性：官方四基准语料 378 条模块级 FP=0', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0;
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(__dirname, f)))) {
      n++;
      if (WC.detectWinnersCurse(s).hit) { fp++; console.log(`    FP: ${s.slice(0, 60)}`); }
    }
  }
  assert.strictEqual(n, 378, `语料条数 ${n} != 378`);
  assert.strictEqual(fp, 0, `FP ${fp}`);
});

// ═══════════════ 组别 D：存量回归 ═══════════════
check('D 存量回归：r237/r316 攻击样本仍命中', () => {
  for (const t of WC_REGRESSION) {
    assert.strictEqual(WC.detectWinnersCurse(t).hit, true, `存量回归失败: ${t.slice(0, 30)}`);
  }
});
check('D 存量豁免：概念讨论句仍不判', () => {
  assert.strictEqual(WC.detectWinnersCurse('赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。').hit, false);
  assert.strictEqual(WC.detectWinnersCurse("The winner's curse means winning a common-value auction is evidence we overpaid, not that the asset is worth it.").hit, false);
});

// ═══════════════ 组别 E：常量级注入 ═══════════════
check('E 常量级注入：删整组新常量 → 专属攻击不再命中', () => {
  for (const [constName, text] of CONST_INJECTS) {
    const base = WC.detectWinnersCurse(text).hit;
    const inj = WC.detectWinnersCurse(text, { [constName]: [] }).hit;
    assert.strictEqual(base, true, `${constName} 基线未命中`);
    assert.strictEqual(inj, false, `删 ${constName} 后仍命中（常量非承重）`);
  }
});

// ═══════════════ 组别 F：元素级注入 ═══════════════
check('F 元素级注入：20 个新模式/新增词/守卫词逐条删除必须翻红', () => {
  for (const [name, text, mk] of ELEM_INJECTS) {
    const base = WC.detectWinnersCurse(text).hit;
    const inj = WC.detectWinnersCurse(text, mk()).hit;
    if (name.startsWith('NEG')) {
      assert.strictEqual(base, false, `${name} 基线应不命中（否定句）`);
      assert.strictEqual(inj, true, `${name} 删守卫词后未翻命中`);
    } else {
      assert.strictEqual(base, true, `${name} 基线未命中`);
      assert.strictEqual(inj, false, `${name} 删除后仍命中（元素非承重）`);
    }
  }
});

// ═══════════════ 组别 G：入口双路 ═══════════════
check('G 入口双路：gate() 与 checkOutput() 均非 pass', () => {
  const t = '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。';
  assert.notStrictEqual(gateMod.checkOutput(t).action, 'pass');
  assert.notStrictEqual(gateFn(t).action, 'pass');
});

// ═══════════════ 组别 H：登记纪律 ═══════════════
check('H 登记纪律：__internals 导出新常量', () => {
  assert.ok(Array.isArray(I.WIN_ZH4) && I.WIN_ZH4.length === 5);
  assert.ok(Array.isArray(I.WIN_EN4) && I.WIN_EN4.length === 3);
  assert.ok(Array.isArray(I.VALUE_ZH4) && I.VALUE_ZH4.length === 3);
  assert.ok(Array.isArray(I.VALUE_EN4) && I.VALUE_EN4.length === 5);
  assert.ok(I.NEG_BEFORE && I.NEG_INSIDE);
  assert.ok(I.NEG_BEFORE.source.includes('并不'), 'NEG_BEFORE 缺「并不」');
  assert.ok(I.NEG_INSIDE.source.includes('并不'), 'NEG_INSIDE 缺「并不」');
  assert.ok(I.WIN_ZH[0].source.includes('拍到') && I.WIN_ZH[0].source.includes('拍走'), 'WIN_ZH ①-a 缺 拍到/拍走');
  assert.ok(I.VALUE_ZH[0].source.includes('值这个钱'), 'VALUE_ZH ②-a 缺 值这个钱');
});
check('H 登记纪律：模块头注记含 [r332 数字竞价域新措辞家族]', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'winners-curse.js'), 'utf8');
  assert.ok(src.includes('[r332 数字竞价域新措辞家族]'), '头注记缺 r332 记录');
});
check('H 登记纪律：维度计数 255 不变（本模块不改 dimMap）', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  // econ_reasoning_gate 聚合维度已存在，本家族不走新 dimMap 键
  assert.ok(idx.includes('econ_reasoning_gate'), 'econ_reasoning_gate 接线缺失');
  assert.ok(!idx.includes('winners_curse_digital'), '不应新增 dimMap 键');
});

// ─── 清理（无全局状态改动，仅按轮测纪律显式收尾）──
check('清理：完成', () => { /* 本轮无临时文件/全局状态需要清理 */ });

console.log(`\nr332 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
