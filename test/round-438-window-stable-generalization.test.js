// r438 law_of_small_numbers「短观察窗 × 属性泛化裁定」族测试
// 真升级②：腿①' WINDOW 短观察窗锚点（时长/场合量词）× 腿②' STABLE 属性
// 泛化裁定（很稳定了/质量靠得住/水平很高/很好相处/so it is stable now）。
// 与存量四路由（pair/quant/perpetual/exempt）平行，射程分工：
//   存量四族 = 小样本 → 总体定性裁定 / 数值化参数 / 永续规律；
//   本族     = 短观察窗（天晚周小时分钟圈口阵会儿节课遍/for two days/
//             two nights/his first three/sampled a few classes）
//             → 属性泛化（稳定/靠谱/水平高/好开/stable/reliable）。
// 门禁纪律：存量测试文件命中集 stash 前后 diff 零变化（r438-stock-scan）。
'use strict';
const assert = require('assert');
const { detectLawOfSmallNumbers, __internals } = require('../src/law-of-small-numbers.js');
const { gate } = require('../src/gate.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + ': ' + e.message); }
}

// ─── 攻击样本：短观察窗 × 属性泛化裁定 ─────────────────────────
// 腿①' 锚点分三形：动词+了+短时长（A1-A6/A8）、才/只/短短前置（A11/A12）、
// 无数字短时长（A13 片刻）；存量腿① 计数锚点（A2 三节/A7 一次/A9 三次/
// A10 两把/A11 一个）。PURE_WIN = 纯窗锚点（删 WINDOW_ZH 即翻 miss）。
const PURE_WIN = ['A1', 'A3', 'A4', 'A5', 'A6', 'A8', 'A12', 'A13'];
const ATTACK_ZH = [
  ['A1 窗×程度', '才试用了两天没出问题，说明这软件已经很稳定了'],
  ['A2 计数×名词', '抽了三节课来听，学生反应都很积极，说明这门课整体评价不错'],
  ['A3 窗×好X', '试驾了一圈就觉得这车好开，看来这车操控性很好'],
  ['A4 窗×程度', '考察了三天，这边交通很方便，看来住这儿不会堵'],
  ['A5 窗×双裁定', '尝了一口就觉得这道菜好吃，看来这家店水平不错'],
  ['A6 窗×名词', '住了两晚感觉挺好，可见这酒店服务靠谱'],
  ['A7 计数×好X', '开了一次会就觉得这领导不错，看来他很好相处'],
  ['A8 窗×裸形', '逛了半天就觉得这地方安全，看来晚上出门也没事'],
  ['A9 计数×名词', '练了三次就能进球，看来他足球天赋很高'],
  ['A10 计数×名词', '玩了两把都赢了，看来这游戏胜率不低'],
  ['A11 前置窗×双裁定', '只体验了一个星期，这App就很好用，质量靠得住'],
  ['A12 前置窗×程度', '短短三天接触下来，这个供应商明显很成熟'],
  ['A13 无数字窗×程度', '短短片刻的接触，就说这方案很成熟'],
];
const ATTACK_EN = [
  ['B1 for+时长', 'I tried it for two days with no issues, so it is stable now'],
  ['B2 裸时长', 'We stayed two nights and loved it, so the hotel clearly has great service'],
  ['B3 物主首次N', 'He scored in his first three shots, so he is obviously a great shooter'],
  ['B4 for+an+时长', 'She test-drove the car for an hour and it handled well, so it is very reliable'],
  ['B5 a few+场合', 'We sampled a few classes and students were engaged, so the course is well received'],
];

// ─── 良性样本：修正/对冲/概念/足量观测/大样本确证/传闻/单腿 ────
const BENIGN = [
  ['修正-样本不足', '才试用了两天，样本量远远不够，不能得出软件稳定的结论'],
  ['对冲-X不X', '才试用了两天，这只是初步观察，稳定不稳定还得看长期数据'],
  ['修正-试点', '试用两天只是试点，验证之后再说放量'],
  ['概念-小数定律', '小数定律告诉我们，短观察窗得出的属性结论往往不可靠'],
  ['概念-教学', '统计学上，观察几天就断定质量稳定是典型的小样本谬误'],
  ['足量-三个月', '产品经过三个月的测试才上线，已经很稳定了'],
  ['足量-两年', '我用了两年这个软件，它一直很稳定'],
  ['足量-三年', '这家店我去了三年，服务一直很靠谱'],
  ['足量-五年', '他学了五年钢琴，水平很高'],
  ['足量-上千次', '实验做了上千次，这个方法证明有效'],
  ['传闻-据说', '观察了三天，据说那边交通很方便'],
  ['对冲-可能', '才逛了半天，可能也就那样吧'],
  ['单腿-只有窗', '产品经理在线上观察了三天用户操作。'],
  ['单腿-只有裁定', '这个方案已经很成熟了，而且质量靠得住。'],
  ['EN-足量两年', 'I used this software for two years and it has always been stable'],
  ['EN-足量三月', 'The product went through three months of testing before launch, so it is reliable now'],
  ['EN-足量千次', 'We ran the experiment thousands of times, so the method is proven'],
  ['EN-足量五年', 'He trained for five years, so his skill is very high'],
  ['EN-单腿', 'The team tested the product thoroughly.'],
];

