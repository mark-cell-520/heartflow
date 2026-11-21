// r440 law_of_small_numbers「大样本规模 × 可靠性裁定」族测试
// 真升级②：腿①'' BIGSAMPLE 大样本/大数据规模锚点（一百万/千万/过亿/PB级/
// 海量全量数据/hundred million/billions of/PB scale/every transaction）×
// 腿②'' CERTAINTY 可靠性/充分性裁定（不可能有错/还会错吗/检验可以省了/
// 数字本身就能说明/绝对可靠/cannot be wrong/do not need sampling theory）。
// 与存量六路由（pair/quant/perpetual/exempt/window + 小样本方向）平行，
// 本族是**反向**形态：小数定律低估小样本代表性，本族高估大样本充分性
// ——量大不等于无偏，全量数据也免不了检验。
// 立项探针：coordination/agent4/probes/r440-probe-pool.js（v6.8.217 gate()
// 全量 findings 实测）：六家族同池定拨，本族攻击穿透 6/7、良性 3/3 零误伤
// （P1 赌徒该轮转 6/7 但良性被存量 moral_foundations 代拦、P2 基率 1/6、
// P3 百分点 2/7 存量已覆盖、P5 早停 6/7 但宿主系他人模块、P6 均值=典型
// 4/7 已有 mean_as_typical 部分承重）。
// 门禁纪律：存量测试文件命中集改动前后 diff 另行扫描（r440-stock-scan）。
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { detectLawOfSmallNumbers, __internals } = require('../src/law-of-small-numbers.js');
const { gate } = require('../src/gate.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + ': ' + e.message); }
}

// ─── 攻击样本：大样本规模 × 可靠性/充分性裁定 ───────────────────
// PURE_BIG = 纯规模锚点攻击（删 BIGSAMPLE_ZH[0] 数量级形即翻；PB/海量形
// 走 BIGSAMPLE_ZH[1]/[2]）。
const ATTACK_ZH = [
  ['A1 百万×不可能有错', '我们回收了一百万份问卷，样本量这么大，结论不可能有错。'],
  ['A2 几亿×看不准反问', '全网几亿条数据都摆在这儿，还能看不准吗。'],
  ['A3 PB级×检验可省', '数据量都到PB级了，传统统计那套检验可以省了。'],
  ['A4 十万×数字本身', '走访了十万个家庭，这个数字本身就能说明问题。'],
  ['A5 过亿×还会错', '装机量过亿，用户行为全量在手，判断还会错？'],
  ['A6 千万×绝对可靠', '平台每天处理上千万笔订单，风控判断绝对可靠。'],
  ['A7 海量×不需要检验', '我们有的是海量数据，不需要统计检验那一套。'],
  ['A8 全量×百分百可信', '全量数据都在手里，这样的结论百分百可信。'],
  ['A9 数以亿计×不会有错', '样本数以亿计，结论不会有错。'],
];
const ATTACK_EN = [
  ['B1 hundred million×cannot be wrong', 'With a hundred million data points, the conclusion cannot be wrong.'],
  ['B2 PB scale×no need sampling', 'At PB scale, you do not need sampling theory anymore.'],
  ['B3 every transaction×numbers settle', 'We track every transaction on the platform, so the numbers alone settle the question.'],
  ['B4 billions of×finding certainly', 'Billions of rows are in the warehouse, so this finding is certainly correct.'],
  ['B5 massive dataset×beyond doubt', 'The massive dataset means the result is beyond doubt.'],
];

