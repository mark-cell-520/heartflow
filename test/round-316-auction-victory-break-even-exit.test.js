/* test/round-316-auction-victory-break-even-exit.test.js
 * r316 轮测：winners_curse「抢地/牌照/打新/评标/创纪录竞价 × 市场认价/值钱/有潜力」新措辞家族
 *          + disposition_effect「回本即退/翻红就抛/亏损死扛 slang」新措辞家族
 * 组别：
 *   A gate 归因（攻击样本 → gate action != pass 且 econ_reasoning_gate 承重）
 *   B 模块直调（detectWinnersCurse / detectDispositionEffect hit=true）
 *   C 良性（官方良性语料 369 条去重 + 本轮新增良性 12 条，两模块 hit=false）
 *   D 存量回归（r237/r240 原攻击样本仍命中）
 *   E 常量级注入（删整组新常量 → 攻击不再命中）
 *   F 元素级注入（逐个删除本轮新增正则元素 → 专属最小样本不再命中）
 *   G 入口双路（gate() / checkOutput() 均非 pass）
 *   H 登记纪律（FAMILIES 表、__internals 导出、头注记 r316）
 * 用法: node test/round-316-auction-victory-break-even-exit.test.js
 */
'use strict';
const assert = require('assert');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const WC = require('../src/winners-curse.js');
const DE = require('../src/disposition-effect.js');
const ECON = require('../src/econ-reasoning-gate.js');
const WCI = WC.__internals();
const DEI = DE.__internals();

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}
const NEVER = /(?!)/;

// ─── 攻击样本 ─────────────────────────────────────────────
// A 族 winners_curse 新措辞家族（竞价胜利新形 × 价值推断新形）
const WC_ATTACKS = [
  '我们抢到了新地王，十几家开发商挤破头，说明这块地真的值这个价',
  '抢地大战我们赢了，这么多房企都想要，市场已经很认可这个价格',
  '牌照竞拍价创了新高，可见市场很认这个价格，值',
  '采矿权竞得价远超起拍价，说明资源就这么值钱',
  '打新中签率这么低我们还能中，说明这只新股确实有潜力',
  '投标综合评分第一，专家组都很认我们的报价',
  'Winning the spectrum auction at a record price proves the market values this bandwidth',
  'We landed the contract after outbidding three rivals, which shows the client agrees our price is right',
  'The winning bid for the mining license was far above the reserve, so the resource must be worth it',
  'We got the IPO allotment despite the low odds, which just confirms the stock is a good one',
];
// B 族 disposition_effect 新措辞家族（回本即退/翻红就抛/亏损死扛 slang）
const DE_ATTACKS = [
  '基金刚回本我就想赎回，亏着的那个反而一直拿着',
  '股票翻红就抛，绿着就装死，赚钱的从来拿不住',
  '盈利单拿不住，亏损单扛得住，赚一点就跑，亏了反倒不动',
  '这只票涨了两个点就赶紧落袋，跌了百分之二十还稳稳拿着',
  'As soon as my position turns green I cash out, but the red ones I just keep holding',
  'I sell my winners the moment they are up and hold my losers for years',
  'Profitable trades get closed early while losing trades are held indefinitely',
];
// 本轮新增良性（易误伤形：竞价/回本/处置的正确表述）
const NEW_BENIGN = [
  '土拍溢价率受政府限价约束，竞得价反映的是出让条件',
  '抢地之前要做现金流压力测试，竞价结果不等于估值',
  '打新中签是随机配号，与新股质量没有因果关系',
  '评标委员会按技术分和商务分独立打分，全程录像备查',
  'The record clearing price reflects aggregate bids, not the asset intrinsic value',
  'An IPO allotment is random; winning the lottery does not validate the price',
  '定投三年终于回本，我决定继续持有到目标价再卖',
  '止盈止损线在买入前就设好，触线机械执行，不看盈亏状态',
  '虽然浮盈了不少，但没到目标价，我继续拿着不动',
  'My exit rules are valuation-based, regardless of paper gains or losses',
  'The position is back to break even and I am holding until the thesis plays out',
  'Tax-loss harvesting follows IRS rules, it is not about holding losers',
];

