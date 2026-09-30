/**
 * 第 310 轮守卫：decision mode 两态（pick_biggest_gap / pick_best）
 *
 * 背景（r309 遗留 1，本轮闭环）：
 *   ratioBonus 加在 consequence_value 上，使「缺口大」被当成「候选质量高」。
 *   实测（scratch/probe310-upside.js）：命中率 10/10、误伤 0/30 的最优候选
 *   composite=0.77，命中率 4/10、误伤 12/30 的最差候选 0.86 —— 排序与候选
 *   质量完全反相关。而 r99/r309 的端到端契约钉的是「缺口更大的候选排更高」。
 *   两者都对，只是语义不同 → 拆成 mode 两态，默认值不变，零回归。
 *
 * 守卫目标：
 *   A. 默认 mode 行为与改动前完全一致（结构性 options 走原公式）
 *   B. pick_biggest_gap：缺口越大 composite 越高（r99 契约延续）
 *   C. pick_best：候选自身质量越高 composite 越高（四档单调，不再倒挂）
 *   D. pick_best 的 composite 不含缺口分（白盒：与 upside 解耦）
 *   E. decide() 端到端两态给出相反胜者（同一批候选）
 *   F. upside 恒定透出，与 mode 无关（缺口可分 MODE 审计）
 *   G. 无测量数字时两态等价（通道未命中不引入新行为）
 *   H. 显式数值字段不被任何 mode 改写（prior > 推断 > 通道的优先级不变）
 */

const { HeartFlowDecision } = require('../src/core/decision.js');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ❌ ' + msg); } };

const dec = () => new HeartFlowDecision();
const sc = (label, mode) =>
  dec()._scoreOption({ id: 'x', label }, '选方向', null, mode);

// ─── A. 默认 mode：结构化 options 严格等于原加权公式 ───────────
{
  const d = dec();
  const s = d._scoreOption(
    { id: 'x', label: '纯标签无数字', feasibility: 0.6, consequence_value: 0.7, risk: 0.2, confidence: 0.9 },
    '选方案', null
  );
  const expect = (f, ia, cv, rp, cf) =>
    Math.round((f * 0.15 + ia * 0.25 + cv * 0.25 + (1 - rp) * 0.25 + cf * 0.10) * 100) / 100;
  ok(s.composite === expect(0.6, 0.8, 0.7, 0.06, 0.9),
    `默认 mode 下结构化 options 必须等于原公式（实得 ${s.composite}，期望 ${expect(0.6, 0.8, 0.7, 0.06, 0.9)}）`);
  ok(s.consequence_value === 0.7, '显式 consequence_value 优先，不被通道或 mode 覆盖');
  ok(s.scoring_mode === 'pick_biggest_gap', '不传 mode 默认 pick_biggest_gap');
  ok(s.upside === 0, '无测量数字时 upside=0');
}

// 默认 mode 与显式 pick_biggest_gap 完全一致
{
  const a = sc('命中率 4/10、误伤 12/30');
  const b = sc('命中率 4/10、误伤 12/30', 'pick_biggest_gap');
  ok(a.composite === b.composite && a.consequence_value === b.consequence_value,
    '默认 mode 与显式 pick_biggest_gap 必须逐字段一致');
}