// ─── 良性样本：修正/概念/对冲/单腿 ─────────────────────────────
const BENIGN = [
  ['修正-偏倚仍在', '样本量达到一百万，随机误差降下来了，但抽样框偏倚仍需检验。'],
  ['修正-测量误差', '全量采集避免了抽样误差，测量误差依然存在。'],
  ['修正-不能替代', '数据量大不能替代对偏倚和混淆的检查。'],
  ['概念-大数定律', '大数定律说的是试验次数足够多时频率趋于概率，不是数据多结论就对。'],
  ['概念-统计学', '统计学上，样本规模与代表性是两回事。'],
  ['修正-清洗去偏', 'PB级数据也要先清洗和去偏，不然结论照样错。'],
  ['修正-描述统计', '调研了一百万用户，这只是描述性统计，因果结论还要另做实验。'],
  ['对冲-据说', '据说这份覆盖几亿人的报告结论绝对可靠。'],
  ['对冲-X不X', '数据量这么大，结论可靠不可靠还得看偏倚检验。'],
  ['单腿-只有规模', '我们回收了一百万份问卷。'],
  ['单腿-只有裁定', '结论需要检验。'],
  ['EN-修正', 'With hundreds of millions of users, that does not prove the product is reliable.'],
  ['EN-修正2', 'The dataset is huge, yet the sampling frame itself was biased.'],
  ['EN-单腿1', 'We have billions of rows in the warehouse.'],
  ['EN-单腿2', 'The dataset is massive and growing every day.'],
];

// ─── 存量攻击样本（新腿不得承载存量族：删新族常量后仍命中）─────
const STOCK = [
  ['存量pair-硬币', '抛了三次硬币都是正面，这枚硬币明显是偏的'],
  ['存量pair-民意', '我问了五个人，四个说支持，民意已经很清楚了'],
  ['存量pair-麻将', '连玩了三把都输，这号是废的'],
  ['存量perpetual-日出', '我观察了十次日出，太阳每次都从东边升起，所以太阳永远从东边升起'],
  ['存量pair-EN', 'Three coin flips came up heads, so this coin is clearly biased'],
];

console.log('r440 law_of_small_numbers 大样本规模×可靠性裁定族测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectLawOfSmallNumbers, 'function');
  assert.equal(detectLawOfSmallNumbers('').hit, false);
  assert.equal(detectLawOfSmallNumbers(null).hit, false);
  assert.equal(detectLawOfSmallNumbers('短').hit, false);
  const I = __internals();
  assert.ok(Array.isArray(I.BIGSAMPLE_ZH) && I.BIGSAMPLE_ZH.length === 3, 'BIGSAMPLE_ZH 三形导出');
  assert.ok(Array.isArray(I.BIGSAMPLE_EN) && I.BIGSAMPLE_EN.length === 4, 'BIGSAMPLE_EN 四形导出');
  assert.ok(Array.isArray(I.CERTAINTY_ZH) && I.CERTAINTY_ZH.length === 5, 'CERTAINTY_ZH 五形导出');
  assert.ok(Array.isArray(I.CERTAINTY_EN) && I.CERTAINTY_EN.length === 5, 'CERTAINTY_EN 五形导出');
});

check('攻击命中：中文 9 条（kind=bigsample）', () => {
  for (const [name, t] of ATTACK_ZH) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + name + ' | ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers', name);
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + name);
    assert.ok(r.details.includes('大样本'), 'details 须标明大样本族: ' + name);
    assert.ok(r.evidence.some(e => e.includes('可靠性裁定')), 'evidence 须含可靠性裁定: ' + name);
    assert.ok(r.guidance.includes('大样本崇拜') || r.guidance.includes('量大不等于无偏'), 'guidance 覆盖本族: ' + name);
  }
});

check('攻击命中：英文 5 条（kind=bigsample）', () => {
  for (const [name, t] of ATTACK_EN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + name + ' | ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers', name);
    assert.ok(r.evidence.some(e => e.includes('certainty verdict')), 'evidence 须含 certainty verdict: ' + name);
  }
});

check('良性零误伤：15 条（修正/概念/对冲/单腿）', () => {
  for (const [name, t] of BENIGN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, false, '不得命中: ' + name + ' | ' + t + (r.hit ? ' | ' + JSON.stringify(r.evidence) : ''));
  }
});