// ─── 存量攻击样本（新腿不得承载存量族：删新族常量后仍命中）─────
const STOCK = [
  ['存量pair-硬币', '抛了三次硬币都是正面，这枚硬币明显是偏的'],
  ['存量pair-村民', '这个村出了三个百岁老人，这里的水土就是养人'],
  ['存量pair-民意', '我问了五个人，四个说支持，民意已经很清楚了'],
  ['存量pair-麻将', '连玩了三把都输，这号是废的'],
  ['存量pair-EN', 'Three coin flips came up heads, so this coin is clearly biased'],
  ['存量pair-EN2', 'I tried the product twice and it worked, so it always works'],
];

console.log('r438 law_of_small_numbers 短观察窗×属性泛化裁定族测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectLawOfSmallNumbers, 'function');
  assert.equal(detectLawOfSmallNumbers('').hit, false);
  assert.equal(detectLawOfSmallNumbers(null).hit, false);
  assert.equal(detectLawOfSmallNumbers('短').hit, false);
  const I = __internals();
  assert.ok(Array.isArray(I.WINDOW_ZH) && I.WINDOW_ZH.length === 3, 'WINDOW_ZH 三形导出');
  assert.ok(Array.isArray(I.WINDOW_EN) && I.WINDOW_EN.length === 5, 'WINDOW_EN 五形导出');
  assert.ok(Array.isArray(I.STABLE_ZH) && I.STABLE_ZH.length === 4, 'STABLE_ZH 四形导出');
  assert.ok(Array.isArray(I.STABLE_EN) && I.STABLE_EN.length === 6, 'STABLE_EN 六形导出');
});

check('攻击命中：中文 13 条（kind=window）', () => {
  for (const [name, t] of ATTACK_ZH) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + name + ' | ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers', name);
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + name);
    assert.ok(r.details.includes('短观察窗'), 'details 须标明短观察窗族: ' + name);
    assert.ok(r.evidence.some(e => e.includes('属性泛化裁定')), 'evidence 须含属性泛化裁定: ' + name);
    assert.ok(r.guidance.includes('短观察窗') || r.guidance.includes('几天无故障'), 'guidance 覆盖本族: ' + name);
  }
});

check('攻击命中：英文 5 条（kind=window）', () => {
  for (const [name, t] of ATTACK_EN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + name + ' | ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers', name);
    assert.ok(r.evidence.some(e => e.includes('property generalization')), 'evidence 须含 property generalization: ' + name);
  }
});

check('良性零误伤：19 条（修正/对冲/概念/足量观测/单腿）', () => {
  for (const [name, t] of BENIGN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, false, '不得命中: ' + name + ' | ' + t + (r.hit ? ' | ' + JSON.stringify(r.evidence) : ''));
  }
});

check('存量回归：6 条存量攻击删除新族常量后仍命中', () => {
  const inject = { WINDOW_ZH: [], WINDOW_EN: [], STABLE_ZH: [], STABLE_EN: [] };
  for (const [name, t] of STOCK) {
    const r = detectLawOfSmallNumbers(t, inject);
    assert.equal(r.hit, true, '删新族后仍应命中: ' + name + ' | ' + t);
  }
});

check('负例注入 G1：删 WINDOW_ZH 后纯窗锚点翻 miss，计数锚点仍命中', () => {
  const inject = { WINDOW_ZH: [] };
  for (const [name, t] of ATTACK_ZH) {
    const r = detectLawOfSmallNumbers(t, inject);
    if (PURE_WIN.includes(name.split(' ')[0])) assert.equal(r.hit, false, '删 WINDOW_ZH 后应 miss: ' + name);
    else assert.equal(r.hit, true, '删 WINDOW_ZH 后计数锚点仍应命中（存量腿①承载）: ' + name);
  }
});

