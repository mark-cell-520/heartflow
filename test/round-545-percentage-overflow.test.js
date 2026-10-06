/**
 * 第 79 维度 percentage_overflow（分配占比合计溢出）守卫测试
 * v6.8.28 / 第 545 轮（r544 立项、r545 收口）
 *
 * 覆盖（10 组）：
 *   1. 模块层攻击命中（16 条）
 *   2. gate 层归因到 percentage_overflow（接线进 findings 的证据）
 *   3. gate 动作 verify 级（本维度定级）
 *   4. 四类排除规则（变化 / 频率 / 时段 / 完成度）
 *   5. 良性误伤（模块层 11 条 → 0）
 *   6. 边界（单百分比 / 恰好 100 / 短文本 / 四舍五入容差）
 *   7. 分数分级（和 ≥105 提分）
 *   8. 变异守卫：置空 ALLOC_BEFORE 后攻击由 hit 变 miss
 *   9. 变异不得误伤相邻排除支
 *   10. 维度已登记 + dimMap 键在场 + allDims 键在场 + 导出可用
 *
 * 口径（同 r524/r530/r534）：`new RegExp('')` 空模式恒匹配，
 * 故用 `(?!)` 负向前瞻做真置空。
 *
 * 用法: node test/round-545-percentage-overflow.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkPercentageOverflow } = require('../src/percentage-overflow.js');
const { gate } = require('../src/gate.js');

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

// 用 vm 载入模块源码，支持运行时替换内部正则（变异测试）
// 注意：模块内 const 与外部同名会冲突，故把内部常量改名（_OVR 后缀）后再注入。
function loadModuleWithOverride(overrides) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'percentage-overflow.js'), 'utf8');
  // 把要替换的内部 const 定义行删掉
  let patched = src;
  for (const key of Object.keys(overrides)) {
    patched = patched.replace(new RegExp(`const ${key}\\s*=\\s*[^;\\n]+;`), '');
  }
  const fnBody = patched.replace(/module\.exports[^\n]*\n?/g, '');
  const names = Object.keys(overrides);
  const factory = vm.runInThisContext(
    `(function (${names.join(', ')}) { ${fnBody}\n return { checkPercentageOverflow }; })`,
    { filename: 'pvo-override.js' }
  );
  return factory(...names.map(n => overrides[n]));
}

// ── 1. 攻击命中（16 条）───────────────────────────────
const attacks = [
  'A 占 80%，B 占 70%，两者合计覆盖全部场景。',
  '调研显示，45% 的用户选择了 A，55% 的用户选择了 B，还有 30% 选择了 C。',
  '北美市场占营收的 60%，欧洲市场占 50%，两者相加已超过百分之百。',
  '团队里 70% 是工程师，60% 是设计师，其余为运营人员。',
  '60% of the budget goes to marketing and 55% goes to R&D.',
  '男性占 55%，女性占 48%，其他占 5%。',
  '研发投入占 40%，市场投入占 45%，行政占 20%，合计远超百分之百。',
  '35% voted yes, 40% voted no, and 30% abstained.',
  '第一梯队占 33%，第二梯队占 34%，第三梯队占 34%，另有 10% 未分组。',
  '总预算的 48% 用于人力，52% 用于设备，还有 15% 用于场地。',
  '60% of respondents chose A, 50% chose B.',
  '甲部门占 65%，乙部门占 40%，剩余部门分其他部分。',
  '受访者中 58% 支持，42% 反对，另有 12% 表示中立。',
  '预算的 55% 用于产品，46% 用于市场，剩下 20% 用于研发。',
  '50% of the students are from China, 45% from India, and 15% from Europe.',
  '样本中 62% 为男性，38% 为女性，还有 5% 未填写性别。',
];
for (const [i, t] of attacks.entries()) {
  check(`attack-${String(i + 1).padStart(2, '0')} 命中`, () => {
    const r = checkPercentageOverflow(t);
    assert.equal(r.hit, true);
    assert.ok(r.score >= 0.7 && r.score <= 0.9, `score 应在 0.7-0.9，实际 ${r.score}`);
    assert.match(r.detail, /合计溢出/);
  });
}

// ── 2. gate 层归因 + verify 级 ───────────────────────
check('gate 层归因到 percentage_overflow', () => {
  const r = gate('团队里 70% 是工程师，60% 是设计师，其余为运营人员。');
  assert.equal(r.dimensions.percentage_overflow.hit, true);
  const f = r.findings.find(x => x.dimension === 'percentage_overflow');
  assert.ok(f, 'findings 应含 percentage_overflow');
  assert.equal(r.gate.action, 'verify');
});

check('gate 层良性样本不被新维度命中', () => {
  const r = gate('华北区占 30%，华东区占 35%，华南区占 20%，其他区域合计 15%。');
  assert.equal(r.dimensions.percentage_overflow.hit, false);
});

// ── 4. 四类排除 ──────────────────────────────────────
const excluded = [
  // 变化语境
  '第一季度营收增长 12%，利润增长 8%。',
  '渗透率从 12% 提升到 35%，市场规模翻倍。',
  '同比增长 15%，环比增长 3%。',
  // 频率统计
  '活跃用户中 68% 每天登录，72% 每周登录。',
  // 时段分期
  '上半年完成度 50%，下半年完成度 60%。',
  // 完成度
  '前端进度 60%，后端进度 70%。',
  // 不同指标的比率
  '检测准确率 95%，误报率 2%，漏报率 8%。',
  'CPU 占用率 85%，内存占用率 78%，磁盘占用率 45%。',
];
for (const [i, t] of excluded.entries()) {
  check(`exclude-${String(i + 1).padStart(2, '0')} 不命中`, () => {
    assert.equal(checkPercentageOverflow(t).hit, false);
  });
}

// ── 5. 良性误伤 ───────────────────────────────────────
const benign = [
  '45% 的用户选择了 A，55% 的用户选择了 B。',
  '中国大陆占 45%，港澳台占 8%，海外占 47%。',
  '用户中 45% 为女性，55% 为男性。',
  '北美市场占 60%，欧洲市场占 30%，亚太占剩余 10%。',
  '70% of respondents agreed, while 20% disagreed and 10% were neutral.',
  '系统延迟从 200ms 降到 50ms。',
  '团队有 5 名工程师，3 名设计师。',
  '注册用户 10000 人，其中 80% 完成了首次登录。',
  '今年营收 800 万，其中利润占比 12%。',
  '华东区销售额占比 55%，华南占比 30%。',
  '该方法在测试集上准确率 91.5%，F1 分数 0.89。',
];
for (const [i, t] of benign.entries()) {
  check(`benign-${String(i + 1).padStart(2, '0')} 不误伤`, () => {
    assert.equal(checkPercentageOverflow(t).hit, false);
  });
}

// ── 6. 边界 ───────────────────────────────────────────
check('边界: 单百分比不判', () => {
  assert.equal(checkPercentageOverflow('用户中 80% 是男性。').hit, false);
});
check('边界: 恰好 100% 不判', () => {
  assert.equal(checkPercentageOverflow('甲占 50%，乙占 50%。').hit, false);
});
check('边界: 四舍五入容差内不判（100.4%）', () => {
  assert.equal(checkPercentageOverflow('甲约 50.2%，乙约 50.2%。').hit, false);
});
check('边界: 短文本/空值', () => {
  assert.equal(checkPercentageOverflow('').hit, false);
  assert.equal(checkPercentageOverflow(null).hit, false);
  assert.equal(checkPercentageOverflow(undefined).hit, false);
});

// ── 7. 分数分级 ───────────────────────────────────────
check('分数分级: 和 ≥115 得 0.9', () => {
  const r = checkPercentageOverflow('甲占 60%，乙占 50%，丙占 10%，合计严重溢出。');
  assert.equal(r.hit, true);
  assert.ok(r.score >= 0.85, `score 应 ≥0.85，实际 ${r.score}`);
});
check('分数分级: 刚过阈值得 0.7', () => {
  const r = checkPercentageOverflow('甲占 51%，乙占 50%，两者合计溢出。');
  assert.equal(r.hit, true);
  assert.ok(r.score < 0.85, `score 应 <0.85，实际 ${r.score}`);
});

// ── 8. 变异守卫：置空 ALLOC_BEFORE → 攻击漏判 ────────
check('变异: ALLOC_BEFORE 置空后中文攻击漏判', () => {
  const m = loadModuleWithOverride({ ALLOC_BEFORE: /(?!)!*$/ });
  // 取一条只依赖 before 标记的中文样本（模块源码里 after 用的是 ALLOC_AFTER）
  const r = m.checkPercentageOverflow('A 占 80%，B 占 70%，两者合计覆盖全部场景。');
  assert.equal(r.hit, false, '置空 before 标记后该样本应漏判');
});

// ── 9. 变异不得误伤相邻排除支 ────────────────────────
check('变异: 置空 ONLYBEFORE 不影响排除规则', () => {
  const m = loadModuleWithOverride({ ALLOC_BEFORE: /(?!)!*$/ });
  assert.equal(m.checkPercentageOverflow('检测准确率 95%，误报率 2%，漏报率 8%。').hit, false);
});

// ── 10. 接线完整性 ────────────────────────────────────
check('接线: dimMap + allDims + VERIFY_DIMS 三处登记', () => {
  const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.match(idx, /percentage_overflow: pvo/, 'dimMap 应登记 percentage_overflow');
  assert.match(idx, /name:'percentage_overflow'/, 'allDims 应登记 percentage_overflow');
  assert.match(idx, /'percentage_overflow',/, 'VERIFY_DIMS 应登记 percentage_overflow');
  assert.match(idx, /checkPercentageOverflow\(_normText\)/, '应调用 checkPercentageOverflow');
  assert.match(idx, /require\('\.\/percentage-overflow\.js'\)/, '应 require 模块');
});

check('接线: 模块导出可用', () => {
  assert.equal(typeof checkPercentageOverflow, 'function');
});

console.log('');
console.log(`round-545 percentage_overflow: ${passed} passed, ${failed} failed`);
if (failures.length) console.log('\n失败项:\n' + failures.join('\n'));
process.exit(failed > 0 ? 1 : 0);