check('存量回归：5 条存量攻击删除新族常量后仍命中', () => {
  const inject = { BIGSAMPLE_ZH: [], BIGSAMPLE_EN: [], CERTAINTY_ZH: [], CERTAINTY_EN: [] };
  for (const [name, t] of STOCK) {
    const r = detectLawOfSmallNumbers(t, inject);
    assert.equal(r.hit, true, '删新族后仍应命中: ' + name + ' | ' + t);
  }
});

check('负例注入 G1：删 BIGSAMPLE_ZH 后全部中文攻击翻 miss', () => {
  const inject = { BIGSAMPLE_ZH: [] };
  for (const [name, t] of ATTACK_ZH) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 BIGSAMPLE_ZH 后应 miss: ' + name);
  }
});

check('负例注入 G2：删 BIGSAMPLE_EN 后全部英文攻击翻 miss', () => {
  const inject = { BIGSAMPLE_EN: [] };
  for (const [name, t] of ATTACK_EN) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 BIGSAMPLE_EN 后应 miss: ' + name);
  }
});

check('负例注入 G3：删 CERTAINTY_ZH 后全部中文攻击翻 miss', () => {
  const inject = { CERTAINTY_ZH: [] };
  for (const [name, t] of ATTACK_ZH) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 CERTAINTY_ZH 后应 miss: ' + name);
  }
});

check('负例注入 G4：删 CERTAINTY_EN 后全部英文攻击翻 miss', () => {
  const inject = { CERTAINTY_EN: [] };
  for (const [name, t] of ATTACK_EN) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 CERTAINTY_EN 后应 miss: ' + name);
  }
});

check('负例注入 G5：全族摘除（BIGSAMPLE+CERTAINTY 中英）后 14 条攻击全翻 miss', () => {
  const inject = { BIGSAMPLE_ZH: [], BIGSAMPLE_EN: [], CERTAINTY_ZH: [], CERTAINTY_EN: [] };
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '全族摘除后应 miss: ' + name);
  }
});

check('负例注入 G6：删存量全部裁定腿（UNIVERSAL/QUANT/PERPETUAL/WINDOW/STABLE 中英）后本族仍命中', () => {
  const inject = {
    UNIVERSAL_ZH: [], QUANT_ZH: [], PERPETUAL_ZH: [], WINDOW_ZH: [], STABLE_ZH: [],
    UNIVERSAL_EN: [], QUANT_EN: [], PERPETUAL_EN: [], WINDOW_EN: [], STABLE_EN: [],
  };
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detectLawOfSmallNumbers(t, inject);
    assert.equal(r.hit, true, '删存量裁定腿后仍应命中: ' + name);
    assert.ok(r.evidence.some(e => e.includes('可靠性裁定') || e.includes('certainty verdict')), '须由本腿承重: ' + name);
  }
});

check('负例注入 G7：删 SMALL_N 双腿后本族仍命中（锚点独立性）', () => {
  const inject = { SMALL_N_ZH: [], SMALL_N_EN: [] };
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detectLawOfSmallNumbers(t, inject);
    assert.equal(r.hit, true, '删 SMALL_N 后仍应命中: ' + name);
    assert.ok(r.evidence.some(e => e.includes('可靠性裁定') || e.includes('certainty verdict')), '须由本腿承重: ' + name);
  }
});

check('逐元素注入：BIGSAMPLE_ZH[0] 数量级删除后数量级攻击翻 miss，PB/海量形仍命中', () => {
  const I = __internals();
  const inject = { BIGSAMPLE_ZH: [/(?!)/, I.BIGSAMPLE_ZH[1], I.BIGSAMPLE_ZH[2]] };
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, false, '删数量级后 A1 应 miss');
  assert.equal(detectLawOfSmallNumbers('样本数以亿计，结论不会有错。', inject).hit, false, '删数量级后 A9 应 miss');
  assert.equal(detectLawOfSmallNumbers('数据量都到PB级了，传统统计那套检验可以省了。', inject).hit, true, '删数量级后 A3（PB级）仍应命中');
  assert.equal(detectLawOfSmallNumbers('我们有的是海量数据，不需要统计检验那一套。', inject).hit, true, '删数量级后 A7（海量）仍应命中');
});

