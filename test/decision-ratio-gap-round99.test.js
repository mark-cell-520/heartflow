/**
 * decision-ratio-gap-round99.test.js — 第 99 轮主测试
 *
 * 覆盖 src/core/decision.js 新增的 x/y 实测数字解析通道（v6.7.128）：
 * 修复 `_parseOptionsFromText` / `_scoreOption` 只抽 key=value 五个字段，
 * 候选描述里的实测比例数字（detect 0/8、覆盖率 75%、zh 4/8 en 2/8）被整个
 * 丢弃 → 所有候选回退同一套词表默认值 → composite 打平 →
 * decide() 返回 options_indistinguishable + chosen:null。
 *
 * 轮初实测复测（探针 /tmp/probe99-xy.js、/tmp/decide99.js）：
 *   · 场景 A（真实 cron 写法，只写实测数字）：三候选全 0.74 并列，chosen:null
 *   · decision 三跑定向：全部 0.80 / 0.84 / 0.74 并列，0/3 定向成功
 *   · 场景 C（_parseOptionsFromText 实际抽到的字段）：{id,label,description}——
 *     五个 key=value 与比例数字一个都没抽到
 * 这是 UPGRADE_LOG 第 95/96/97/98 四轮「并列/侥幸定向」的共同根因。
 *
 * 通道口径（保守，宁不采信不可误抽）：
 *   ① 覆盖率/检出率/命中率/检测率 NN% 优先 → gap = 1 - NN%
 *   ② x/y 比例（x ≤ y，y ∈ [1,99]）且 ±10 字符内有检测语义锚点才采信
 *   ③ 多个锚定比例取 gap 最大者（保守：先堵最大的洞）
 *   ④ 解析不到返回 null，完全沿用词表路径，行为与升级前一致
 */
'use strict';

const { HeartFlowDecision } = require('../src/core/decision.js');

let pass = 0, fail = 0;
const failures = [];

function ok(cond, label) { if (cond) pass++; else { fail++; failures.push(label); } }

function dec() { return new HeartFlowDecision(null); }

// ─── A. 比例数字通道：候选必须被比例区分，不再并列 ───────────
{
  // 升级前全 0.74 并列的形态（三候选描述结构相似，只有数字不同）
  const d = dec();
  const r = d.decide({
    task: '选第 99 轮升级方向',
    prompt: [
      '[A] decision._scoreOption x/y 解析：detect 0/3',
      '[B] victim_blaming EN：detect 2/8',
      '[C] moral_foundations EN：detect 5/8',
    ].join('\n'),
  });
  ok(r.chosen !== null, `比例通道应能定向（detect 0/3 vs 2/8 vs 5/8）实得 chosen=${r.chosen}`);
  ok(r.chosen === 'A', `缺口最大的候选应胜出（0/3），实得 ${r.chosen}`);
  ok(!String(r.reasoning).startsWith('options_indistinguishable'), '不应并列弃权');

  // 分数必须单调反映缺口大小：gap(0/3)=1.0 > gap(2/8)=0.75 > gap(5/8)=0.375
  const byId = {};
  for (const o of r.all_options) byId[o.id] = o.score;
  ok(byId.A > byId.B && byId.B > byId.C,
    `缺口越大分越高（A=${byId.A} B=${byId.B} C=${byId.C}）`);
}

// ─── B. 覆盖率 % 通道 ─────────────────────────────────────
{
  const d = dec();
  const r = d.decide({
    task: '选第 99 轮升级方向',
    prompt: [
      '[A] 修 decision._scoreOption 的 x/y 映射：实测缺口完整度 100%（decision 对本形态 0/3 定向）',
      '[B] victim_blaming 英文侧判据移植：缺口完整度 75%',
      '[C] moral_foundations 英文侧判据移植：缺口完整度 37%',
    ].join('\n'),
  });
  // 「完整度」不是「覆盖率」，不应触发 gap = 1-x；这里三候选描述结构相似，
  // 断言的是：解析通道没有把 100%/75%/37% 误当覆盖率反转（诚实性回归）。
  const byId = {};
  for (const o of r.all_options) byId[o.id] = o.score;
  ok(r.chosen !== null, '含百分比数字的候选不应全部并列（应有通道介入或词表差异）');
  ok(byId.A >= byId.C - 0.001,
    `「完整度 100%」候选不得因反向解析被压到最低（A=${byId.A} C=${byId.C}）`);
}

// ─── C. 反例护栏：无锚点数字不得被误抽（日期/版本/比分）──────
{
  const d = dec();
  const r = d.decide({
    task: '选第 99 轮升级方向',
    prompt: [
      '[A] 修 decision 解析在 2026/9 排期，v6.7/124 基线',
      '[B] 修 decision 解析在 2027/10 排期，v6.7/130 基线',
      '[C] 修 decision 解析在 2028/11 排期，v6.7/140 基线',
    ].join('\n'),
  });
  // 日期/版本号无检测语义锚点 → 通道返回 null → 应退回词表路径
  // （三候选描述同构 → 诚实并列弃权，而不是被假数字区分）
  ok(r.chosen === null, `无锚点数字不得被误采为判据（应并列弃权），实得 chosen=${r.chosen}`);
  ok(String(r.reasoning).startsWith('options_indistinguishable'),
    '无锚点场景应如实弃权而非假决策');
}