// ─── A: gate 归因 ────────────────────────────────────────
check('A gate 归因：17 条攻击全部 action != pass 且 econ_reasoning_gate 承重', () => {
  for (const t of WC_ATTACKS.concat(DE_ATTACKS)) {
    const r = gateFn(t);
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(action, 'pass', 'gate pass: ' + t);
    assert.ok(dims.includes('econ_reasoning_gate'), 'econ 未承重: ' + t + ' dims=' + JSON.stringify(dims));
  }
});

// ─── B: 模块直调 ──────────────────────────────────────────
check('B 模块直调：WC 10/10 命中', () => {
  for (const t of WC_ATTACKS) assert.strictEqual(WC.detectWinnersCurse(t).hit, true, '未命中: ' + t);
});
check('B 模块直调：DE 7/7 命中', () => {
  for (const t of DE_ATTACKS) assert.strictEqual(DE.detectDispositionEffect(t).hit, true, '未命中: ' + t);
});

// ─── C: 良性 ──────────────────────────────────────────────
const CORPUS = [
  'test/gate-benchmark.js',
  'test/gate-benchmark-extended.js',
  'test/vertical-benign-benchmark.js',
  'test/benign-mixed-benchmark.js',
];
function flatten(x, out) {
  if (typeof x === 'string') { if (x.trim().length > 3) out.push(x); return out; }
  if (Array.isArray(x)) { for (const y of x) flatten(y, out); return out; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) { if (k === 'EXPECT') continue; flatten(x[k], out); }
  }
  return out;
}
check('C 良性：官方良性语料 369 条（去重）两模块零误命中', () => {
  const seen = new Set();
  let total = 0;
  for (const f of CORPUS) {
    let m;
    try { m = require('../' + f); } catch (e) { continue; }
    for (const text of flatten(m.SAMPLES || m.CATEGORIES || {}, [])) {
      if (seen.has(text)) continue;
      seen.add(text); total++;
      assert.strictEqual(WC.detectWinnersCurse(text).hit, false, 'WC 误伤: ' + text.slice(0, 50));
      assert.strictEqual(DE.detectDispositionEffect(text).hit, false, 'DE 误伤: ' + text.slice(0, 50));
    }
  }
  assert.strictEqual(total, 369, '语料条数口径: ' + total);
});
check('C 良性：本轮新增 12 条良性两模块零误命中', () => {
  for (const t of NEW_BENIGN) {
    assert.strictEqual(WC.detectWinnersCurse(t).hit, false, 'WC 误伤: ' + t);
    assert.strictEqual(DE.detectDispositionEffect(t).hit, false, 'DE 误伤: ' + t);
  }
});

// ─── D: 存量回归 ──────────────────────────────────────────
const WC_REGRESS = [
  '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  '这次中标证明我们的报价是合理的，业主认可这个成本。',
  '能拍下这幅画，说明它确实被低估了，我们捡了漏。',
  '招标排名第一，说明我们的方案性价比最高。',
  '竞得这块地意味着市场认可这个价格，值。',
  '出价最高还赢了，只能说明这东西真的好。',
  'We won the auction, which confirms the asset is worth what we paid.',
  'We outbid everyone, so the painting was clearly undervalued—a real bargain.',
];
const DE_REGRESS = [
  '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。',
  '赚钱的股票赚一点我就卖，亏钱的反而越跌越拿，实践证明这样心态最稳。',
  '一看翻红了我就想卖，碧绿碧绿的仓位反而舍不得动，总觉得放放就能回本。',
  'I cash out winners as soon as they are up a notch, but I ride losers for months because they will bounce back.',
  'Winners get sold too fast and losers get held too long; realizing a gain feels good, realizing a loss feels terrible.',
];
check('D 存量回归：WC 8/8 仍命中', () => {
  for (const t of WC_REGRESS) assert.strictEqual(WC.detectWinnersCurse(t).hit, true, '回归失败: ' + t);
});
check('D 存量回归：DE 5/5 仍命中', () => {
  for (const t of DE_REGRESS) assert.strictEqual(DE.detectDispositionEffect(t).hit, true, '回归失败: ' + t);
});

