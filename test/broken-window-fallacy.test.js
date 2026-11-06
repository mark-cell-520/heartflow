'use strict';
/**
 * test/broken-window-fallacy.test.js — 「破窗谬误」维度单测（r230，agent-4）
 *
 * 模块 src/broken-window-fallacy.js 为 provisional 未接线维度（接线规格见
 * coordination/reports/r230-dimension-agent4.md §五，由 1 号补全）。
 * 因此本测试只断言**模块级行为**与**未来安全的良性 gate 断言**：
 *   · 攻击句：模块 hit=true（接线后这些句子的 gate.action 才翻转，
 *     此处不断言 engine action——那会在接线后变红）；
 *   · 良性句：模块 hit=false 且 checkOutput 的 findings 不含
 *     broken_window——该断言在接线后依然有效（接线后若干预就是
 *     本测试的价值）。
 *
 * 覆盖：
 *   1. 攻击命中（ZH 14 + EN 10）——hit=true、score、字段完整
 *   2. 良性零误伤（理论同名 2 + 纯破坏 2 + 一般经济 4）
 *   3. 豁免族（认识论纠正 4 + 计入机会成本的双边分析 3 + 教科书 2）
 *   4. 边界锁（无收益腿 / 无破坏腿 / 有双腿无连接 / 政策「将」字窗 /
 *      计划性替换「淘汰」/ 混排双跑 / 加分档）
 *   5. 负例注入（八组常量替换 → 守卫必须变红）
 *   6. 模块导出与短文本/空输入
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const {
  detectBrokenWindow,
  __internals,
} = require('../src/broken-window-fallacy.js');

const DIM = 'broken_window';

function attackCases() {
  return [
    // ── 中文：灾害/毁灭事件 × 重置支出收益 × 连接 ──
    '地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。',
    '战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位。',
    '台风过境后，重建需求将带动建材和家电消费，对经济反而是利好。',
    '这次疫情消耗了大量库存，反而刺激了企业扩大生产。',
    '洪水冲毁了无数房屋，灾后重建将带来新一轮投资热潮。',
    '窗户被砸破了必须更换，玻璃工、安装工、厂商都有了生意，这难道不是促进了经济吗？',
    '事故导致设备全部报废，但更新换代反而促进了产业升级。',
    '把旧车砸了买新车，车厂、销售、保险公司都能受益，何乐而不为？',
    '灾害清除了落后产能，经济将轻装上阵。',
    '疫情打乱了全球供应链，但重建库存将提振制造业产出。',
    '大火烧毁了街区，重建工程势必拉动地方 GDP。',
    '饥荒消耗了过量粮食储备，反而刺激了农业再生产和消费。',
    '尽管战争带来了毁灭，但其对军工产业的刺激作用不容忽视，就业数据就是证明。',
    '与其说是灾难，不如说是机遇——重建需求将托举整个产业链。',
    // ── 英文 ──
    'The earthquake destroyed the old town, but reconstruction will stimulate demand and boost growth.',
    'War devastates infrastructure, yet military spending creates millions of jobs.',
    'The hurricane destroyed thousands of homes, but rebuilding will spur construction and consumption.',
    'Breaking a window creates work for the glazier — surely that is good for the economy.',
    'The pandemic wiped out inventories, but restocking will lift manufacturing output.',
    'Destroying old equipment forces replacement purchases that stimulate industry.',
    'The fire razed the district, yet the reconstruction boom will fuel the local economy.',
    'Disasters clear out obsolete capacity, leaving the economy stronger than before.',
    'Wartime destruction may seem bad, but it accelerates innovation and creates jobs.',
    'As devastating as the flood was, the recovery spending will drive GDP growth for years.',
  ];
}

function benignCases() {
  return [
    // ── 破窗效应（犯罪学理论，同名不同物）──
    '破窗效应提示我们：环境中的失序信号如果不及时处理，会诱发更多违法行为。',
    'Broken windows theory holds that visible signs of disorder encourage further crime.',
    // ── 纯破坏陈述（无收益腿）──
    '地震摧毁了老城区，造成重大人员伤亡和财产损失。',
    'The earthquake destroyed the old town and displaced thousands of families.',
    // ── 一般经济表述（无破坏腿）──
    '基建投资将拉动内需，促进经济增长。',
    '消费券刺激了本地消费，带动了服务业复苏。',
    'Government infrastructure spending will boost long-term growth.',
    'Lower interest rates stimulate housing demand across the region.',
  ];
}

function exemptCases() {
  return [
    // ── 认识论纠正（指出本族错误正是判别动作本身）──
    '经济学教科书用破窗谬误说明：灾后重建的可见收益掩盖了被挤占的机会成本。',
    'The broken window fallacy, described by Bastiat, mistakes visible spending for net gain.',
    '说地震能拉动内需是错的——重建资金的机会成本必须计入。',
    'But saying the war created jobs ignores the opportunity cost of military spending.',
    '所谓"灾害促进经济"忽略了重建资金本可用于其他投资，净效应可能为负。',
    'Claiming the war stimulated the economy ignores the opportunity cost of the spending.',
    '认为地震有利于经济增长是典型的破窗谬误，只见重建不见代价。',
    '战争刺激军工的说法站不住脚：同样的资源投到民用部门效率更高。',
    // ── 计入机会成本的双边分析（不可见用途已入账）──
    '灾后重建能拉动短期需求，但资金本可用于基建投资，净效应取决于两者收益之差。',
    'Reconstruction spending may raise demand, but the funds could have built new roads instead.',
    // ── 破窗效应理论转述（含三腿的元话语句）──
    '破窗效应认为，修复破损设施能创造就业、拉动消费。',
    'Broken windows theory argues that repairing broken windows creates jobs and stimulates local demand.',
  ];
}

function dimensionFired(result) {
  return (result.findings || []).some(f => f.dimension === DIM);
}

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' — ' + e.message);
  }
}

console.log('[broken_window 单测 r230]');

check('攻击样本全部命中（ZH 14 + EN 10）且字段完整', () => {
  for (const t of attackCases()) {
    const r = detectBrokenWindow(t);
    assert.strictEqual(r.hit, true, `hit=false: "${t.slice(0, 40)}"`);
    assert.ok(r.score >= 0.6 && r.score <= 1, `score 越界: ${r.score}`);
    assert.strictEqual(r.dimension, DIM, `dimension 名错: ${r.dimension}`);
    assert.ok(typeof r.details === 'string' && r.details.length > 4, 'details 缺失');
    assert.ok(typeof r.guidance === 'string' && r.guidance.length > 10, 'guidance 缺失');
    assert.ok(Array.isArray(r.tags) && r.tags.includes('economics'), 'tags 缺失');
    assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 缺失');
    assert.ok(Number.isInteger(r.severity) && r.severity >= 60, 'severity 非法');
  }
});

check('良性样本零误伤（理论同名 2 + 纯破坏 2 + 一般经济 4）', () => {
  for (const t of benignCases()) {
    const r = detectBrokenWindow(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t.slice(0, 40)}"`);
    // 未来安全断言：接线后本维度也不得承重（接线后若干预在此生效）
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `良性句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('豁免族零误伤（认识论纠正 8 + 双边分析 2 + 理论转述 2）', () => {
  for (const t of exemptCases()) {
    const r = detectBrokenWindow(t);
    assert.strictEqual(r.hit, false, `豁免句 hit=true: "${t.slice(0, 40)}"`);
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `豁免句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('边界锁①：破坏事件在场但无收益断言 → 不判', () => {
  const t = '洪水冲毁了无数房屋，造成重大人员伤亡和财产损失。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '纯破坏句被误判');
});

check('边界锁②：收益断言在场但无破坏事件 → 不判', () => {
  const t = '基建投资将拉动内需，促进经济增长，创造大量就业岗位。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '无破坏腿的经济句被误判');
});

check('边界锁③：双腿在场但无连接成分（逗号串接的市场反应）→ 不判', () => {
  const t = '疫情初期，口罩产能迅速扩大，带动了上游原料消费。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '事实性市场反应被误判（腿③失效）');
});

check('边界锁④：「将」字后 6 字内无收益措辞的政策表述 → 不判', () => {
  const t = '地震后，政府将保障受灾群众的就业安置。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '政策保障句被误判（将字前瞻窗失效）');
});

check('边界锁⑤：计划性替换（市场竞争淘汰落后产能）不入腿① → 不判', () => {
  const t = '市场竞争淘汰落后产能，促进了产业升级和技术迭代。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '计划性替换句被误判');
});

check('边界锁⑥：中英混排双跑，双语签名同时在场计多处', () => {
  const t = '地震摧毁了老城区，但重建工程会拉动内需；the reconstruction will also stimulate demand and boost growth.';
  const r = detectBrokenWindow(t);
  assert.strictEqual(r.hit, true, '混排句未命中');
  assert.ok(r.count >= 2, `混排只计 ${r.count} 处（双语双跑失效）`);
});

check('边界锁⑦：多处签名叠加 → score 升档 0.7', () => {
  const t = '地震摧毁了老城区，但重建工程会拉动内需；战争虽然摧毁了工厂，却刺激了军工生产、创造了就业岗位。';
  const r = detectBrokenWindow(t);
  assert.strictEqual(r.hit, true, '多签名句未命中');
  assert.ok(r.count >= 2, `只计 ${r.count} 处`);
  assert.strictEqual(r.score, 0.7, `加分档失效: score=${r.score}`);
});

check('负例注入①：抹掉 DESTRUCT_ZH 后中文攻击不命中', () => {
  const r = detectBrokenWindow('地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。', {
    DESTRUCT_ZH: [],
  });
  assert.strictEqual(r.hit, false, '腿①中文破坏族抹除后仍命中（配对逻辑失效）');
});

check('负例注入②：抹掉 DESTRUCT_EN 后英文攻击不命中', () => {
  const r = detectBrokenWindow('The earthquake destroyed the old town, but reconstruction will stimulate demand and boost growth.', {
    DESTRUCT_EN: [],
  });
  assert.strictEqual(r.hit, false, '腿①英文破坏族抹除后仍命中（配对逻辑失效）');
});

check('负例注入③：抹掉 STIMULUS_ZH 后中文攻击不命中', () => {
  const r = detectBrokenWindow('战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位。', {
    STIMULUS_ZH: [],
  });
  assert.strictEqual(r.hit, false, '腿②中文收益族抹除后仍命中（配对逻辑失效）');
});

check('负例注入④：抹掉 STIMULUS_EN 后英文攻击不命中', () => {
  const r = detectBrokenWindow('War devastates infrastructure, yet military spending creates millions of jobs.', {
    STIMULUS_EN: [],
  });
  assert.strictEqual(r.hit, false, '腿②英文收益族抹除后仍命中（配对逻辑失效）');
});

check('负例注入⑤：抹掉 LINK_ZH 后中文攻击不命中', () => {
  const r = detectBrokenWindow('地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。', {
    LINK_ZH: /(?!x)x/,
  });
  assert.strictEqual(r.hit, false, '腿③中文连接抹除后仍命中（连接判据失效）');
});

check('负例注入⑥：抹掉 LINK_EN 后英文攻击不命中', () => {
  const r = detectBrokenWindow('The fire razed the district, yet the reconstruction boom will fuel the local economy.', {
    LINK_EN: /(?!x)x/,
  });
  assert.strictEqual(r.hit, false, '腿③英文连接抹除后仍命中（连接判据失效）');
});

check('负例注入⑦：抹掉 EXEMPT_CORRECT_ZH 后纠正句变红（证明豁免承重）', () => {
  const t = '说地震能拉动内需是错的——重建资金的机会成本必须计入。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectBrokenWindow(t, { EXEMPT_CORRECT_ZH: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后纠正句仍未命中（豁免常量空转）');
});

check('负例注入⑧：抹掉 EXEMPT_CORRECT_EN 后纠正句变红（证明豁免承重）', () => {
  const t = 'But saying the war created jobs ignores the opportunity cost of military spending.';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectBrokenWindow(t, { EXEMPT_CORRECT_EN: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后纠正句仍未命中（豁免常量空转）');
});

check('负例注入⑨：抹掉 EXEMPT_THEORY_ZH 后理论转述句变红（证明豁免承重）', () => {
  const t = '破窗效应认为，修复破损设施能创造就业、拉动消费。';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectBrokenWindow(t, { EXEMPT_THEORY_ZH: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后理论句仍未命中（豁免常量空转）');
});

check('负例注入⑩：抹掉 EXEMPT_THEORY_EN 后理论转述句变红（证明豁免承重）', () => {
  const t = 'Broken windows theory argues that repairing broken windows creates jobs and stimulates local demand.';
  assert.strictEqual(detectBrokenWindow(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectBrokenWindow(t, { EXEMPT_THEORY_EN: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后理论句仍未命中（豁免常量空转）');
});

check('模块导出完整（detectBrokenWindow + __internals 关键常量）', () => {
  assert.strictEqual(typeof detectBrokenWindow, 'function');
  const I = __internals();
  for (const k of ['DESTRUCT_ZH', 'DESTRUCT_EN', 'STIMULUS_ZH', 'STIMULUS_EN', 'LINK_ZH', 'LINK_EN',
    'EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN', 'EXEMPT_THEORY_ZH', 'EXEMPT_THEORY_EN']) {
    assert.ok(I[k] != null, `__internals 缺 ${k}`);
  }
});

check('短文本/空输入不崩溃', () => {
  assert.strictEqual(detectBrokenWindow('').hit, false);
  assert.strictEqual(detectBrokenWindow(null).hit, false);
  assert.strictEqual(detectBrokenWindow('地震').hit, false);
  assert.strictEqual(detectBrokenWindow(undefined).hit, false);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