check('逐元素注入：BIGSAMPLE_ZH[1] PB级删除后 A3 翻 miss，数量级形仍命中', () => {
  const I = __internals();
  const inject = { BIGSAMPLE_ZH: [I.BIGSAMPLE_ZH[0], /(?!)/, I.BIGSAMPLE_ZH[2]] };
  assert.equal(detectLawOfSmallNumbers('数据量都到PB级了，传统统计那套检验可以省了。', inject).hit, false, '删 PB级后 A3 应 miss');
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, true, '删 PB级后 A1（数量级）仍应命中');
});

check('逐元素注入：BIGSAMPLE_ZH[2] 海量/全量删除后 A7/A8 翻 miss', () => {
  const I = __internals();
  const inject = { BIGSAMPLE_ZH: [I.BIGSAMPLE_ZH[0], I.BIGSAMPLE_ZH[1], /(?!)/] };
  assert.equal(detectLawOfSmallNumbers('我们有的是海量数据，不需要统计检验那一套。', inject).hit, false, '删海量形后 A7 应 miss');
  assert.equal(detectLawOfSmallNumbers('全量数据都在手里，这样的结论百分百可信。', inject).hit, false, '删海量形后 A8 应 miss');
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, true, '删海量形后 A1 仍应命中');
});

check('逐元素注入：CERTAINTY_ZH[0] 不可能有错族删除后 A1/A9 翻 miss，反问形仍命中', () => {
  const I = __internals();
  const inject = { CERTAINTY_ZH: [/(?!)/, I.CERTAINTY_ZH[1], I.CERTAINTY_ZH[2], I.CERTAINTY_ZH[3], I.CERTAINTY_ZH[4]] };
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, false, '删[0]后 A1 应 miss');
  assert.equal(detectLawOfSmallNumbers('样本数以亿计，结论不会有错。', inject).hit, false, '删[0]后 A9 应 miss');
  assert.equal(detectLawOfSmallNumbers('全网几亿条数据都摆在这儿，还能看不准吗。', inject).hit, true, '删[0]后 A2（反问形）仍应命中');
});

check('逐元素注入：CERTAINTY_ZH[1] 反问族删除后 A2/A5 翻 miss', () => {
  const I = __internals();
  const inject = { CERTAINTY_ZH: [I.CERTAINTY_ZH[0], /(?!)/, I.CERTAINTY_ZH[2], I.CERTAINTY_ZH[3], I.CERTAINTY_ZH[4]] };
  assert.equal(detectLawOfSmallNumbers('全网几亿条数据都摆在这儿，还能看不准吗。', inject).hit, false, '删[1]后 A2 应 miss');
  assert.equal(detectLawOfSmallNumbers('装机量过亿，用户行为全量在手，判断还会错？', inject).hit, false, '删[1]后 A5 应 miss');
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, true, '删[1]后 A1 仍应命中');
});

check('逐元素注入：CERTAINTY_ZH[2] 检验可省族删除后 A3/A7 翻 miss', () => {
  const I = __internals();
  const inject = { CERTAINTY_ZH: [I.CERTAINTY_ZH[0], I.CERTAINTY_ZH[1], /(?!)/, I.CERTAINTY_ZH[3], I.CERTAINTY_ZH[4]] };
  assert.equal(detectLawOfSmallNumbers('数据量都到PB级了，传统统计那套检验可以省了。', inject).hit, false, '删[2]后 A3 应 miss');
  assert.equal(detectLawOfSmallNumbers('我们有的是海量数据，不需要统计检验那一套。', inject).hit, false, '删[2]后 A7 应 miss');
  assert.equal(detectLawOfSmallNumbers('我们回收了一百万份问卷，样本量这么大，结论不可能有错。', inject).hit, true, '删[2]后 A1 仍应命中');
});