// ─── E: 常量级注入 ────────────────────────────────────────
const E_CASES = [
  ['WC 删 WIN_ZH3', WC, WC_ATTACKS[0], { WIN_ZH3: [] }],
  ['WC 删 VALUE_ZH3', WC, WC_ATTACKS[0], { VALUE_ZH3: [] }],
  ['WC 删 WIN_EN3', WC, WC_ATTACKS[6], { WIN_EN3: [] }],
  ['WC 删 VALUE_EN3', WC, WC_ATTACKS[9], { VALUE_EN3: [] }],
  ['DE 删 CTX_ZH', DE, DE_ATTACKS[2], { CTX_ZH: [] }],
  ['DE 删 CTX_EN', DE, DE_ATTACKS[5], { CTX_EN: [] }],
  ['DE 删 WIN_STATE_ZH', DE, DE_ATTACKS[0], { WIN_STATE_ZH: [] }],
  ['DE 删 WIN_DISP_ZH', DE, DE_ATTACKS[0], { WIN_DISP_ZH: [] }],
  ['DE 删 LOSE_STATE_ZH', DE, DE_ATTACKS[0], { LOSE_STATE_ZH: [] }],
  ['DE 删 LOSE_DISP_ZH', DE, DE_ATTACKS[0], { LOSE_DISP_ZH: [] }],
  ['DE 删 WIN_STATE_EN', DE, 'I sold as soon as I was back to break even, but my losers are still held', { WIN_STATE_EN: [] }],
  ['DE 删 WIN_DISP_EN', DE, DE_ATTACKS[6], { WIN_DISP_EN: [] }],
  ['DE 删 LOSE_STATE_EN', DE, DE_ATTACKS[4], { LOSE_STATE_EN: [] }],
];
for (const [name, mod, sample, inject] of E_CASES) {
  check(`E 常量级注入：${name} → 攻击不再命中`, () => {
    const fn = mod === WC ? WC.detectWinnersCurse : DE.detectDispositionEffect;
    assert.strictEqual(fn(sample, inject).hit, false, '删常量后仍命中: ' + sample);
  });
}

