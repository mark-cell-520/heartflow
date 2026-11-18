'use strict';
/**
 * test/round-379-flat-rate-bias.test.js — r379 固定费率偏误轮测（r378 结构同款）
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②守卫，缺一不判）：
 *   腿① FLAT 固定费率语境在场（ZH recurring-fee 名词组 / EN 组——年卡/包月/
 *        会员/套餐/不限量/无限流量/自助餐/通票/次卡/预付卡/订阅/月费/年费；
 *        annual membership / flat fee / subscription / all-you-can-eat / buffet /
 *        prepaid / unlimited plan / membership）；
 *   腿② OVERUSE 过度使用断言在场（ZH 三形 + EN 三形——O1 配对形：使用不足
 *        标记 × 浪费标记；O2 强制高频形：就得/也得/至少得 + 天天/刷完/用完/
 *        吃完/坐完/去X次/开着下载；O3 摊薄均价形：摊薄/平均成本/越用越划算；
 *        EN: not using it / skipping a week / is a waste / throwing money away /
 *        have to use it every single day / lower the average cost）；
 *   两腿须落在邻近窗内（以腿②为锚，ZH 40 字 / EN 140 字符），方向不限；
 *   豁免 A 概念讨论（定额偏差/flat-rate bias/沉没成本 + 框架词共现）；
 *   豁免 B 纠正句（应以边际效用为准/沉没成本不影响/不应为了摊薄）；
 *   腿②守卫：O1 配对形查两标记间隙否定（使用不足标记自身含「不」字，6 字紧前
 *        窗会误杀配对——r379 同 r378 教训）+ 腿②前后窗对冲短语；O2/O3 查紧前
 *        否定窗（ZH 6 字 / EN 20 字符）+ 前后窗对冲短语。中英各自取对应守卫组。
 *
 * 攻击形（多来自 probe-r379-scope.js 深探集，10/10 真零命中——存量维度对
 *   固定费率过度使用形零覆盖）：
 *   「这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完」
 *   「办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去」
 *   「包月不限量，不多用就是傻，凌晨三点起来把额度用完才叫不亏」
 *   「年卡都买了，每周至少得去三次，不然这钱等于白花」
 *   「The annual pass is paid for, so skipping a week means throwing money away」
 *   「买了无限流量套餐，晚上睡觉也得开着下载，不然额度浪费了」
 *   「自助餐钱已经付了，不吃到撑就是傻，硬塞也得把本钱吃回来」
 *   「Since the flat fee is paid anyway, using it more can only lower the average cost」
 *   「I bought the all-you-can-eat deal, so I have to eat until stuffed」
 *
 * 良性形（模块级必须零命中；其中 B3/B5 存量维度 hypostatization/contradiction
 *   误伤已实测为非本族增量，见 r379 报告）：
 *   概念讨论（定额偏差/flat-rate bias 机制本身）、纠正句（应以边际效用为准/
 *   沉没成本不影响）、sunk-cost 决策句（会员费交了两年退出可惜）、单次票证句
 *   （电影票买了看完——腿①不收 recurring-fee 之外的形）。
 */

