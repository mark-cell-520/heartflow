'use strict';
/**
 * test/round-428-broken-window-no-break-no-build.test.js
 * —— r428 轮测：broken_window 第 218 维「不破不立/腾笼换鸟」措辞家族（真升级②）
 *
 * 覆盖：
 *   A 模块层攻击承重（中英 12 条全命中，含 evidence 归因）
 *   B 良性零误伤（16 条模块层零命中 + gate findings 不含 broken_window）
 *   C 精度边界锁（日常连接形不收/中性顺承不收/裸工程动词不收/裸涨租不收/
 *     裸出清不收/豁免覆盖新族）
 *   D 负例注入（六个新族常量逐一删条翻转 + 存量路由加性证明）
 *   E 存量四场景不回归（既有攻击仍命中/既有良性仍干净/既有注入仍翻转/
 *     既有边界锁仍成立）
 *   F gate 端到端（攻击非 pass 且 broken_window 承重/良性不误伤）
 *   G 接线零改动 + 新族常量导出
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const {
  detectBrokenWindow,
  __internals,
} = require('../src/broken-window-fallacy.js');

const DIM = 'broken_window';

// ── A: 模块层攻击样本（新族 12 条：ZH 7 + EN 5）──────────────────
function attackCases() {
  return [
    // 工程重构场域
    '这套老代码早就该推倒重来了，重构完技术债出清，团队反而能轻装前行',
    '这些旧数据干脆全删了，清空存储才能放开手脚上新架构',
    // 资产处置场域
    '旧厂区拆了反而是好事，地皮腾出来才能盖新园区',
    '这批设备提前报废不一定是坏事，换新之后产能瓶颈顺势打破',
    '老店面一把火烧了反倒是件好事，隔壁商铺的租金跟着涨起来了',
    // 事故红利化
    '病毒把旧系统搞瘫了，团队甩掉了历史包袱，反倒是件好事',
    '烧掉旧图纸反而干净，设计团队不用再被历史兼容性拖着走',
    // EN
    'The legacy monolith should be torn down and rewritten; clearing the technical debt lets the team move fast.',
    'Demolishing the old plant is a blessing in disguise, which frees up the land for the new campus.',
    'The crash wiped out the old database, which forced the migration we had been avoiding.',
    'Scrapping the aging machines is not all bad; the upgrade budget finally gets spent.',
    'Let the old system rot; its collapse will justify the rebuild we always wanted.',
  ];
}

// ── B: 良性样本（新族易误伤形 16 条）────────────────────────────
function benignCases() {
  return [
    '老代码推倒重来风险很高，需要先做架构评审和灰度方案',
    '旧厂区拆除涉及安置补偿，要按征迁流程依法推进',
    '设备报废要评估剩余价值和处置成本，不能只看换新收益',
    '旧系统重构是因为技术债已经阻塞迭代，这是工程判断不是破坏红利',
    '商铺租金上涨是市场供需结果，和火灾没有直接关系',
    '清理旧数据要先做备份和归档，防止误删重要记录',
    'Rewriting the monolith is risky; we need a migration plan first.',
    'Demolition must follow the regulatory approval process.',
    'The database crash was an incident; recovery is the priority, not the rebuild.',
    'Scrapping the machines requires a cost-benefit analysis.',
    'Letting a system rot is not a strategy; we should fix the blockers.',
    '烧毁图纸属于事故，要追责和复盘，不是好事',
    // 存量边界锁样本复用（防本族踩线）
    '市场竞争淘汰落后产能，促进了产业升级和技术迭代。',
    '疫情初期，口罩产能迅速扩大，带动了上游原料消费。',
    '地震后，政府将保障受灾群众的就业安置。',
    '洪水冲毁了无数房屋，造成重大人员伤亡和财产损失。',
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

console.log('[broken_window 不破不立/腾笼换鸟族轮测 r428]');

// ═══ A 模块层攻击承重 ═══
check('A: 攻击样本 12/12 模块层命中且字段完整', () => {
  for (const t of attackCases()) {
    const r = detectBrokenWindow(t);
    assert.strictEqual(r.hit, true, `hit=false: "${t.slice(0, 42)}"`);
    assert.strictEqual(r.dimension, DIM);
    assert.ok(r.severity >= 60 && r.severity <= 70, `severity 越界: ${r.severity}`);
    assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 缺失');
    assert.ok(typeof r.details === 'string' && (r.details.includes('破窗谬误') || r.details.includes('broken window fallacy')), 'details 缺失');
  }
});

check('A2: 首条样本 evidence 归因到新族双腿（推倒重来 → 技术债出清）', () => {
  const r = detectBrokenWindow('这套老代码早就该推倒重来了，重构完技术债出清，团队反而能轻装前行');
  assert.ok(r.evidence[0].includes('推倒重来'), `evidence 缺破坏腿: ${r.evidence[0]}`);
  assert.ok(r.evidence[0].includes('技术债出清'), `evidence 缺收益腿: ${r.evidence[0]}`);
});

// ═══ B 良性零误伤 ═══
// 注：「疫情初期，口罩产能迅速扩大，带动了上游原料消费。」在 gate 层有
// **存量** broken_window 误报（HEAD~1 基线同样 verify+承重，见
// coordination/agent4/probes/r428-baseline-gate-check.output.txt，属存量
// 路由在 gate 归一化文本上的历史误伤，非本族引入）：该句只锁模块层
// 零命中，gate 层不锁；其余 15 条锁 gate 不含本维度。
const BEN_GATE_EXEMPT = '疫情初期，口罩产能迅速扩大，带动了上游原料消费。';

check('B: 良性样本 16/16 模块层零命中', () => {
  for (const t of benignCases()) {
    const r = detectBrokenWindow(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t.slice(0, 42)}"`);
  }
});

check('B2: 良性样本 15/15 gate 不含本维度（存量 gate 误报句除外，见上注）', () => {
  for (const t of benignCases()) {
    if (t === BEN_GATE_EXEMPT) continue;
    const g = checkOutput(t);
    assert.ok(!dimensionFired(g), `良性句被本维度承重: "${t.slice(0, 42)}"`);
  }
});

// ═══ C 精度边界锁 ═══
check('C1: 日常连接形（倒也干脆/也好）不入腿③ → 不判（设计取舍）', () => {
  assert.strictEqual(detectBrokenWindow('病毒把旧系统搞瘫了倒也干脆，团队终于下决心重构，甩掉了历史包袱').hit, false, '倒也干脆形被误判');
  assert.strictEqual(detectBrokenWindow('老店面一把火烧了也好，隔壁商铺的租金跟着涨起来了').hit, false, '也好形被误判');
});

check('C2: 中性顺承（事故之后正好赶上更新换代）不判', () => {
  assert.strictEqual(detectBrokenWindow('事故之后，正好赶上设备更新换代，产能顺势打破。').hit, false, '中性顺承句被误判');
});

check('C3: 裸工程动词（重构/重写）不入腿① → 不判', () => {
  assert.strictEqual(detectBrokenWindow('团队重构了核心模块，代码结构更清晰了。').hit, false, '裸重构句被误判');
});

check('C4: 裸涨租（无跟着/随之共现）不入腿② → 不判', () => {
  assert.strictEqual(detectBrokenWindow('商铺租金上涨是市场供需结果，和火灾没有直接关系。').hit, false, '裸涨租句被误判');
});

check('C5: 裸出清（库存季末出清）不入腿② → 不判', () => {
  assert.strictEqual(detectBrokenWindow('季末库存出清是正常商业行为，回笼资金再备货。').hit, false, '裸出清句被误判');
});

check('C6: 豁免族覆盖新族（指出错误正是判别动作）', () => {
  assert.strictEqual(detectBrokenWindow('说事故让我们因祸得福，忽略了隐患修复的成本，净效应可能为负。').hit, false, '纠正句被误判');
});

// ═══ D 负例注入（新族六常量逐一删条）══════
const NEVER = /(?!x)x/;

check('D1: GAIN_ZH_R428 抹除后中文攻击 7/7 翻转', () => {
  for (const t of attackCases().slice(0, 1).concat(attackCases().slice(1, 7))) {
    const r = detectBrokenWindow(t, { GAIN_ZH_R428: [] });
    assert.strictEqual(r.hit, false, `收益腿中文族抹除后仍命中: "${t.slice(0, 40)}"`);
  }
});

check('D2: GAIN_EN_R428 抹除后英文攻击 5/5 翻转', () => {
  for (const t of attackCases().slice(7, 12)) {
    const r = detectBrokenWindow(t, { GAIN_EN_R428: [] });
    assert.strictEqual(r.hit, false, `收益腿英文族抹除后仍命中: "${t.slice(0, 40)}"`);
  }
});

check('D3: DESTRUCT_ZH_R428 抹除后新破坏动词攻击翻转、存量破坏词样本不翻（隔离证明）', () => {
  // 新破坏动词（推倒重来/拆了/搞瘫/一把火烧/全删/清空/烧掉）→ 翻
  for (const t of [
    '这套老代码早就该推倒重来了，重构完技术债出清，团队反而能轻装前行',
    '旧厂区拆了反而是好事，地皮腾出来才能盖新园区',
    '病毒把旧系统搞瘫了，团队甩掉了历史包袱，反倒是件好事',
    '老店面一把火烧了反倒是件好事，隔壁商铺的租金跟着涨起来了',
    '这些旧数据干脆全删了，清空存储才能放开手脚上新架构',
    '烧掉旧图纸反而干净，设计团队不用再被历史兼容性拖着走',
  ]) {
    const r = detectBrokenWindow(t, { DESTRUCT_ZH_R428: [] });
    assert.strictEqual(r.hit, false, `新破坏动词抹除后仍命中: "${t.slice(0, 40)}"`);
  }
  // 存量破坏词（报废）× 新收益族仍判（证明存量破坏表未被污染、新族可经存量词入场）
  assert.strictEqual(
    detectBrokenWindow('这批设备提前报废不一定是坏事，换新之后产能瓶颈顺势打破', { DESTRUCT_ZH_R428: [] }).hit,
    true, '存量破坏词×新收益族样本被误翻（存量表被污染）'
  );
});

check('D4: DESTRUCT_EN_R428 抹除后新破坏动词攻击翻转、存量破坏词样本不翻', () => {
  for (const t of [
    'The legacy monolith should be torn down and rewritten; clearing the technical debt lets the team move fast.',
    'Let the old system rot; its collapse will justify the rebuild we always wanted.',
  ]) {
    const r = detectBrokenWindow(t, { DESTRUCT_EN_R428: [] });
    assert.strictEqual(r.hit, false, `新破坏动词抹除后仍命中: "${t.slice(0, 40)}"`);
  }
  for (const t of [
    'Demolishing the old plant is a blessing in disguise, which frees up the land for the new campus.',
    'The crash wiped out the old database, which forced the migration we had been avoiding.',
    'Scrapping the aging machines is not all bad; the upgrade budget finally gets spent.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t, { DESTRUCT_EN_R428: [] }).hit, true, `存量破坏词样本被误翻: "${t.slice(0, 40)}"`);
  }
});

check('D5: LINK_ZH_R428 抹除后新连接形攻击翻转、存量连接形样本不翻', () => {
  assert.strictEqual(
    detectBrokenWindow('这批设备提前报废不一定是坏事，换新之后产能瓶颈顺势打破', { LINK_ZH_R428: NEVER }).hit,
    false, '新连接形（不一定是坏事）抹除后仍命中'
  );
  // 存量连接形（反而/反倒/才能）承重的样本不翻
  for (const t of [
    '这套老代码早就该推倒重来了，重构完技术债出清，团队反而能轻装前行',
    '这些旧数据干脆全删了，清空存储才能放开手脚上新架构',
  ]) {
    assert.strictEqual(detectBrokenWindow(t, { LINK_ZH_R428: NEVER }).hit, true, `存量连接形样本被误翻: "${t.slice(0, 40)}"`);
  }
});

check('D6: LINK_EN_R428 抹除后新连接形攻击翻转、存量连接形（which）样本不翻', () => {
  for (const t of [
    'The legacy monolith should be torn down and rewritten; clearing the technical debt lets the team move fast.',
    'Scrapping the aging machines is not all bad; the upgrade budget finally gets spent.',
    'Let the old system rot; its collapse will justify the rebuild we always wanted.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t, { LINK_EN_R428: NEVER }).hit, false, `新连接形抹除后仍命中: "${t.slice(0, 40)}"`);
  }
  for (const t of [
    'Demolishing the old plant is a blessing in disguise, which frees up the land for the new campus.',
    'The crash wiped out the old database, which forced the migration we had been avoiding.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t, { LINK_EN_R428: NEVER }).hit, true, `存量连接形样本被误翻: "${t.slice(0, 40)}"`);
  }
});

check('D7: 六常量全抹后存量路由仍命中（加性证明）', () => {
  const inject = {
    DESTRUCT_ZH_R428: [], DESTRUCT_EN_R428: [],
    GAIN_ZH_R428: [], GAIN_EN_R428: [],
    LINK_ZH_R428: NEVER, LINK_EN_R428: NEVER,
  };
  for (const t of [
    '地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。',
    'The earthquake destroyed the old town, but reconstruction will stimulate demand and boost growth.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t, inject).hit, true, `存量路由被新族摘除误伤: "${t.slice(0, 40)}"`);
  }
});

// ═══ E 存量不回归 ═══
check('E1: 存量攻击样本仍命中', () => {
  for (const t of [
    '地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。',
    '战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位。',
    'The fire razed the district, yet the reconstruction boom will fuel the local economy.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t).hit, true, `存量攻击样本漏判: "${t.slice(0, 40)}"`);
  }
});

check('E2: 存量良性/豁免样本仍零命中', () => {
  for (const t of [
    '破窗效应提示我们：环境中的失序信号如果不及时处理，会诱发更多违法行为。',
    '地震摧毁了老城区，造成重大人员伤亡和财产损失。',
    '基建投资将拉动内需，促进经济增长。',
    'The broken window fallacy, described by Bastiat, mistakes visible spending for net gain.',
    'Broken windows theory argues that repairing broken windows creates jobs and stimulates local demand.',
  ]) {
    assert.strictEqual(detectBrokenWindow(t).hit, false, `存量良性/豁免样本被误判: "${t.slice(0, 40)}"`);
  }
});

check('E3: 存量注入（抹 DESTRUCT_ZH/STIMULUS_ZH/LINK_ZH）仍翻转存量攻击', () => {
  assert.strictEqual(detectBrokenWindow('地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。', { DESTRUCT_ZH: [] }).hit, false, '存量注入①失效');
  assert.strictEqual(detectBrokenWindow('战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位。', { STIMULUS_ZH: [] }).hit, false, '存量注入③失效');
  assert.strictEqual(detectBrokenWindow('地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。', { LINK_ZH: NEVER }).hit, false, '存量注入⑤失效');
});

// ═══ F gate 端到端 ═══
check('F1: gate 层攻击非 pass 且 broken_window 承重（ZH 2 + EN 2）', () => {
  for (const t of [
    '这套老代码早就该推倒重来了，重构完技术债出清，团队反而能轻装前行',
    '旧厂区拆了反而是好事，地皮腾出来才能盖新园区',
    'The legacy monolith should be torn down and rewritten; clearing the technical debt lets the team move fast.',
    'Scrapping the aging machines is not all bad; the upgrade budget finally gets spent.',
  ]) {
    const g = checkOutput(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 仍放行: "${t.slice(0, 40)}"`);
    assert.ok(dimensionFired(g), `findings 不含 broken_window: "${t.slice(0, 40)}"`);
  }
});

check('F2: gate 层良性不误伤（新族良性 4 条 zero-hit 且无本维度）', () => {
  for (const t of [
    '老代码推倒重来风险很高，需要先做架构评审和灰度方案',
    '商铺租金上涨是市场供需结果，和火灾没有直接关系',
    'Rewriting the monolith is risky; we need a migration plan first.',
    'Scrapping the machines requires a cost-benefit analysis.',
  ]) {
    const g = checkOutput(t);
    assert.ok(!dimensionFired(g), `良性句被本维度承重: "${t.slice(0, 40)}"`);
  }
});

// ═══ G 接线零改动 + 导出 ═══
check('G: 新族六常量导出 + detectBrokenWindow 形态', () => {
  assert.strictEqual(typeof detectBrokenWindow, 'function');
  const I = __internals();
  for (const k of ['DESTRUCT_ZH_R428', 'DESTRUCT_EN_R428', 'GAIN_ZH_R428', 'GAIN_EN_R428', 'LINK_ZH_R428', 'LINK_EN_R428']) {
    assert.ok(I[k] != null, `__internals 缺 ${k}`);
  }
  assert.ok(Array.isArray(I.GAIN_ZH_R428) && I.GAIN_ZH_R428.length >= 10, 'GAIN_ZH_R428 族太小');
  assert.ok(Array.isArray(I.GAIN_EN_R428) && I.GAIN_EN_R428.length >= 10, 'GAIN_EN_R428 族太小');
  assert.strictEqual(I.LINK_ZH_R428 instanceof RegExp, true, 'LINK_ZH_R428 应为正则');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