// ─── D. 单候选含多个比例时取最大缺口（保守原则）────────────
{
  const d = dec();
  const r = d.decide({
    task: '选第 99 轮升级方向',
    prompt: [
      '[A] 修 decision 解析：detect 7/8 主链路通过，detect 1/4 英文侧漏判',
      '[B] 修 decision 解析：detect 7/8 主链路通过，detect 0/4 英文侧漏判',
    ].join('\n'),
  });
  // 两候选主链路同为 7/8（缺口小），差别全在第二比例：A 缺 3/4，B 缺 1.0
  // → B 的 gap 更大应胜出。「取最大」失效时会退回第一个比例 7/8 打平 → 弃权。
  ok(r.chosen === 'B', `多比例取最大缺口（A=1/4 B=0/4 应选 B），实得 ${r.chosen}`);
  ok(!String(r.reasoning).startsWith('options_indistinguishable'),
    '多比例候选不得因取错比例而并列弃权');
}

// ─── E. 通道未命中时完全退回原路径（结构化 options 不受影响）──
{
  const d = dec();
  // 与既有 test/decision-capability.test.js 第三例同款数据：
  // cv 0.6 vs 0.7（差 0.025）小于 risk 0.2 vs 0.8 的差（0.045）→ 低风险胜出。
  // 若本轮通道插手了显式字段路径，这个排序会变。
  const r = d.decide({
    task: '选方案',
    options: [
      { id: 'a', label: '低风险高回报', feasibility: 0.6, consequence_value: 0.7, risk: 0.2, confidence: 0.9 },
      { id: 'b', label: '高风险高回报', feasibility: 0.6, consequence_value: 0.6, risk: 0.8, confidence: 0.9 },
    ],
  });
  ok(r.chosen === 'a', `结构化 options 行为不变（低风险应胜出），实得 ${r.chosen}`);

  // 白盒核算：显式数值字段走的是原公式，通道返回 null 不应贡献任何加分。
  const s = d._scoreOption(
    { id: 'x', label: '纯标签无数字', feasibility: 0.6, consequence_value: 0.7, risk: 0.2, confidence: 0.9 },
    '选方案', null
  );
  ok(s.measured_gap === null, '结构化 options 的 measured_gap 应为 null（通道未介入）');
  const expect = (f, ia, cv, rp, cf) =>
    Math.round((f * 0.15 + ia * 0.25 + cv * 0.25 + (1 - rp) * 0.25 + cf * 0.10) * 100) / 100;
  ok(s.composite === expect(0.6, 0.8, 0.7, 0.06, 0.9),
    `composite 应严格等于原加权公式（实得 ${s.composite}，期望 ${expect(0.6, 0.8, 0.7, 0.06, 0.9)}）`);
  ok(s.consequence_value === 0.7, '显式 consequence_value 必须优先，不被比例通道覆盖');
}

// ─── F. measured_gap 透出可审计 ────────────────────────────
{
  const d = dec();
  const scored = d._scoreOption({ id: 'A', label: 'detect 0/8，8 条攻击全漏' }, '选方向', null);
  ok(scored.measured_gap === 1, `缺口 0/8 应透出 measured_gap=1，实得 ${scored.measured_gap}`);
  ok(scored.measured_ratio_source === 'ratio', '来源应标注为 ratio');
  const scored2 = d._scoreOption({ id: 'B', label: '覆盖率 25%，其余改用词表' }, '选方向', null);
  ok(scored2.measured_gap === 0.75, `覆盖率 25% 应透出 gap=0.75，实得 ${scored2.measured_gap}`);
  ok(scored2.measured_ratio_source === 'percent', '来源应标注为 percent');
  const scored3 = d._scoreOption({ id: 'C', label: '不含任何数字的候选描述' }, '选方向', null);
  ok(scored3.measured_gap === null, '无数字候选应透出 null（不假装有判据）');
}

// ─── G. 词表加分不得与比例通道双计（同一事实只加分一次）──────
{
  const d = dec();
  // 描述含「漏判」（SEVERITY_HIGH +0.22）且含 0/8（比例通道 +0.35）
  // 双计会让 consequence_value 冲到 0.6+0.15+0.35+0.22 = 1.32 → 封顶 1
  const withBoth = d._scoreOption({ id: 'A', label: '修复漏判：实测 detect 0/8 全漏' }, '选方向', null);
  const withRatio = d._scoreOption({ id: 'B', label: '修复某族：实测 detect 0/8 全漏' }, '选方向', null);
  const cvDiff = withBoth.consequence_value - withRatio.consequence_value;
  ok(cvDiff <= 0.08 + 1e-9,
    `「漏判」词表加分在比例通道占用时必须压到 ≤0.08（实得差 ${cvDiff.toFixed(3)}）`);
}

// ─── H. 无 memory 时 identity_alignment 默认 0.8 不变 ───────
{
  const d = dec();
  const s = d._scoreOption({ id: 'A', label: 'detect 0/8' }, '选方向', null);
  ok(s.identity_alignment === 0.8, `identity_alignment 默认值应保持 0.8，实得 ${s.identity_alignment}`);
  ok(s.composite > 0 && s.composite <= 1, 'composite 应落在 (0,1]');
}

console.log('\n=== 第 99 轮主测试 decision-ratio-gap ===');
if (failures.length) {
  console.log(`\n❌ ${failures.length} 项失败:`);
  for (const f of failures) console.log('  ' + f);
}
console.log(`\n总计: ${pass} passed / ${fail} failed`);
console.log(fail === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
process.exit(fail === 0 ? 0 : 1);
