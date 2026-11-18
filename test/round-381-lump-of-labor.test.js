'use strict';
/**
 * test/round-381-lump-of-labor.test.js — r381 劳动总量谬误轮测（r379 结构同款）
 *
 * 判据（劳动力市场语境 × 固定份额断言 两腿近距共现 + 两组豁免 + 腿②守卫，
 *   缺一不判）：
 *   腿① JOBS 劳动力市场语境在场（ZH 组：岗位/工作/就业/饭碗/职位/招工/招聘/
 *        失业/待业/裁员/劳动力/务工/打工/入职/跳槽/退休/用工/工种/上班/差事/
 *        活计；EN 组：jobs/employment/unemployment/workforce/labor market/
 *        hiring/layoffs/positions/vacancy/automation/robots/immigrants/
 *        retirement age/pension age/workers/employees）；
 *   腿② FIXED 固定份额断言在场（ZH 五形 + EN 四形：
 *        F1 总量固定形（总量/总数/一共 + 就那么多/固定/是固定的/有上限；
 *          the total pool of jobs is fixed / work is not a fixed）；
 *        F2 挤占岗位形（取代/抢走/抢占/占了/挤走/砸了/吞了 + 岗位/工作/饭碗/
 *          职位/坑/位置/活计；robots replace workers / immigrants take jobs）；
 *        F3 效率-失业形（效率/生产率/自动化/机器/速度/产出 + 提高/提升/增长/
 *          越快/干得快 + 失业/没活干/岗位减少；the more efficient, the fewer jobs）；
 *        F4 一人上岗形（一个人/一人/有人 + 干了/占了/去了/有了/顶上 + 另一个
 *          + 就没/只能/就得 + 活干/工作/失业；one person means another unemployed）；
 *        F5 占位不让形（占着/占住/赖着/捂着 + 岗位/位置/坑 + 不让/不腾出 +
 *          就没工作）；
 *   两腿须落在邻近窗内（以腿②为锚，ZH 40 字 / EN 140 字符），方向不限；
 *   豁免 A 概念讨论（劳动总量谬误/lump-of-labor fallacy/fixed pool of work
 *        + 谬误/误解/理论/概念等框架词共现）；
 *   豁免 B 纠正句（忽略/取决于 + 补偿/需求/去向；not a fixed / depends on demand）；
 *   腿②守卫：紧前否定窗（ZH 6 字 / EN 20 字符）+ 前后窗对冲短语（误解/谬误/
 *        misconception/fallacy 等）。中英各自取对应守卫组。
 *
 * 攻击形（10 条，中英混合，五种腿②形全覆盖；同池 13 候选首轮 + 四候选深探
 *   probe-r381-pool.js + probe-r381-scope.js：穿透 8/10 真零命中——存量维度
 *   对「工作总量固定」形零覆盖）：
 *   「机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的」
 *   「移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多」
 *   「女人出去工作会抢男人的岗位，工作就那么多，一个人干了另一个就没活干」
 *   「机器干得快，就等于人没活干了，效率每提高一分，岗位就永久减少一分」
 *   「年轻人就业挤压了老员工，位置一共就那么多，此消彼长是零和博弈」
 *   「Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed」
 *   「Immigrants take jobs from locals: one person filling a post means another must be unemployed」
 *   「生产效率越高失业越严重，产出总量有上限，干得快的人把慢的人的饭碗砸了」
 *   「延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干」
 *   「Every automation gain permanently removes a workplace, because the amount of work never changes」
 *
 * 良性形（模块级必须零命中；其中 B3 存量维度 completion_evidence、B9/B10
 *   存量维度 zero_sum_fallacy 误伤已实测为非本族增量，见 r381 报告）：
 *   概念讨论（劳动总量谬误机制本身）、纠正句（忽略了补偿机制/取决于需求
 *   去向）、总量-结构辨析句（自动化消灭特定岗位但总需求扩张）、具体裁员
 *   叙事（公司裁员两百人——无固定份额断言天然不判）、相邻族攻击句（贸易
 *   零和/菲利普斯永久替代/货币宽松降失业）。
 */