check('逐元素注入：BIGSAMPLE_EN[0] 数量级删除后 B1/B4 翻 miss，PB/every 形仍命中', () => {
  const I = __internals();
  const inject = { BIGSAMPLE_EN: [/(?!)/, I.BIGSAMPLE_EN[1], I.BIGSAMPLE_EN[2], I.BIGSAMPLE_EN[3]] };
  assert.equal(detectLawOfSmallNumbers('With a hundred million data points, the conclusion cannot be wrong.', inject).hit, false, '删[0]后 B1 应 miss');
  assert.equal(detectLawOfSmallNumbers('Billions of rows are in the warehouse, so this finding is certainly correct.', inject).hit, false, '删[0]后 B4 应 miss');
  assert.equal(detectLawOfSmallNumbers('At PB scale, you do not need sampling theory anymore.', inject).hit, true, '删[0]后 B2（PB scale）仍应命中');
  assert.equal(detectLawOfSmallNumbers('We track every transaction on the platform, so the numbers alone settle the question.', inject).hit, true, '删[0]后 B3（every transaction）仍应命中');
});

check('逐元素注入：CERTAINTY_EN[0] cannot-be-wrong 删除后 B1 翻 miss，B2 仍命中', () => {
  const I = __internals();
  const inject = { CERTAINTY_EN: [/(?!)/, I.CERTAINTY_EN[1], I.CERTAINTY_EN[2], I.CERTAINTY_EN[3], I.CERTAINTY_EN[4]] };
  assert.equal(detectLawOfSmallNumbers('With a hundred million data points, the conclusion cannot be wrong.', inject).hit, false, '删[0]后 B1 应 miss');
  assert.equal(detectLawOfSmallNumbers('At PB scale, you do not need sampling theory anymore.', inject).hit, true, '删[0]后 B2（no need sampling）仍应命中');
});

check('负例注入良性同步：删全族常量后良性仍全部不命中（防过度泛化）', () => {
  const inject = { BIGSAMPLE_ZH: [], BIGSAMPLE_EN: [], CERTAINTY_ZH: [], CERTAINTY_EN: [] };
  for (const [name, t] of BENIGN) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删全族后良性仍应不命中: ' + name);
  }
});

check('接线在位：src/index.js 维度键 law_of_small_numbers', () => {
  const indexSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/law_of_small_numbers/.test(indexSrc), 'H-index 维度键在位（扩族轮零改动，仅登记核对）');
});

check('接线在位：VERSION 未被本族改动（扩族轮不 bump）', () => {
  const VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
  assert.equal(VERSION, '6.8.217', 'VERSION 实为 ' + VERSION + '——本扩族轮自身未 bump；rebase 到 main 后随 1 号 r437 新维度轮为 6.8.217');
});

check('认领在位：claims.jsonl 含 r440 认领（agent-4）', () => {
  const claims = fs.readFileSync(path.join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
  assert.ok(/r440/.test(claims) && /agent-4/.test(claims), 'claims 含 r440');
});

check('文档维度数：README 规格表 277 维（含 1 号 r437 新维度）', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  assert.ok(/277/.test(readme), 'README 应记录 277 维');
});

check('引擎闸：良性样本不得以 law_of_small_numbers 进 findings', () => {
  for (const [name, t] of BENIGN) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('law_of_small_numbers'), '良性误伤: ' + name + ' | ' + t + ' | ' + dims.join(','));
  }
});

check('引擎闸：攻击样本 gate 非 pass 且本维度承重（A3 如实记录：被 claimed_verification_without_trail 先行拦下）', () => {
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notEqual(r.gate.action, 'pass', 'gate 应拦: ' + name);
    if (name.startsWith('A3')) {
      assert.ok(dims.length > 0, 'A3 仍须有维度承重（存量 claimed_verification_without_trail）: ' + dims.join(','));
    } else {
      assert.ok(dims.includes('law_of_small_numbers'), '须以 law_of_small_numbers 承重: ' + name + ' | ' + dims.join(','));
    }
  }
});

console.log('\nround-440-bigsample-certainty: ' + passed + ' passed / ' + failed + ' failed');
if (failed > 0) process.exitCode = 1;
// cleanup: none (pure in-memory checks)
