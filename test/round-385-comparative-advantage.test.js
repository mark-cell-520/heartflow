'use strict';
/**
 * test/round-385-comparative-advantage.test.js — r385 绝对优势≠比较优势误读轮测
 *（r381 结构同款）
 *
 * 判据（绝对优势前提 × 无贸易获益结论 两腿近距共现 + 两组豁免 + 腿②守卫，
 *   缺一不判）：
 *   腿① ADV 绝对优势前提在场（ZH 五形：F1 在所有…都更…；F2 每…都更…；
 *         F3 什么都比…（更|造得/做得/卖得）…优/便宜；F4 没有比…更…；F5 全面/
 *         各方面/无一 + 领先/占优/优于/有效率；EN 五形：more efficient/productive
 *         at everything/all/every、better/faster/cheaper at everything、outproduces
 *         … in everything、absolute advantage in all/every、no one can match … in
 *         anything）；
 *   腿② NOGAIN 无贸易获益结论在场（ZH 四形：F1 没必要/无须/不必 + 贸易/交易/
 *         分工/外包/合作/进口；F2 毫无/没有/全无/半点 + 意义/价值/好处/收益/益；
 *         F3 无益/不利/吃亏/受损 + 对…；F4 纯属/就是 + 浪费/白费/徒劳/白费功夫；
 *         EN 四形：no way/reason/point/benefit/gain + trade/specialization/
 *         outsourcing/exchange/cooperation/import、pointless/useless/meaningless/
 *         a waste + 同左、cannot/can't benefit from …、only … stands to lose）；
 *   两腿须落在邻近窗内（以腿②为锚，ZH 30 字 / EN 110 字符），方向不限；
 *   豁免 A 概念讨论（比较优势/comparative advantage + 谬误/误解/理论/概念/
 *         fallacy/misconception/theory 框架词共现）；
 *   豁免 B 纠正句（比较优势/opportunity cost + 仍可/仍能/依然/照样 + 获益/受益/
 *         gains/still gains）；
 *   腿②守卫：紧前否定窗（ZH 6 字 / EN 20 字符）+ 前后窗对冲短语（误解/谬误/
 *         misconception/fallacy 等）。中英各自取对应守卫组。
 *
 * 攻击形（9 条，中英混合，腿②四形全覆盖；同池 probe-candidates.js：本族穿透
 *   6/8 真零命中——存量维度对「绝对优势 → 贸易无意义」形零覆盖；良性 2 条非 pass
 *   均系存量 stereotype/confidence 维度误伤，非本族增量）：
 *   「A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易」
 *   「这家公司在所有产品线上的成本都低于对手，因此并购整合毫无意义」
 *   「他做什么都比外包团队快，所以外包纯属浪费钱」
 *   「我国每一项技术都领先世界，进口别国产品毫无意义」
 *   「发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义」
 *   「Country A produces both wheat and steel more efficiently than Country B, so there is no way trade can benefit A」
 *   「our team is faster at every task than the vendor, so outsourcing is pointless」
 *   「Our firm has an absolute advantage in all stages, therefore specialization is a waste」
 *   「No competitor can match us in anything, so there is no reason to trade with them」
 *
 * 良性形（11 条，含 3 条新增压力样本——腿①在场但为纠正形/无腿②）：
 *   「在比较优势框架下，即使一国在所有商品上都有绝对优势，它仍可通过专业化并贸易获益」…
 *
 * src/index.js 零改动、维度 265 不变、dimMap 键数不变（子族扩族）、VERSION
 *   不 bump（基线 6.8.192 由远端 r380 duration_neglect 设置）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectComparativeAdvantage, __internals } = require(path.join(ROOT, 'src', 'comparative-advantage.js'));

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + (e && e.message)); }
}

// ─── A 模块级攻击命中 ───
const ATTACK = [
  'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易',
  '这家公司在所有产品线上的成本都低于对手，因此并购整合毫无意义',
  '他做什么都比外包团队快，所以外包纯属浪费钱',
  '我国每一项技术都领先世界，进口别国产品毫无意义',
  '发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义',
  'Country A produces both wheat and steel more efficiently than Country B, so there is no way trade can benefit A',
  'our team is faster at every task than the vendor, so outsourcing is pointless',
  'Our firm has an absolute advantage in all stages, therefore specialization is a waste',
  'No competitor can match us in anything, so there is no reason to trade with them',
];
console.log('=== A 模块级攻击命中 ===');
for (let i = 0; i < ATTACK.length; i++) {
  T(`A${i + 1} 攻击命中（hit + score≥0.6）`, () => {
    const r = detectComparativeAdvantage(ATTACK[i]);
    assert.ok(r.hit, '未命中: ' + JSON.stringify(r));
    assert.ok(r.score >= 0.6, `score ${r.score} 未过 0.6`);
  });
}

// ─── B 模块级良性零误伤 ───
const BENIGN = [
  '在比较优势框架下，即使一国在所有商品上都有绝对优势，它仍可通过专业化并贸易获益',
  '即使我们每个环节都更快，也可以把非核心业务外包，让双方聚焦各自更擅长的部分',
  '大厨做每道菜都比学徒快，但他仍受益于分工，因为他的时间可以用来做更复杂的菜',
  '即使一国在所有产品上生产率都更高，贸易仍能让它获益，这是比较优势的核心结论',
  'even if one country has an absolute advantage in everything, comparative advantage still creates gains from trade',
  'even if our team is faster at every task, we still outsource so everyone focuses on their strengths',
  'deposit insurance can create moral hazard, so it is usually paired with prudential regulation',
  '我们的产品在所有品类上都比对手便宜，但这只是绝对优势，利润仍取决于比较优势与定位',
  '他干什么都比别人快，所以大家都愿意和他组队，团队产出更高',
  'A公司每项业务成本都更低，但它仍选择外包非核心环节以聚焦主业',
  'comparative advantage, not absolute advantage, explains why both countries gain from trade',
];
console.log('=== B 模块级良性零误伤 ===');
T('B1 11 条良性零命中', () => {
  const hits = [];
  for (const b of BENIGN) {
    const r = detectComparativeAdvantage(b);
    if (r.hit) hits.push(b.slice(0, 24) + '…');
  }
  assert.strictEqual(hits.length, 0, '误伤:\n' + hits.join('\n'));
});

// ─── C 负例注入-删条（承重证明：全键 / 腿① / 腿② 三向）───
const INJECT_KEY = __internals();
const LEG1 = Object.keys(INJECT_KEY).filter(k => /^ADV_(ZH|EN)_F\d$/.test(k));
const LEG2 = Object.keys(INJECT_KEY).filter(k => /^NOGAIN_(ZH|EN)_F\d$/.test(k));
const PROBE_ATTACK = ATTACK[0];
console.log('=== C 负例注入-删条（承重）===');
function nullify(keys) { const o = {}; for (const k of keys) o[k] = /(?!)/i; return o; }
T('C1 全键注入 → 家族从命中消失', () => {
  const before = detectComparativeAdvantage(PROBE_ATTACK);
  assert.ok(before.hit, '注入前应命中（前提）');
  const after = detectComparativeAdvantage(PROBE_ATTACK, nullify(Object.keys(INJECT_KEY).filter(k => k !== 'findSignatures' && k !== 'WINDOW_ZH' && k !== 'WINDOW_EN')));
  assert.ok(!after.hit, '全键注入后仍命中——leg 不承重');
});
T('C2 腿① ADV 全注入 → 家族消失（腿①承重）', () => {
  const after = detectComparativeAdvantage(PROBE_ATTACK, nullify(LEG1));
  assert.ok(!after.hit, '腿①注入后仍命中');
});
T('C3 腿② NOGAIN 全注入 → 家族消失（腿②承重）', () => {
  const after = detectComparativeAdvantage(PROBE_ATTACK, nullify(LEG2));
  assert.ok(!after.hit, '腿②注入后仍命中');
});

// ─── D 引擎 gate 兑现 ───
console.log('=== D 引擎 gate 兑现 ===');
for (let i = 0; i < ATTACK.length; i++) {
  T(`D${i + 1} gate.action 非 pass 且归因 econ_reasoning_gate`, () => {
    const r = gcheck(ATTACK[i]);
    const action = r.gate ? r.gate.action : r.action;
    assert.notStrictEqual(action, 'pass', `action=${action}`);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), 'findings: [' + dims.join(',') + ']');
  });
}

// ─── E 插件层接线 ───
console.log('=== E 插件层接线 ===');
T('E1 插件族表含 comparative_advantage 且计数 42', () => {
  assert.ok(plugin.FAMILIES.some(f => f.key === 'comparative_advantage' && f.round === 'r385'), '插件族表缺 comparative_advantage');
  assert.strictEqual(plugin.FAMILIES.length, 42);
});
T('E2 econ 组 36 族 + stats 组 6 族，key 唯一', () => {
  const econ = plugin.FAMILIES.filter(f => f.group === 'econ');
  const stats = plugin.FAMILIES.filter(f => f.group === 'stats');
  assert.strictEqual(econ.length, 36);
  assert.strictEqual(stats.length, 6);
  const keys = plugin.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, 42);
});
T('E3 插件 version 已 bump 至 1.18.0', () => {
  assert.strictEqual(plugin.version, '1.18.0');
});
T('E4 gate 桥族表含 comparative_advantage 且计数 37', () => {
  const gFams = gate.FAMILIES;
  assert.ok(gFams.some(f => f.key === 'comparative_advantage' && f.round === 'r385'), 'gate 桥族表缺 comparative_advantage');
  assert.strictEqual(gFams.length, 37, 'gate 桥族表应为 37 族');
});
T('E5 插件 analyze 归因 comparative_advantage', () => {
  const r = plugin.analyze(ATTACK[0]);
  assert.ok(r.families.some(x => x.key === 'comparative_advantage'), '命中族: [' + r.families.map(x => x.key).join(',') + ']');
  assert.ok(r.score > 0.5, `score ${r.score}`);
});

// ─── F 射程邻接核查 ───
console.log('=== F 射程邻接核查 ===');
// 邻族攻击句不应被本族命中（mercantiism 贸易差额 / lump_of_labor 固定份额 / zero_sum）
T('F1 邻族攻击不误命中 comparative_advantage', () => {
  const neighbors = [
    '保持贸易顺差才能让国家积累更多财富，逆差就是财富外流。',              // mercantilism
    '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的。', // lump_of_labor
    '你多得一份我就必然少得一份，我们的利益是完全对立的。',                // zero_sum
  ];
  for (const n of neighbors) {
    const r = detectComparativeAdvantage(n);
    assert.ok(!r.hit, '邻族攻击被误命中: ' + n.slice(0, 20));
  }
});
// 本族攻击在插件层只归因 comparative_advantage（族键纯净，不串到邻族）
T('F2 本族攻击族键纯净（不串 mercantilism/lump_of_labor/zero_sum）', () => {
  const r = plugin.analyze(ATTACK[0]);
  const keys = r.families.map(x => x.key);
  for (const bad of ['mercantilism', 'lump_of_labor', 'zero_sum_fallacy']) {
    assert.ok(!keys.includes(bad), '串到邻族 ' + bad + ': ' + keys.join(','));
  }
});

// ─── G VERSION 未被 r385 改动 ───
console.log('=== G VERSION 未被 r385 改动 ===');
T('G1 VERSION 仍为基线 6.8.192（子族扩族、dimMap 键数不变，不 bump）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192，实为 ' + v);
});

console.log(`\n[r385] round-385-comparative-advantage: A ${ATTACK.length}/${ATTACK.length} 命中, B 11/11 零命中, C 3 键注入全翻转, D ${ATTACK.length}/${ATTACK.length} 非 pass, E 插件 42 族接线 + gate 37, F 邻接纯净, G VERSION 6.8.192 未动`);
if (failed > 0) { console.log(`\n# fail ${failed}`); process.exit(1); }