// ─── F: 元素级注入 ────────────────────────────────────────
// 每个本轮新增正则元素配一条「仅该元素承重」的最小样本；删该元素 → 不再命中
const F_CASES = [
  // WC WIN_ZH3（7 元素）
  ['WC WIN_ZH3[0] 抢地族', WC.detectWinnersCurse, WCI.WIN_ZH3, 0, '我们抢到了新地王，说明这块地真的值这个价'],
  ['WC WIN_ZH3[1] 抢地大战赢族', WC.detectWinnersCurse, WCI.WIN_ZH3, 1, '抢地大战我们赢了，市场已经很认可这个价格'],
  ['WC WIN_ZH3[2] 被动竞得族', WC.detectWinnersCurse, WCI.WIN_ZH3, 2, '新地块被我司竞得，说明市场很认这个价格'],
  ['WC WIN_ZH3[3] 打新中签族', WC.detectWinnersCurse, WCI.WIN_ZH3, 3, '打新中签率这么低，说明这只新股确实有潜力'],
  ['WC WIN_ZH3[4] 竞得价创新高族', WC.detectWinnersCurse, WCI.WIN_ZH3, 4, '采矿权竞得价创了新高，说明资源就这么值钱'],
  ['WC WIN_ZH3[5] 竞得价远超族', WC.detectWinnersCurse, WCI.WIN_ZH3, 5, '采矿权竞得价远超起拍价，说明资源就这么值钱'],
  ['WC WIN_ZH3[6] 评标第一族', WC.detectWinnersCurse, WCI.WIN_ZH3, 6, '投标综合评分第一，专家组都很认我们的报价'],
  // WC WIN_EN3（8 元素）
  ['WC WIN_EN3[0] spectrum auction', WC.detectWinnersCurse, WCI.WIN_EN3, 0, 'Winning the spectrum auction proves the market values this bandwidth'],
  ['WC WIN_EN3[1] outbid 全族', WC.detectWinnersCurse, WCI.WIN_EN3, 1, 'We landed the contract after outbidding three rivals, which shows the client agrees our price is right'],
  ['WC WIN_EN3[2] winning bid far above reserve', WC.detectWinnersCurse, WCI.WIN_EN3, 2, 'The winning bid was far above the reserve, which proves the market values this asset'],
  ['WC WIN_EN3[3] record price', WC.detectWinnersCurse, WCI.WIN_EN3, 3, 'A record price proves the market values this asset'],
  ['WC WIN_EN3[4] IPO allotment', WC.detectWinnersCurse, WCI.WIN_EN3, 4, 'We got the IPO allotment, which confirms the stock is a good one'],
  ['WC WIN_EN3[5] top-rated', WC.detectWinnersCurse, WCI.WIN_EN3, 5, 'Our top-rated proposal confirms the market values this approach'],
  // WC VALUE_ZH3（3 元素）
  ['WC VALUE_ZH3[0] 值钱族', WC.detectWinnersCurse, WCI.VALUE_ZH3, 0, '采矿权竞得价远超起拍价，说明资源就这么值钱'],
  ['WC VALUE_ZH3[1] 市场很认价族', WC.detectWinnersCurse, WCI.VALUE_ZH3, 1, '抢地大战我们赢了，市场已经很认可这个价格'],
  ['WC VALUE_ZH3[2] 抢手反推族', WC.detectWinnersCurse, WCI.VALUE_ZH3, 2, '我们抢到地王，开发商挤破头，说明这就是优质资产'],
  // WC VALUE_EN3（2 元素）
  ['WC VALUE_EN3[0] values/potential 族', WC.detectWinnersCurse, WCI.VALUE_EN3, 0, 'Winning the spectrum auction proves the market values this bandwidth'],
  ['WC VALUE_EN3[1] market agrees 族', WC.detectWinnersCurse, WCI.VALUE_EN3, 1, 'We landed the contract after outbidding three rivals, which shows the client agrees our price is right'],
  // DE 存量腿追加元素（9 元素）
  ['DE CTX_ZH[1] 盈利/亏损单', DE.detectDispositionEffect, DEI.CTX_ZH, 1, '盈利单拿不住，亏损单扛得住'],
  ['DE CTX_EN[1] winners/losers', DE.detectDispositionEffect, DEI.CTX_EN, 1, 'I sell my winners and hold my losers'],
  ['DE WIN_STATE_ZH[1] 回本族', DE.detectDispositionEffect, DEI.WIN_STATE_ZH, 1, '基金刚回本我就想赎回，亏着的那个一直拿着'],
  ['DE WIN_DISP_ZH[8] 抛族', DE.detectDispositionEffect, DEI.WIN_DISP_ZH, 8, '股票翻红就抛，绿着就装死'],
  ['DE WIN_DISP_ZH[9] 回本就跑族', DE.detectDispositionEffect, DEI.WIN_DISP_ZH, 9, '基金刚回本我就撤了，亏着的那个一直拿着'],
  ['DE LOSE_STATE_ZH[1] 亏着族', DE.detectDispositionEffect, DEI.LOSE_STATE_ZH, 1, '基金刚回本我就想赎回，亏着的那个一直拿着'],
  ['DE LOSE_DISP_ZH[7] 扛得住族', DE.detectDispositionEffect, DEI.LOSE_DISP_ZH, 7, '盈利单拿不住，亏损单扛得住'],
  ['DE LOSE_DISP_ZH[8] 稳稳拿着族', DE.detectDispositionEffect, DEI.LOSE_DISP_ZH, 8, '这只票涨了两个点就赶紧落袋，跌了的仓位一直稳稳拿着'],
  ['DE LOSE_DISP_ZH[9] 亏了反倒不动族', DE.detectDispositionEffect, DEI.LOSE_DISP_ZH, 9, '盈利单拿不住，赚一点就跑，亏了反倒留着'],
  ['DE WIN_STATE_EN[1] back to break-even', DE.detectDispositionEffect, DEI.WIN_STATE_EN, 1, 'I sold as soon as I was back to break even, but my losers are still held'],
  ['DE WIN_DISP_EN[2] closed early', DE.detectDispositionEffect, DEI.WIN_DISP_EN, 2, DE_ATTACKS[6]],
  ['DE WIN_DISP_EN[3] exit 族', DE.detectDispositionEffect, DEI.WIN_DISP_EN, 3, 'I exit my winners early and hold my losers for years'],
  ['DE LOSE_STATE_EN[1] red ones', DE.detectDispositionEffect, DEI.LOSE_STATE_EN, 1, DE_ATTACKS[4]],
];
const KEY_OF = [
  [WCI.WIN_ZH3, 'WIN_ZH3'], [WCI.WIN_EN3, 'WIN_EN3'],
  [WCI.VALUE_ZH3, 'VALUE_ZH3'], [WCI.VALUE_EN3, 'VALUE_EN3'],
  [DEI.CTX_ZH, 'CTX_ZH'], [DEI.CTX_EN, 'CTX_EN'],
  [DEI.WIN_STATE_ZH, 'WIN_STATE_ZH'], [DEI.WIN_DISP_ZH, 'WIN_DISP_ZH'],
  [DEI.LOSE_STATE_ZH, 'LOSE_STATE_ZH'], [DEI.LOSE_DISP_ZH, 'LOSE_DISP_ZH'],
  [DEI.WIN_STATE_EN, 'WIN_STATE_EN'], [DEI.WIN_DISP_EN, 'WIN_DISP_EN'],
  [DEI.LOSE_STATE_EN, 'LOSE_STATE_EN'],
];
for (const [name, fn, arr, i, sample] of F_CASES) {
  check(`F 元素级注入：${name} → 最小样本不再命中`, () => {
    const entry = KEY_OF.find(([a]) => a === arr);
    assert.ok(entry, '常量未登记: ' + name);
    const key = entry[1];
    const filtered = arr.slice();
    filtered.splice(i, 1);
    const r = fn(sample, { [key]: filtered });
    assert.strictEqual(r.hit, false, '删元素后仍命中: ' + sample);
  });
}

