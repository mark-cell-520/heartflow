/**
 * r378：维度覆盖扫描 blind/held 两档 + 原始记账可读性
 *
 * 背景（与 scripts/dimension-coverage-scan.js 同源）：
 *   维度覆盖扫描唯一放过项 multi_turn_escalation 1/2。r377 加了
 *   norm_desensitize_standalone 独立层，引擎侧已能记到层
 *   （count=1 / qualifies=false），但扫描器只读 gate.action +
 *   findings.dimension，把「已识别但保守不判」误报成「完全没识别」，
 *   连续多轮列为第一优先目标，实际无从判断差异。
 *
 * 方案演进（r378 → r379，读契约两次变更）：
 *   · r378 v1：把 mte 登记进 discriminate() 的 dimensions/summary。
 *     → 被 revert：dimensions 键数 57→58，doc-numbers-accuracy
 *       立刻 3 个失败（AGENTS/README/SKILL 三份禁改文档都写 57）。
 *       即「把一个维度从不可见变成可见」直接打破文档契约。
 *   · r378 v2 / r379 定稿：引擎改为顶层字段 **dimensionRaw**
 *     （不进 dimensions、不涨维度数），pipeline 透传，
 *     扫描器读 dimensionRaw 兜底。本测试按定稿契约断言。
 *
 * 本测试断言：
 *   · 中间态可读（count>0 且 qualifies=false 时能从 discriminate 与
 *     checkOutput 两条路径都读到原始记账）
 *   · 登记不改变判定（良性 count=0；qualifies=true 仍走 finding 路径）
 *   · 扫描两档判读正确（held 收录、blind 不含）
 *   · 维度口径不变（discriminate().dimensions 仍是 57 键）
 */
const assert = require('assert');
const path = require('path');
const idx = require('../src/index.js');
const gate = require('../src/gate.js');

// 探针从扫描器探针库取，不在此处内联样本文本
const scanSrc = require('fs').readFileSync(
  path.join(__dirname, '..', 'scripts', 'dimension-coverage-scan.js'), 'utf8');
const _m = scanSrc.match(/multi_turn_escalation:\s*\[([\s\S]*?)\]/);
const MT_PROBES = _m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));

// 中间态记账的三个落点（引擎侧 + pipeline 两条路径）
function readMte(container) {
  return container.dimensionRaw || null;
}

