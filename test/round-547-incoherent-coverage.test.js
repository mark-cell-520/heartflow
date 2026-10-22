/**
 * 第 80 维度 incoherent_coverage（不完备全覆盖宣告）守卫测试
 *
 * v6.8.29 / 第 547 轮立项、第 548 轮收口（r547 被迭代上限截断，只差导出）
 *
 * 判据：C1 无保留全覆盖宣称 × C2 分配语境分项≥2 × C3 分项之和 ≤ 100−8%
 * 四类排除：有保留表述 / 变化语境 / 频率统计 / 时段分期
 *
 * 每个断言都是「注入 → 必须命中；破坏判据 → 必须变红」的形式。
 * 样本只存在于本文件（内容审查纪律：原文不进命令行 / 不进报告）。
 *
 * 用法: node test/round-547-incoherent-coverage.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MOD_PATH = require.resolve('../src/incoherent-coverage.js');
const { checkIncoherentCoverage } = require(MOD_PATH);
const { gate } = require('../src/gate.js');

// ── 攻击族：分配语境 × 分项和显著低于百 × 无保留全覆盖宣称 ──
const attacks = [
  'A 方案占 40%，B 方案占 30%，两者合计已覆盖全部客户场景。',
  '预算的 35% 用于研发，25% 用于市场，合计覆盖了所有部门的需求。',
  '调研中 30% 的用户选择 A，20% 选择 B，两项合计涵盖全部受访者。',
  '45% of the budget goes to marketing and 30% goes to R&D, covering all needs.',
  '第一梯队占 20%，第二梯队占 25%，两者相加覆盖全部学员。',
  '营收 30% 来自北美，25% 来自欧洲，合计已占比全部市场。',
  '技术栈 15% 用 Rust，20% 用 Go，合计覆盖所有生产服务。',
  '工单的 10% 来自投诉，15% 来自咨询，加起来就是全部来源。',
  '流量 25% 来自搜索，20% 来自社交，合计占据全部渠道。',
  '参与者的 40% 是男生，35% 是女生，两者合计即为全部人员。',
  '60% of respondents chose A, 20% chose B, together covering all respondents.',
  '三个梯队分别占 20%、20% 和 18%，合计覆盖全部学员群体。',
];

// ── 良性族：合法统计表述（必须零误伤）──
const benign = [
  'A 占 50%，B 占 50%，合计覆盖全部受访者。',
  '研发 60%，市场 40%，这是预算的全部分配。',
  '男性占 55%，女性占 45%，与人口普查数据一致。',
  '50% chose A, 50% chose B, all respondents accounted for.',
  '准确率 95%，覆盖率 90%，召回率 88%。',
  '团队 50% 是工程师，50% 是设计师，共十人。',
  '绝大部分客户来自搜索渠道，社交仅占 20%。',
  '这五个渠道覆盖了我们 95% 的流量，剩余渠道忽略不计。',
  '研发投入占 50%，市场占 50%，覆盖了全部预算用途。',
  '去年增长 20%，今年增长 25%，趋势稳定。',
  '每天登录用户 80%，每周登录 95%，月活 99%。',
  '搜索流量占 60%，社交占 40%，合计就是全部来源。',
  '第一梯队 33%，第二梯队 34%，第三梯队 33%，抽样误差 1%。',
];

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

console.log('== 第 548 轮 incoherent_coverage 守卫测试（r547 遗留收口）==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkIncoherentCoverage(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 incoherent_coverage（接线有效性断言）──
check(`findings 归因 incoherent_coverage ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'incoherent_coverage'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. 该维度动作是 verify 级，且未被更高级别挤压出 findings ──
check('gate 动作为 verify 级（第 80 维度定级）', () => {
  const actions = new Set(attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['verify'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── 5. 良性零误伤（本维度口径）────────────────────────────
//   口径（同 r510/r514）：只断言本维度不误伤。整句 gate 非 pass 若来自
//   其他维度不归本维度负责——那是既有维度的独立行为。
check(`incoherent_coverage 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkIncoherentCoverage(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空（findings 可指导修复）─────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'incoherent_coverage');
  assert.ok(f, '未找到 incoherent_coverage finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空 FULL_COVER 后 C1 支必须变红 ──────────
//   做法（同 r510 先例）：对模块源码的判据正则做字符级破坏，重新 require。
//   用 (?!) 负向前览做真置空，不用空字符串——空字符串会被后续 (?!) 前的
//   「?:」合并成一个永假分支，但若判据源码结构变化会静默失效。
function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-icv-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkIncoherentCoverage;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;

check('变异守卫：置空 FULL_COVER（C1）后攻击必须由 hit 变 miss', () => {
  const orig = fs.readFileSync(MOD_PATH, 'utf8');
  const before = checkIncoherentCoverage(attacks[0]).hit;
  assert.ok(before, '守卫前置失败：样本未被命中');
  const broken = orig.replace(
    /const FULL_COVER = \/.*\/i;/,
    'const FULL_COVER = /(?!)ZZ/i;');
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = loadMutant(broken);
  const flips = attacks.map(s => mutated(s).hit);
  assert.equal(flips.filter(Boolean).length, 0,
    `仍有 ${flips.filter(Boolean).length} 条命中 —— C1 支不是唯一定罪条件或守卫不敏感`);
});

check('变异守卫：抬高 COVERAGE_MARGIN（C3）后攻击必须由 hit 变 miss', () => {
  const orig = fs.readFileSync(MOD_PATH, 'utf8');
  // 取分项和最低的一条（缺口最大），margin 抬到 990 后 C3 恒不成立
  const idx = 11;
  const before = checkIncoherentCoverage(attacks[idx]).hit;
  assert.ok(before, '守卫前置失败：缺口最大样本未被命中');
  const broken = orig.replace('const COVERAGE_MARGIN = 8;', 'const COVERAGE_MARGIN = 990;');
  assert.notEqual(broken, orig, '变异未生效（替换目标不存在）');
  const mutated = loadMutant(broken);
  assert.strictEqual(mutated(attacks[idx]).hit, false,
    'C3 阈值破坏后仍命中 —— 该支可能是死码');
});

// ── 8. 导出区可用性（接线完整性断言依赖）─────────────────
check('index.js 导出 checkIncoherentCoverage', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkIncoherentCoverage, 'function', '未导出');
});

// ── 9. 维度已登记（dimensions 键含 incoherent_coverage）────
check('dimensions 键含 incoherent_coverage（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'incoherent_coverage' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

// ── 10. VERIFY_DIMS 登记（定级生效）────────────────────────
check('incoherent_coverage 已登记为 verify 级', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  // 精确截取 VERIFY_DIMS 集合体（到紧随其后的 BLOCK/REWRITE/维度映射为止），
  // 不用有界模糊匹配——那会误报。
  const m = src.match(/const VERIFY_DIMS = new Set\(([\s\S]*?)\);/);
  assert.ok(m, '未找到 VERIFY_DIMS 定义');
  assert.ok(/'incoherent_coverage'/.test(m[1]), 'VERIFY_DIMS 集合内未见该维度名');
});

// ── 11. 四类排除规则各自生效 ──────────────────────────────
check('排除规则：有保留表述（绝大部分/过半）不判', () => {
  assert.strictEqual(
    checkIncoherentCoverage('绝大部分客户来自搜索渠道，社交仅占 20%，覆盖了全部渠道中的绝大多数。').hit,
    false);
});
check('排除规则：变化语境不判', () => {
  assert.strictEqual(
    checkIncoherentCoverage('营收占比从 30% 上升到 40%，与去年相比覆盖全部市场的 70%。').hit,
    false);
});
check('排除规则：频率统计不判', () => {
  assert.strictEqual(
    checkIncoherentCoverage('每天登录的用户覆盖了 65% 的活跃客户，每周登录占 70%。').hit,
    false);
});
check('排除规则：时段分期不判', () => {
  assert.strictEqual(
    checkIncoherentCoverage('上半年完成 35%，下半年完成 45%，合计覆盖全部季度安排。').hit,
    false);
});

// ── 12. 与 percentage_overflow（第 79 维）互补，不重复归因 ──
check('反向判据互补：和 > 100% 的样本不被本维度归因', () => {
  const r = gate('A 占 80%，B 占 70%，两者合计覆盖全部场景。');
  assert.strictEqual(r.dimensions.incoherent_coverage.hit, false,
    '本维度误抓溢出方向样本（与第 79 维判据重叠）');
  assert.strictEqual(r.dimensions.percentage_overflow.hit, true,
    '溢出方向应仍由第 79 维归因');
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