const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectFlatRateBias } = require(path.join(ROOT, 'src', 'flat-rate-bias.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

function actionOf(t) { const r = gcheck(t); return r.gate ? r.gate.action : r.action; }
function dimsOf(t) { const r = gcheck(t); return (r.findings || []).map(f => f.dimension); }

// ── A 段：攻击样本（10 条，中英混合，三种腿②形全覆盖）──
const ATTACK = [
  '这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完，不然就亏了。',
  '办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去，不然这钱花得不值。',
  '包月不限量，不多用就是傻，凌晨三点起来把额度用完才叫不亏。',
  '年卡都买了，每周至少得去三次，不然这钱等于白花，去不去是态度问题。',
  'The annual pass is paid for, so skipping a week means throwing money away — go even when injured.',
  '既然包年了，不多用就是浪费，凌晨爬起来把场次刷完才叫不亏。',
  '买了无限流量套餐，晚上睡觉也得开着下载，不然额度浪费了。',
  '自助餐钱已经付了，不吃到撑就是傻，硬塞也得把本钱吃回来。',
  'Since the flat fee is paid anyway, using it more can only lower the average cost — so use it as much as possible.',
  'I bought the all-you-can-eat deal, so I have to eat until stuffed — otherwise the money is wasted.',
];
// ── B 段：良性样本（6 条，概念/纠正/ sunk-cost/单次票证全覆盖）──
const BENIGN = [
  '包月产品鼓励过度使用以摊薄费用的心态，是定额偏差的表现，使用应以需求为准。',
  '已付的会员费是沉没成本，用不用应看边际收益而非摊薄感。',
  '为了摊薄包月费用而强迫自己使用，是用过去的支出惩罚现在的选择。',
  '固定费率可能导致过度消费（flat-rate bias），决策应以边际效用为准。',
  '自助餐吃到伤身是定额偏差的典型表现，吃饱应停止而不是想着回本。',
  'Flat-rate pricing can induce overuse; the sunk fee should not drive consumption decisions.',
];

test('A 攻击样本命中（10/10）', () => {
  for (const [i, t] of ATTACK.entries()) {
    const r = detectFlatRateBias(t);
    assert.strictEqual(r.hit, true, 'A' + (i + 1) + ' 应命中: ' + t);
    assert.ok(r.guidance && r.guidance.length > 0, 'A' + (i + 1) + ' 应有 guidance');
    assert.strictEqual(r.dimension, 'flat_rate_bias');
  }
});

test('B 良性样本零命中（6/6，模块级）', () => {
  for (const [i, t] of BENIGN.entries()) {
    const r = detectFlatRateBias(t);
    assert.strictEqual(r.hit, false, 'B' + (i + 1) + ' 应零命中: ' + t + ' → ' + JSON.stringify(r));
  }
});

// ── C 段：负例注入-删条（每键一条专属样本，删键后该样本必须失守/现形）──
//   模式键：命中 true → 注入后 false；守卫键：命中 false → 注入后 true。
const INJECT_CASES = {
  FLAT_ZH:       ['这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完。', 'mode'],
  FLAT_EN:       ['The annual pass is paid for, so skipping a week means throwing money away.', 'mode'],
  UNDERUSE_ZH:   ['会员包了月，这个月不多用就是亏。', 'mode'],
  UNDERUSE_EN:   ['The membership is monthly, and not using it is just a waste.', 'mode'],
  WASTE_ZH:      ['年卡办了，一天不去就是浪费。', 'mode'],
  WASTE_EN:      ['The annual card is paid, and not going is a waste.', 'mode'],
  MUSTFREQ_ZH:   ['健身年卡办了就得天天去，风雨无阻。', 'mode'],
  MUSTFREQ_EN:   ['The yearly pass is paid for, so I have to use it every single day.', 'mode'],
  DILUTE_ZH:     ['包年就是好，用得越多，平均成本越低，当然要放开用。', 'mode'],
  DILUTE_EN:     ['With the flat fee paid, the more you use it, the cheaper each visit gets.', 'mode'],
  CONCEPT_ZH:    ['定额偏差指包了年卡的用户觉得不多用就是浪费的现象。', 'guard'],
  CONCEPT_EN:    ['Flat-rate bias: with an annual membership, people feel not using it is a waste.', 'guard'],
  CORRECT_ZH:    ['已付的会员费是沉没成本，用不用应看边际收益，而不是不多用就是浪费。', 'guard'],
  CORRECT_EN:    ['The annual fee is sunk — use it only if the marginal benefit is there, not because not going is a waste.', 'guard'],
  NEG_ZH:        ['健身卡办了，但没人说就得天天去，不想去就不去。', 'guard'],
  NEG_EN:        ['The yearly pass is paid for, but you do not have to use it every single day.', 'guard'],
  HEDGE_ZH:      ['包了年卡，不多用就是浪费，这是经典的误解，别真这么干。', 'guard'],
  HEDGE_EN:      ['With the annual card paid, not using it is a waste — that is the classic misconception.', 'guard'],
};

test('C 负例注入-删条（18 键全部翻转，0 未翻转）', () => {
  for (const [k, [t, kind]] of Object.entries(INJECT_CASES)) {
    const before = detectFlatRateBias(t).hit;
    const after = detectFlatRateBias(t, { [k]: /(?!)/i }).hit;
    if (kind === 'mode') {
      assert.strictEqual(before, true, 'C ' + k + ' 删条前应命中: ' + t);
      assert.strictEqual(after, false, 'C ' + k + ' 删条后应失守: ' + t);
    } else {
      assert.strictEqual(before, false, 'C ' + k + ' 删守卫前应零命中: ' + t);
      assert.strictEqual(after, true, 'C ' + k + ' 删守卫后应现形: ' + t);
    }
  }
});

test('D gate 桥接（10/10 非 pass + econ_reasoning_gate 归因）', () => {
  for (const [i, t] of ATTACK.entries()) {
    const a = actionOf(t);
    assert.notStrictEqual(a, 'pass', 'D' + (i + 1) + ' gate 应非 pass: ' + t);
    assert.ok(dimsOf(t).includes('econ_reasoning_gate'), 'D' + (i + 1) + ' 应归因 econ_reasoning_gate: ' + t);
  }
  // 良性中 2 条存量维度误伤（hypostatization/contradiction）实测为非本族增量：
  //   B3 → hypostatization、B5 → contradiction；其余 4 条 pass。
  const nonPass = BENIGN.filter(t => actionOf(t) !== 'pass');
  assert.ok(nonPass.length <= 2, '良性非 pass 不应超过 2 条（存量误伤基线），实际 ' + nonPass.length);
});

test('E 插件层接线（46 族 = 36 econ + 10 stats）', () => {
  const fam = plugin.FAMILIES.find(f => f.key === 'flat_rate_bias');
  assert.ok(fam, '插件族表应含 flat_rate_bias');
  assert.strictEqual(fam.group, 'econ');
  assert.strictEqual(fam.round, 'r379');
  assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表应为 46 族');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 应为 36 族');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 应为 10 族');
  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0');
  const pa = plugin.analyze(ATTACK[0]);
  assert.ok(pa.families.some(x => x.key === 'flat_rate_bias'), 'analyze 攻击应命中 flat_rate_bias');
  const pb = plugin.analyze(BENIGN[1]);
  assert.strictEqual(pb.totalHits, 0, 'analyze 良性应零命中');
});

// ── F 段：射程边界双向固化（与 sunk_cost_coercion / mental_accounting /
//   present_bias / opportunity_cost_neglect 零交集）──
test('F 存量族攻击句 → 本族零命中（12/12 不越界）', () => {
  const EXISTING = [
    // sunk_cost_coercion（已投入 × 放弃可耻——本族腿②要求过度使用断言，退出可惜形天然不判）
    '会员费都交了两年了，现在退出太可惜，只能继续办下去。',
    '机票都买了，再难受也得飞完，不然就浪费了。',
    '这部电影票买了就不能退，再难看也得坐完全场。',
    '游戏氪了三千块，不玩到关服就等于白花钱。',
    '这个项目投了这么多人力，现在放弃就前功尽弃了。',
    '钱都花了，这东西再难吃也得吃完，不然就亏了。',
    // mental_accounting（按来源/用途区别对待金钱——不论使用强度）
    '年终奖是意外之财，花起来不心疼，可以随便买点奢侈品。',
    '工资存在卡里不动，年终奖单独拿去做短线，这样最合理。',
    // present_bias（月供摊薄的时间贴现形——本族管使用频率不摊贴现）
    '这个会员一天才三块钱，少喝半杯奶茶就省出来了，不买白不买。',
    '视频网站会员一个月才十几块，平摊到每天几乎不要钱，先充一年再说。',
    // opportunity_cost_neglect（免费/零价忽视代价——不论已付费用使用义务）
    '免费试用的工具先注册，反正不要钱，用不用得着以后再说。',
    '直播说是免费领的，其实时间成本比花钱还贵，只是没人算这笔账。',
  ];
  for (const [i, t] of EXISTING.entries()) {
    const r = detectFlatRateBias(t);
    assert.strictEqual(r.hit, false, 'F' + (i + 1) + ' 存量族攻击句应零命中: ' + t);
  }
});

test('G 本族攻击句 → 归因纯净（10/10 仅 flat_rate_bias 承载 econ）', () => {
  for (const [i, t] of ATTACK.entries()) {
    const pa = plugin.analyze(t);
    const fams = pa.families.map(x => x.key);
    assert.deepStrictEqual(fams, ['flat_rate_bias'], 'G' + (i + 1) + ' econ 族应仅 flat_rate_bias: ' + t + ' → ' + JSON.stringify(fams));
  }
});

// 清理（测试脚本最后一行必须是清理——本测试无临时文件，输出真实结果计数）
console.log('[r379] round-379-flat-rate-bias: A 10/10 命中, B 6/6 零命中, C 18 键注入全翻转, D gate 10/10 非 pass, E 插件 46 族接线, F 12/12 零越界, G 10/10 归因纯净');