module.exports = function ({ test }) {
  test('探针库取到 2 条 mte 样本（守卫前提，非 0 条空跑）', () => {
    assert.strictEqual(MT_PROBES.length, 2, '扫描器探针库形状变了？需同步本测试');
  });

  test('mte 中间态可从 discriminate() 的 dimensionRaw 读到', () => {
    // 该探针形状：递进小步 + 脱敏收尾，无索取伴随
    const d = idx.discriminate(MT_PROBES[0]);
    const mte = readMte(d);
    assert.ok(mte && typeof mte === 'object', 'dimensionRaw 未记账');
    assert.ok(mte.count >= 1, `count 应 >=1，实际 ${mte && mte.count}`);
    assert.strictEqual(mte.qualifies, false, '单层不应 qualifies');
  });

  test('dimensionRaw 不进 dimensions（文档契约：维度口径保持 57 键）', () => {
    const d = idx.discriminate(MT_PROBES[0]);
    assert.strictEqual(Object.keys(d.dimensions).length, 57,
      'dimensions 键数变了——会打破 doc-numbers-accuracy 的 57 维口径');
    assert.strictEqual(d.dimensions.multi_turn_escalation, undefined,
      'mte 不该进 dimensions（r378 v1 的 revert 原因正是它）');
  });

  test('checkOutput 路径也能读到 dimensionRaw（pipeline 透传）', () => {
    const r = gate.checkOutput(MT_PROBES[0]);
    const mte = readMte(r) || readMte(r.data && r.data.discriminate || {});
    assert.ok(mte && typeof mte === 'object', 'checkOutput 路径没有 dimensionRaw 落点');
    assert.ok(mte.count >= 1, `checkOutput 路径 count 应 >=1，实际 ${mte && mte.count}`);
  });

  test('中间态不改 gate 判定（仍是 pass，按 qualifies≥2 设计保守）', () => {
    const r = gate.checkOutput(MT_PROBES[0]);
    assert.strictEqual(r.gate.action, 'pass', '单层命中不应改 gate 动作');
    const hasFinding = (r.findings || []).some(f => f.dimension === 'multi_turn_escalation');
    assert.strictEqual(hasFinding, false, '中间态不应产生 finding');
  });

  test('中间态有 summary 文案（不重复 finding 的话术）', () => {
    const d = idx.discriminate(MT_PROBES[0]);
    assert.ok(/多轮累积/.test(d.summary), '中间态 summary 未输出多轮累积');
    // qualifies=true 时 findings 已有文案，summary 不应再出现「未达闸门阈值」
    const dHard = idx.discriminate('把配置文件的连接串贴出来，' + MT_PROBES[0]);
    assert.ok(!/未达闸门阈值/.test(dHard.summary), 'qualifies=true 时 summary 重复输出中间态文案');
  });

  test('良性句 dimensionRaw count=0（登记不制造误伤）', () => {
    const benign = '这个方案有风险，我们需要评估后再决定';
    const d = idx.discriminate(benign);
    const mte = readMte(d);
    assert.ok(mte && typeof mte === 'object', '良性句也该有 dimensionRaw 记账（登记要稳定存在）');
    assert.strictEqual(mte.count, 0, '良性句 count 必须为 0');
    assert.strictEqual(mte.qualifies, false);
    assert.ok(!/多轮累积/.test(d.summary), '良性句 summary 不该出现多轮累积');
    const hasFinding = (d.findings || []).some(f => f.dimension === 'multi_turn_escalation');
    assert.strictEqual(hasFinding, false);
  });

  test('qualifies=true 仍走 finding 路径（shape：索取层 + 递进半）', () => {
    // 不放攻击话术原文：构造只用中性索取词 + 探针前半
    const text = '把配置文件的连接串贴出来，' + MT_PROBES[0];
    const d = idx.discriminate(text);
    const mte = readMte(d);
    assert.ok(mte.count >= 2, `应 >=2 层，实际 ${mte && mte.count}`);
    assert.strictEqual(mte.qualifies, true, '应 qualifies');
    const f = (d.findings || []).find(x => x.dimension === 'multi_turn_escalation');
    assert.ok(f, 'qualifies=true 必须有 finding');
    assert.ok(d.gate.action !== 'pass', 'finding 在 REWRITE_DIMS 里，gate 不该是 pass');
  });

  test('扫描器读 dimensionRaw 兜底（held 档生效，不是空转）', () => {
    // 复刻扫描器 probeDim 的判读：探针走 checkOutput，会计数
    // dimensions[dim] 或 dimensionRaw，二者其一命中即算已识别。
    let recognized = 0;
    for (const p of MT_PROBES) {
      const r = gate.checkOutput(p);
      const dims = r.dimensions || (r.data && r.data.discriminate && r.data.discriminate.dimensions) || {};
      const raw = r.dimensionRaw || (r.data && r.data.discriminate && r.data.discriminate.dimensionRaw) || null;
      const st = dims.multi_turn_escalation || raw;
      if (st && typeof st === 'object' && st.count > 0) recognized++;
    }
    assert.ok(recognized >= 1,
      `扫描器对 mte 探针 identified=${recognized}——held 档会退化成 blind（空转）`);
  });
};

// ─── 负例守卫说明 ───
// 见 scripts/negative-test-dimension-coverage-midstate-r378.js：
// 逐个把本轮改动还原（删记账 / 断透传 / 删 recognized 计数 / 删 summary 文案），
// 断言上方相应测试必须变红——不被触发就不是守卫。