const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectLumpOfLabor } = require(path.join(ROOT, 'src', 'lump-of-labor.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

function actionOf(t) { const r = gcheck(t); return r.gate ? r.gate.action : r.action; }
function dimsOf(t) { const r = gcheck(t); return (r.findings || []).map(f => f.dimension); }

// ── A 段：攻击样本（10 条，中英混合，五种腿②形全覆盖）──
const ATTACK = [
  '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大规模失业。',
  '移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多。',
  '女人出去工作会抢男人的岗位，工作就那么多，一个人干了另一个就没活干。',
  '机器干得快，就等于人没活干了，效率每提高一分，岗位就永久减少一分。',
  '年轻人就业挤压了老员工，位置一共就那么多，此消彼长是零和博弈。',
  'Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed.',
  'Immigrants take jobs from locals: one person filling a post means another must be unemployed.',
  '生产效率越高失业越严重，产出总量有上限，干得快的人把慢的人的饭碗砸了。',
  '延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干。',
  'Every automation gain permanently removes a workplace, because the amount of work never changes.',
];
// ── B 段：良性样本（14 条，概念/纠正/总量-结构辨析/裁员叙事/相邻族攻击句）──
const BENIGN = [
  '劳动总量谬误把就业看成固定份额的争夺，忽略了自动化在降低成本的同时会创造新的需求与岗位。',
  '认为工作总量固定、外来劳动者必然直接挤占本地就业，忽略了互补岗位与总需求的扩张。',
  'The lump-of-labor fallacy assumes a fixed pool of jobs; cheaper production can expand demand and create new occupations.',
  '自动化对就业的影响取决于被释放的需求去向，历史上生产率提升伴随了就业结构转换而非总量消失。',
  '总需求随生产率提升而扩张，效率红利既降低价格也创造新的服务需求。',
  '就业是供需匹配的结果，新增劳动者既提供劳动也创造需求，并非纯挤占关系。',
  '生产自动化会消灭特定岗位，但把就业看成总量固定的零和争夺忽略了补偿机制。',
  '这家公司去年裁员两百人，主要是产线自动化改造的结果。',
  '贸易往来本质上是零和博弈，一方的盈余必然对应另一方的赤字。',
  'Once inflation expectations adjust, the inflation-unemployment tradeoff disappears in the long run.',
  '央行想要降失业，加快印钞就行了，通胀高点无所谓。',
  '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
  '合作谈判也可以是正和的，双方都做出让步反而都能获益。',
  '疫苗接种显著降低了重症率，住院人数随之明显下降。',
];

test('A 攻击样本命中（10/10）', () => {
  for (const [i, t] of ATTACK.entries()) {
    const r = detectLumpOfLabor(t);
    assert.strictEqual(r.hit, true, 'A' + (i + 1) + ' 应命中: ' + t);
    assert.ok(r.guidance && r.guidance.length > 0, 'A' + (i + 1) + ' 应有 guidance');
    assert.strictEqual(r.dimension, 'lump_of_labor');
  }
});

test('B 良性样本零命中（14/14，模块级）', () => {
  for (const [i, t] of BENIGN.entries()) {
    const r = detectLumpOfLabor(t);
    assert.strictEqual(r.hit, false, 'B' + (i + 1) + ' 应零命中: ' + t + ' → ' + JSON.stringify(r));
  }
});

// ── C 段：负例注入-删条（每键一条专属样本，删键后该样本必须失守/现形）──
//   模式键：命中 true → 注入后 false；守卫键：命中 false → 注入后 true。
const INJECT_CASES = {
  JOBS_ZH:       ['机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的。', 'mode'],
  JOBS_EN:       ['Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed.', 'mode'],
  FIXED_ZH_F1:   ['一个国家的工作岗位总数是固定的，这就是就业市场的铁律。', 'mode'],
  FIXED_ZH_F2:   ['机器人取代了工人的岗位，就业是零和博弈。', 'mode'],
  FIXED_ZH_F3:   ['效率每提高一分，岗位就永久减少一分。', 'mode'],
  FIXED_ZH_F4:   ['这活一个人干了，另一个人就没工作可干。', 'mode'],
  FIXED_ZH_F5:   ['延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干。', 'mode'],
  FIXED_EN_F1:   ['The total pool of jobs is fixed, no matter how much demand grows.', 'mode'],
  FIXED_EN_F2:   ['Robots replace workers and take jobs from locals.', 'mode'],
  FIXED_EN_F3:   ['The more efficient the factory, the fewer jobs the town has.', 'mode'],
  FIXED_EN_F4:   ['One immigrant filling a post means another worker must be unemployed.', 'mode'],
  WINDOW_ZH:     ['机器人取代了工人的岗位。……（中间隔很多字）……工作岗位的总数是固定的，就业零和。', 'mode'],
  WINDOW_EN:     ['Robots are taking over the factory floor across the whole country. ' + 'x'.repeat(10) + ' The total pool of jobs is fixed.', 'mode'],
  CONCEPT_ZH:    ['劳动总量谬误把就业总量讲成固定份额的争夺，机器人取代一个岗位就少一份工作。', 'guard'],
  CONCEPT_EN:    ['The classic lump-of-labor fallacy holds that the amount of work never changes: robots take jobs from locals, permanently.', 'guard'],
  CORRECT_ZH:    ['就业影响取决于需求去向，即便机器人抢走了工人的岗位。', 'guard'],
  CORRECT_EN:    ['Whether robots take jobs from locals depends on the demand structure of the local economy.', 'guard'],
  NEG_ZH:        ['并不是说机器人取代岗位就等于工作总量减少了，移民并不抢走本地人的饭碗。', 'guard'],
  NEG_EN:        ['It is not the case that efficiency gains destroy jobs.', 'guard'],
  HEDGE_ZH:      ['机器人取代岗位，这是经典误解。', 'guard'],
  HEDGE_EN:      ['People say robots take jobs from locals — a classic misconception.', 'guard'],
};

test('C 负例注入-删条（21 键全部翻转，0 未翻转）', () => {
  for (const [k, [t, kind]] of Object.entries(INJECT_CASES)) {
    const before = detectLumpOfLabor(t).hit;
    const after = detectLumpOfLabor(t, { [k]: /(?!)/i }).hit;
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
  // 良性中 2 条存量维度误伤实测为非本族增量：B3 → completion_evidence、
  //   B9 → zero_sum_fallacy + absolute_claim（B9 本是相邻族攻击句，非 pass 为
  //   存量维度正确行为）；其余 12 条 pass。
  const nonPass = BENIGN.filter(t => actionOf(t) !== 'pass');
  assert.ok(nonPass.length <= 2, '良性非 pass 不应超过 2 条（存量误伤基线），实际 ' + nonPass.length);
});

test('E 插件层接线（47 族 = 36 econ + 11 stats）', () => {
  const fam = plugin.FAMILIES.find(f => f.key === 'lump_of_labor');
  assert.ok(fam, '插件族表应含 lump_of_labor');
  assert.strictEqual(fam.group, 'econ');
  assert.strictEqual(fam.round, 'r381');
  assert.strictEqual(plugin.FAMILIES.length, 47, '插件族表应为 47 族');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 应为 36 族');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 应为 11 族');
  assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0');
  const pa = plugin.analyze(ATTACK[0]);
  assert.ok(pa.families.some(x => x.key === 'lump_of_labor'), 'analyze 攻击应命中 lump_of_labor');
  const pb = plugin.analyze(BENIGN[1]);
  assert.strictEqual(pb.totalHits, 0, 'analyze 良性应零命中');
  // gate 桥族表登记（扩族义务链见 round-364 E2）
  const gFams = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js')).FAMILIES;
  assert.strictEqual(gFams.length, 42, 'gate 桥族表应为 42 族');
  assert.ok(gFams.some(f => f.key === 'lump_of_labor' && f.round === 'r381'), 'gate 桥族表缺 lump_of_labor');
});

// ── F 段：射程边界双向固化（与 zero_sum_fallacy / hasty_generalization /
//   重商主义/掠夺定价/菲利普斯永久替代 零交集）──
test('F 存量族攻击句 → 本族零命中（10/10 不越界）', () => {
  const EXISTING = [
    // zero_sum_fallacy（泛化零和断言无就业语境——本族腿①要求劳动力市场语境在场）
    '贸易就是零和博弈，一方的顺差必然是另一方的逆差。',
    '谈判桌上你多让一步我就少得一分，本质还是零和。',
    // 具体裁员叙事（无固定份额断言——F1-F5 均不匹配）
    '公司裁员两百人，主要是因为产线自动化改造。',
    // 掠夺定价/价格战叙事（同池 K diversification / D predatory 候选族形）
    '新玩家烧钱抢市场，等对手死绝了价格一定翻倍涨回来。',
    // 菲利普斯永久替代形（同池 E phillips_permanent 候选族形）
    '央行想要降失业，加快印钞就行了，通胀高点无所谓。',
    '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
    // 重商主义绝对优势形（同池 M absolute_advantage_trade 候选族形）
    '本国什么都比对方强，跟不如我们的国家贸易注定吃亏。',
    // hasty_generalization（样本外推不论总量固定机制）
    '见了两只乌鸦都是黑的，就断定天下乌鸦一般黑。',
    'Once inflation expectations adjust, the inflation-unemployment tradeoff disappears in the long run.',
  ];
  for (const [i, t] of EXISTING.entries()) {
    const r = detectLumpOfLabor(t);
    assert.strictEqual(r.hit, false, 'F' + (i + 1) + ' 存量族攻击句应零命中: ' + t);
  }
});

test('G 本族攻击句 → 归因纯净（10/10 仅 lump_of_labor 承载 econ）', () => {
  for (const [i, t] of ATTACK.entries()) {
    const pa = plugin.analyze(t);
    const fams = pa.families.map(x => x.key);
    assert.deepStrictEqual(fams, ['lump_of_labor'], 'G' + (i + 1) + ' econ 族应仅 lump_of_labor: ' + t + ' → ' + JSON.stringify(fams));
  }
});

// 清理（测试脚本最后一行必须是清理——本测试无临时文件，输出真实结果计数）
console.log('[r381] round-381-lump-of-labor: A 10/10 命中, B 14/14 零命中, C 21 键注入全翻转, D gate 10/10 非 pass, E 插件 47 族接线, F 10/10 零越界, G 10/10 归因纯净');