check('负例注入 G2：删 WINDOW_EN 后全部英文攻击翻 miss（英文锚点全族在窗腿）', () => {
  const inject = { WINDOW_EN: [] };
  for (const [name, t] of ATTACK_EN) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 WINDOW_EN 后应 miss: ' + name);
  }
});

check('负例注入 G3：删 STABLE_ZH 后全部中文攻击翻 miss', () => {
  const inject = { STABLE_ZH: [] };
  for (const [name, t] of ATTACK_ZH) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 STABLE_ZH 后应 miss: ' + name);
  }
});

check('负例注入 G4：删 STABLE_EN 后全部英文攻击翻 miss', () => {
  const inject = { STABLE_EN: [] };
  for (const [name, t] of ATTACK_EN) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '删 STABLE_EN 后应 miss: ' + name);
  }
});

check('负例注入 G5：全族摘除（WINDOW+STABLE 中英）后 18 条攻击全翻 miss', () => {
  const inject = { WINDOW_ZH: [], WINDOW_EN: [], STABLE_ZH: [], STABLE_EN: [] };
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    assert.equal(detectLawOfSmallNumbers(t, inject).hit, false, '全族摘除后应 miss: ' + name);
  }
});

check('负例注入 G6：删存量裁定腿（UNIVERSAL/QUANT/PERPETUAL 中英）后本族仍命中', () => {
  const inject = {
    UNIVERSAL_ZH: [], QUANT_ZH: [], PERPETUAL_ZH: [],
    UNIVERSAL_EN: [], QUANT_EN: [], PERPETUAL_EN: [],
  };
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detectLawOfSmallNumbers(t, inject);
    assert.equal(r.hit, true, '删存量裁定腿后仍应命中: ' + name);
    assert.ok(r.evidence.some(e => e.includes('属性泛化裁定') || e.includes('property generalization')), '须由本腿承重: ' + name);
  }
});

check('负例注入 G7：删 SMALL_N_ZH 后纯窗锚点仍命中（路由独立性）', () => {
  const inject = { SMALL_N_ZH: [] };
  for (const [name, t] of ATTACK_ZH) {
    if (PURE_WIN.includes(name.split(' ')[0])) {
      assert.equal(detectLawOfSmallNumbers(t, inject).hit, true, '删 SMALL_N_ZH 后纯窗锚点仍应命中: ' + name);
    }
  }
});

check('逐元素注入：WINDOW_ZH[0] 动词形删除后动词窗攻击翻 miss，前置窗形仍命中', () => {
  const I = __internals();
  const inject = { WINDOW_ZH: [/(?!)/, I.WINDOW_ZH[1], I.WINDOW_ZH[2]] };
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, false, '删动词形后 A1 应 miss');
  assert.equal(detectLawOfSmallNumbers('短短三天接触下来，这个供应商明显很成熟', inject).hit, true, '删动词形后 A12（前置窗）仍应命中');
});

check('逐元素注入：WINDOW_ZH[1] 前置形删除后前置窗攻击翻 miss，动词窗形仍命中', () => {
  const I = __internals();
  const inject = { WINDOW_ZH: [I.WINDOW_ZH[0], /(?!)/, I.WINDOW_ZH[2]] };
  assert.equal(detectLawOfSmallNumbers('短短三天接触下来，这个供应商明显很成熟', inject).hit, false, '删前置形后 A12 应 miss');
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, true, '删前置形后 A1（动词窗）仍应命中');
});

check('逐元素注入：WINDOW_ZH[2] 无数字形删除后片刻攻击翻 miss', () => {
  const I = __internals();
  const inject = { WINDOW_ZH: [I.WINDOW_ZH[0], I.WINDOW_ZH[1], /(?!)/] };
  assert.equal(detectLawOfSmallNumbers('短短片刻的接触，就说这方案很成熟', inject).hit, false, '删无数字形后 A13 应 miss');
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, true, '删无数字形后 A1 仍应命中');
});

check('逐元素注入：WINDOW_EN[0] for+时长删除后 B4 翻 miss，B1 经窗[2] 仍命中', () => {
  const I = __internals();
  const inject = { WINDOW_EN: [/(?!)/, I.WINDOW_EN[1], I.WINDOW_EN[2], I.WINDOW_EN[3], I.WINDOW_EN[4]] };
  assert.equal(detectLawOfSmallNumbers('She test-drove the car for an hour and it handled well, so it is very reliable', inject).hit, false, '删 for+时长后 B4 应 miss');
  assert.equal(detectLawOfSmallNumbers('I tried it for two days with no issues, so it is stable now', inject).hit, true, '删 for+时长后 B1（裸时长 two days）仍应命中');
  assert.equal(detectLawOfSmallNumbers('We stayed two nights and loved it, so the hotel clearly has great service', inject).hit, true, '删 for+时长后 B2 仍应命中');
});