// ─── B. pick_biggest_gap：缺口越大分越高（r99 契约延续） ────────
{
  const rows = [10, 8, 6, 4].map((m) => sc(`候选：命中率 ${m}/10、误伤 0/30`, 'pick_biggest_gap'));
  for (let i = 1; i < rows.length; i++) {
    ok(rows[i].composite > rows[i - 1].composite,
      `pick_biggest_gap 下命中率越低（缺口越大）分必须越高（${rows[i - 1].measured_gap}→${rows[i].measured_gap} 得 ${rows[i - 1].composite}→${rows[i].composite}）`);
  }
  const r99a = sc('detect 7/8 主链路通过，detect 1/4 英文侧漏判', 'pick_biggest_gap');
  const r99b = sc('detect 7/8 主链路通过，detect 0/4 英文侧漏判', 'pick_biggest_gap');
  ok(Math.abs(r99a.measured_gap - 0.75) < 1e-9 && Math.abs(r99b.measured_gap - 1) < 1e-9,
    `r99 多比例取最大缺口不被破坏（A=${r99a.measured_gap} B=${r99b.measured_gap}）`);
  ok(r99b.composite > r99a.composite, 'r99 端到端契约：缺口更大的候选排更高');
  ok(r99b.composite === sc('detect 7/8 主链路通过，detect 0/4 英文侧漏判').composite,
    'r99 契约在默认 mode 下同样成立（两态默认等价）');
}

// ─── C. pick_best：候选自身质量越高分越高（本轮主目标） ────────
{
  const labels = [
    '最优候选：命中率 10/10、误伤 0/30',
    '中间档一：命中率 8/10、误伤 6/30',
    '中间档二：命中率 6/10、误伤 12/30',
    '最差候选：命中率 4/10、误伤 12/30',
  ];
  const rows = labels.map((l) => sc(l, 'pick_best'));
  for (let i = 1; i < rows.length; i++) {
    ok(rows[i].composite < rows[i - 1].composite,
      `pick_best 下质量越差分必须越低（第 ${i} 档 ${rows[i].composite} 应 < 第 ${i - 1} 档 ${rows[i - 1].composite}）`);
  }
  // 缺口越大，自身达成度越低 → consequence_value 单调下降
  for (let i = 1; i < rows.length; i++) {
    ok(rows[i].consequence_value < rows[i - 1].consequence_value,
      `pick_best 的 consequence_value 必须随缺口单调下降（${rows[i - 1].consequence_value}→${rows[i].consequence_value}）`);
  }
  // 误伤单独升高也要压低自身质量
  const fp0 = sc('候选：命中率 10/10、误伤 0/30', 'pick_best');
  const fp12 = sc('候选：命中率 10/10、误伤 12/30', 'pick_best');
  const fp30 = sc('候选：命中率 10/10、误伤 30/30', 'pick_best');
  ok(fp0.composite > fp12.composite && fp12.composite > fp30.composite,
    `pick_best 下误伤越高自身质量越低（${fp0.composite} > ${fp12.composite} > ${fp30.composite}）`);
}

// ─── D. pick_best 的 composite 与 upside 解耦（白盒） ───────────
{
  const s = sc('命中率 4/10、误伤 12/30', 'pick_best');
  const g = sc('命中率 4/10、误伤 12/30', 'pick_biggest_gap');
  ok(s.upside === g.upside && Math.abs(s.upside - 0.21) < 1e-9,
    `upside 与 mode 无关，必须等于缺口收益（实得 ${s.upside}）`);
  ok(s.composite < g.composite,
    `缺口语义下 composite 必须低于自身质量语义（pick_best ${s.composite} < pick_biggest_gap ${g.composite}）`);
  // 白盒：pick_best 的 cv = 0.35 + (1-gap)*0.6 - 0.08（误伤型）→ 0.35+0.24-0.08=0.51
  ok(Math.abs(s.consequence_value - (0.35 + 0.4 * 0.6 - 0.08)) < 1e-9,
    `pick_best 的 consequence_value 必须等于达成度公式（实得 ${s.consequence_value}，期望 ${0.35 + 0.4 * 0.6 - 0.08}）`);
}