// ─── G: 入口双路 ──────────────────────────────────────────
check('G 入口双路：gate() 与 checkOutput() 对 4 条代表样本均非 pass', () => {
  const samples = [WC_ATTACKS[0], WC_ATTACKS[4], DE_ATTACKS[0], DE_ATTACKS[5]];
  for (const t of samples) {
    const g = gateFn(t);
    const ga = g.action || (g.gate && g.gate.action);
    assert.notStrictEqual(ga, 'pass', 'gate pass: ' + t);
    const o = gateMod.checkOutput ? gateMod.checkOutput(t) : null;
    if (o) {
      const oa = o.action || (o.gate && o.gate.action);
      assert.notStrictEqual(oa, 'pass', 'checkOutput pass: ' + t);
    }
  }
});

// ─── H: 登记纪律 ──────────────────────────────────────────
check('H 登记纪律：FAMILIES 表含 winners_curse / disposition_effect 且 fn 名正确', () => {
  const keys = ECON.FAMILIES.map(f => f.key);
  assert.ok(keys.includes('winners_curse'), 'FAMILIES 缺 winners_curse');
  assert.ok(keys.includes('disposition_effect'), 'FAMILIES 缺 disposition_effect');
  const wc = ECON.FAMILIES.find(f => f.key === 'winners_curse');
  const de = ECON.FAMILIES.find(f => f.key === 'disposition_effect');
  assert.strictEqual(wc.fn, 'detectWinnersCurse');
  assert.strictEqual(de.fn, 'detectDispositionEffect');
});
check('H 登记纪律：WC __internals 导出本轮新常量', () => {
  const ex = WCI;
  for (const k of ['WIN_ZH3', 'WIN_EN3', 'VALUE_ZH3', 'VALUE_EN3']) {
    assert.ok(Array.isArray(ex[k]), 'WC 缺导出: ' + k);
  }
  assert.strictEqual(WCI.WIN_ZH3.length, 7);
  assert.strictEqual(WCI.WIN_EN3.length, 6);
  assert.strictEqual(WCI.VALUE_ZH3.length, 3);
  assert.strictEqual(WCI.VALUE_EN3.length, 2);
});
check('H 登记纪律：DE 存量腿追加元素计数', () => {
  assert.strictEqual(DEI.CTX_ZH.length, 2);
  assert.strictEqual(DEI.CTX_EN.length, 2);
  assert.strictEqual(DEI.WIN_STATE_ZH.length, 2);
  assert.strictEqual(DEI.WIN_DISP_ZH.length, 10);
  assert.strictEqual(DEI.LOSE_STATE_ZH.length, 2);
  assert.strictEqual(DEI.LOSE_DISP_ZH.length, 10);
  assert.strictEqual(DEI.WIN_STATE_EN.length, 2);
  assert.strictEqual(DEI.WIN_DISP_EN.length, 4);
  assert.strictEqual(DEI.LOSE_STATE_EN.length, 2);
});
check('H 登记纪律：两模块头注记含 [r316 扩展]', () => {
  const fs = require('fs');
  for (const f of ['src/winners-curse.js', 'src/disposition-effect.js']) {
    const src = fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8');
    assert.ok(src.includes('[r316 扩展]'), f + ' 头注记缺 [r316 扩展]');
  }
});

console.log(`\nr316 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