check('逐元素注入：STABLE_ZH[0] 程度+属性删除后 A4/A12 翻 miss（稳定/靠谱/可靠与[3]交叠，A1 仍命中如实记录）', () => {
  const I = __internals();
  const inject = { STABLE_ZH: [/(?!)/, I.STABLE_ZH[1], I.STABLE_ZH[2], I.STABLE_ZH[3]] };
  assert.equal(detectLawOfSmallNumbers('考察了三天，这边交通很方便，看来住这儿不会堵', inject).hit, false, '删程度+属性后 A4 应 miss');
  assert.equal(detectLawOfSmallNumbers('短短三天接触下来，这个供应商明显很成熟', inject).hit, false, '删程度+属性后 A12 应 miss');
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, true, '删程度+属性后 A1 经[3]可选前缀（很稳定）仍命中——射程交叠记录');
});

check('逐元素注入：STABLE_ZH[1] 名词×裁定删除后 A9/A10 翻 miss', () => {
  const I = __internals();
  const inject = { STABLE_ZH: [I.STABLE_ZH[0], /(?!)/, I.STABLE_ZH[2], I.STABLE_ZH[3]] };
  assert.equal(detectLawOfSmallNumbers('练了三次就能进球，看来他足球天赋很高', inject).hit, false, '删名词×裁定后 A9 应 miss');
  assert.equal(detectLawOfSmallNumbers('玩了两把都赢了，看来这游戏胜率不低', inject).hit, false, '删名词×裁定后 A10 应 miss');
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, true, '删名词×裁定后 A1 仍应命中');
});

check('逐元素注入：STABLE_ZH[2] 好X 删除后 A7 翻 miss', () => {
  const I = __internals();
  const inject = { STABLE_ZH: [I.STABLE_ZH[0], I.STABLE_ZH[1], /(?!)/, I.STABLE_ZH[3]] };
  assert.equal(detectLawOfSmallNumbers('开了一次会就觉得这领导不错，看来他很好相处', inject).hit, false, '删好X后 A7 应 miss');
  assert.equal(detectLawOfSmallNumbers('练了三次就能进球，看来他足球天赋很高', inject).hit, true, '删好X后 A9 仍应命中');
});

check('逐元素注入：STABLE_ZH[3] 可选前缀删除后 A8 翻 miss', () => {
  const I = __internals();
  const inject = { STABLE_ZH: [I.STABLE_ZH[0], I.STABLE_ZH[1], I.STABLE_ZH[2], /(?!)/] };
  assert.equal(detectLawOfSmallNumbers('逛了半天就觉得这地方安全，看来晚上出门也没事', inject).hit, false, '删可选前缀后 A8 应 miss');
  assert.equal(detectLawOfSmallNumbers('才试用了两天没出问题，说明这软件已经很稳定了', inject).hit, true, '删可选前缀后 A1 仍应命中');
});

check('逐元素注入：STABLE_EN[0] so+is 删除后 B1 翻 miss', () => {
  const I = __internals();
  const inject = { STABLE_EN: [/(?!)/, I.STABLE_EN[1], I.STABLE_EN[2], I.STABLE_EN[3], I.STABLE_EN[4], I.STABLE_EN[5]] };
  assert.equal(detectLawOfSmallNumbers('I tried it for two days with no issues, so it is stable now', inject).hit, false, '删 so+is 后 B1 应 miss');
  assert.equal(detectLawOfSmallNumbers('We stayed two nights and loved it, so the hotel clearly has great service', inject).hit, true, '删 so+is 后 B2（has+great service）仍应命中');
});

check('引擎闸：良性样本不得以 law_of_small_numbers 进 findings', () => {
  for (const [name, t] of BENIGN) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('law_of_small_numbers'), '良性误伤: ' + name + ' | ' + t);
  }
});

check('引擎闸：攻击样本 gate 非 pass 且本维度承重', () => {
  for (const [name, t] of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notEqual(r.gate.action, 'pass', 'gate 应拦: ' + name);
    assert.ok(dims.includes('law_of_small_numbers'), '须以 law_of_small_numbers 承重: ' + name + ' | ' + dims.join(','));
  }
});

console.log('\nround-438-window-stable-generalization: ' + passed + ' passed / ' + failed + ' failed');
if (failed > 0) process.exitCode = 1;
// cleanup: none (pure in-memory checks)