// ─── E. decide() 端到端：同一批候选两态给出相反胜者 ────────────
{
  const prompt = [
    '[A] 最优候选：命中率 10/10、误伤 0/30',
    '[B] 中间档一：命中率 8/10、误伤 6/30',
    '[C] 中间档二：命中率 6/10、误伤 12/30',
    '[D] 最差候选：命中率 4/10、误伤 12/30',
  ].join('\n');
  const rBest = dec().decide({ task: '选方案', prompt, mode: 'pick_best' });
  const rGap = dec().decide({ task: '选方案', prompt, mode: 'pick_biggest_gap' });
  ok(rBest.chosen === 'A',
    `pick_best 端到端必须选自身质量最高的 A（实得 ${rBest.chosen}）`);
  ok(rGap.chosen === 'D',
    `pick_biggest_gap 端到端必须选缺口最大的 D（实得 ${rGap.chosen}）`);
  ok(rBest.chosen !== rGap.chosen, '两态必须给出不同胜者，否则 mode 拆分无意义');
  ok(rBest.composite_score !== rGap.composite_score,
    '两态 composite 必须来自不同语义（分数不得相同）');
  // 默认（不传 mode）延续 r99 行为
  const rDef = dec().decide({ task: '选方案', prompt });
  ok(rDef.chosen === 'D', `默认 mode 端到端必须是缺口语义（实得 ${rDef.chosen}）`);
}

// ─── F. upside 恒定透出，不随 mode 改变 ───────────────────────
{
  const gapSamples = ['覆盖率 25%', 'detect 0/4 漏判', '误伤 18/30', '命中率 4/10'];
  for (const t of gapSamples) {
    const a = sc(t, 'pick_best');
    const b = sc(t, 'pick_biggest_gap');
    ok(a.upside === b.upside && a.measured_gap === b.measured_gap,
      `upside/measured_gap 必须与 mode 无关（样本 ${t}）`);
  }
  const none = sc('纯标签无任何数字', 'pick_best');
  ok(none.upside === 0 && none.measured_gap === null,
    '无测量数字时缺口字段保持 null/0（不引入新行为）');
}

// ─── G. 无测量数字时两态 composite 完全一致 ───────────────────
{
  const plain = ['修 bug 可逆增量', '整体重构不可逆大改', '补测试负例'];
  for (const t of plain) {
    const a = sc(t, 'pick_best');
    const b = sc(t, 'pick_biggest_gap');
    ok(a.composite === b.composite,
      `通道未命中时两态必须等价（${t}：${a.composite} vs ${b.composite}）`);
  }
}

// ─── H. 显式数值字段不被任何 mode 改写 ───────────────────────
{
  const opt = { id: 'x', label: '命中率 4/10、误伤 12/30', consequence_value: 0.62, prior: 0.55 };
  const s = dec()._scoreOption(opt, 't', null, 'pick_best');
  ok(s.consequence_value === 0.62,
    `显式 consequence_value 在 pick_best 下仍优先（实得 ${s.consequence_value}）`);
  const p = dec()._scoreOption({ id: 'x', label: '命中率 4/10', prior: 0.55 }, 't', null, 'pick_best');
  ok(p.consequence_value === 0.55,
    `显式 prior 在 pick_best 下仍优先（实得 ${p.consequence_value}）`);
}

// ─── I. mode 入参容错（只认 pick_best，其余回落默认） ─────────
{
  const s1 = dec()._scoreOption({ id: 'x', label: '命中率 4/10' }, 't', null, 'PICK_BEST');
  const s2 = dec()._scoreOption({ id: 'x', label: '命中率 4/10' }, 't', null, null);
  const s3 = dec()._scoreOption({ id: 'x', label: '命中率 4/10' }, 't', null, 'whatever');
  ok(s1.scoring_mode === 'pick_biggest_gap' && s2.scoring_mode === 'pick_biggest_gap'
    && s3.scoring_mode === 'pick_biggest_gap',
    'mode 只精确匹配 pick_best，其余（含大小写错误/null/未知串）一律回落默认');
}

console.log('\n=== 第 310 轮守卫 decision-mode-round310 ===');
if (fail) {
  console.log(`\n❌ ${fail} 项失败`);
  for (const f of []) console.log('  ' + f);
}
console.log(`\n总计: ${pass} passed / ${fail} failed`);
console.log(fail === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
process.exit(fail === 0 ? 0 : 1);
