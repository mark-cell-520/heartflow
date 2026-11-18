/**
 * test/round-388-censoring-neglect.test.js
 * r388 轮单测：censoring_neglect 第 44/45 子族（删失数据当完整结论）
 *
 * 轮次背景：本子族原为 r387 轮产能（src/censoring-neglect.js，437 行），
 * sync 时 `git stash pop` 撞上游 r387 significance_verdict_misread 同槽冲
 * 突，按 r379 union 先例两族并保留，r387 已在 claims 标记 completed 但本
 * 子族未落地；r388 作为 r387 未收尾产能的固化轮接手落地。
 *
 * r388 实测（scripts/round-388/probe-gap.js，模块级基线 v6.8.192）：
 *   首轮 10 条攻击仅 1/10 命中——9 条穿透全部因腿② COMPLETE 缺形
 *   （A6/A10 连腿①也缺）。本轮按实证补 7+11=18 条新形后 10/10 命中，
 *   良性 10/10 零误伤（含 2 条新增良性边界）。
 *
 * 三层验证（同 r386 范式）：
 *   1. 模块级 detectCensoringNeglect 直接调用
 *   2. gate 层 mainGate.gate 归因
 *   3. 插件层注册（version / family 列表）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mainGate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const { detectCensoringNeglect } = require(path.join(ROOT, 'src', 'censoring-neglect.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}

// ─── 攻击样本：删失数据当完整结论（中英双语）─────────────────
// A1-A5 为 r387 立项样本；A6-A10 为 r388 新实证穿透样本
const ATTACKS = [
  // A1 观察满一年 → 一年生存率 100% → 新药完胜（裸名词形）
  '新药组观察满一年时无一人死亡，可见这种新药的一年生存率是100%，疗效完胜对照组。',
  // A2 试验进行到第三年 + 早期无感染 → 数据已证明安全有效
  '该疫苗试验才进行到第三年，但早期无一人出现感染，这说明数据已经证明疫苗是安全有效的。',
  // A3 只跟踪六个月 → 能彻底预防心梗
  '这项研究只跟踪了患者六个月，期间没有发生一例心梗，所以这种药能彻底预防心梗。',
  // A4 随访刚满十八个月，尚无复发 → 可以认为已实现临床治愈
  '随访刚满十八个月，尚无复发报告，可以认为新疗法已经实现了临床治愈。',
  // A5 观察期内无一人出事 → 足以证明没有任何长期风险
  '观察期内这些患者一个都没出事，足以证明这个方案没有任何长期风险。',
  // A6 队列失访率高 + 已入组全部存活 → 预后非常好（r388 新穿透）
  '该队列目前失访率还很高，但已入组的病例全部存活，因此该人群的预后非常好。',
  // A7 EN followed for only 12 months and none had died → 100% superior
  'Patients in the treatment arm were followed for only 12 months and none had died, so one-year survival is 100% and the drug is clearly superior.',
  // A8 EN early data + we can declare the vaccine safe and effective
  'The trial is only in its third year, but with zero infections in the early data, we can declare the vaccine safe and effective.',
  // A9 EN six months of follow-up → completely prevents heart attacks（强断言裸形）
  'With six months of follow-up and no cardiovascular events recorded, this medication completely prevents heart attacks.',
  // A10 EN Eighteen months in → has achieved a clinical cure
  'Eighteen months in, there have been no recurrences, so the new therapy has achieved a clinical cure.',
];

// ─── 良性样本：正当谨慎报告 / 概念讨论 / 已完成随访结论 ──────────
const BENIGNS = [
  // B1 正确谨慎陈述：随访期太短 + 删失比例高 → 还不能下结论
  '新药组观察满一年时无死亡病例，但随访期太短、删失比例也高，现在还远不能下结论，需要更长随访和生存分析。',
  // B2 概念教学：删失数据与随访完整性是方法学问题
  '本研究为概念性讨论：删失数据与随访完整性是生存分析中的核心方法学问题，本文梳理其处理方式。',
  // B3 已完成五年随访的正确结论
  '该试验已完成五年随访，全部患者结局明确，五年生存率为62%，这是完整的终点数据。',
  // B4 早期零事件 + 大量未到期/失访 → 结论只在窗口内成立
  '虽然早期无一人死亡，但大量患者尚未到期或失访，早期零事件结论只在该随访窗口内成立。',
  // B5 EN 谨慎陈述：incomplete follow-up + censoring substantial → cannot conclude
  'Patients were followed for 12 months with no deaths, but the follow-up is incomplete and censoring is substantial, so we cannot draw conclusions yet.',
  // B6 EN 概念综述
  'This paper is a methodological review of censoring and follow-up completeness in survival analysis.',
  // B7 EN 已完成五年随访
  'The trial completed five-year follow-up for all patients; the overall five-year survival rate of 62% is based on complete outcome data.',
  // B8 方法学综述（删失数据处理方式）
  '本报告为方法学综述，讨论删失数据的处理方式与随访完整性要求。',
  // B9 谨慎：随访未结束尚不能判定是否治愈
  '随访满十八个月时无复发报告，但由于随访期未结束，尚不能判定新疗法是否实现了临床治愈。',
  // B10 EN 谨慎：still incomplete → no conclusion about cure
  'The study reports that after 18 months no recurrences were seen, though follow-up is still incomplete so no conclusion about cure can be drawn.',
];

// ═══ 测试 1：模块级攻击全命中 ═══
console.log('\n[1] 模块级 detectCensoringNeglect — 攻击样本');
ATTACKS.forEach((t, i) => {
  const r = detectCensoringNeglect(t);
  ok(r.hit === true, `A${i + 1} hit（score=${r.score}, count=${r.count}）`);
});

// ═══ 测试 2：模块级良性零误伤 ═══
console.log('\n[2] 模块级 detectCensoringNeglect — 良性样本零误伤');
BENIGNS.forEach((t, i) => {
  const r = detectCensoringNeglect(t);
  ok(r.hit === false, `B${i + 1} 不命中`);
});

// ═══ 测试 3：命中结构完整性（dimension / severity / guidance / tags）═══
console.log('\n[3] 命中结果结构完整性');
{
  const r = detectCensoringNeglect(ATTACKS[0]);
  ok(r.dimension === 'censoring_neglect', 'dimension 字段正确');
  ok(typeof r.severity === 'number' && r.severity >= 60 && r.severity <= 100, `severity 在 60-100（${r.severity}）`);
  ok(typeof r.guidance === 'string' && r.guidance.length > 100, 'guidance 非空且充实');
  ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 数组非空');
  ok(Array.isArray(r.tags) && r.tags.includes('survival-analysis'), 'tags 含 survival-analysis');
}

// ═══ 测试 4：gate 层归因（econ_reasoning_gate 聚合族承重）═════
// 注：censoring_neglect 在 gate 层不直接暴露——聚合族统一以
// econ_reasoning_gate 归因（同 r386 effect_measure_misread 范式），
// 子族名通过插件层 FAMILIES / analyze 暴露（见测试 6）。
console.log('\n[4] gate 层归因');
{
  let econAttr = 0;
  let nonPass = 0;
  ATTACKS.forEach((t) => {
    const r = gcheck(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('econ_reasoning_gate')) { econAttr++; }
    if (r.gate && r.gate.action !== 'pass') { nonPass++; }
  });
  ok(nonPass >= 8, `gate 层 action 非 pass ${nonPass}/10（≥8）`);
  ok(econAttr >= 8, `gate 层 econ_reasoning_gate 归因 ${econAttr}/10（≥8）`);
}

// ═══ 测试 5：gate 层良性不被升级为 block ═══
console.log('\n[5] gate 层良性不被 block');
BENIGNS.forEach((t, i) => {
  const r = gcheck(t);
  ok(r.gate.action !== 'block', `B${i + 1} action=${r.gate.action}（非 block）`);
});

// ═══ 测试 6：插件层注册（含 FAMILIES 计数 + analyze 归因）═════
console.log('\n[6] 插件层注册');
{
  ok(plugin.version === '1.21.0', `version=1.21.0（${plugin.version}）`);
  const desc = String(plugin.description || '');
  ok(desc.includes('censoring_neglect'), 'description 含 censoring_neglect');
  ok(desc.includes('r388'), 'description 含 r388');
  ok(desc.includes('45 族'), 'description 标注 45 族');
  // FAMILIES 族表计数（r386 范式）
  ok(plugin.FAMILIES.some(f => f.key === 'censoring_neglect' && f.round === 'r388'), 'FAMILIES 含 censoring_neglect（round r388）');
  ok(plugin.FAMILIES.length === 45, `FAMILIES 45 族（实际 ${plugin.FAMILIES.length}）`);
  const econN = plugin.FAMILIES.filter(f => f.group === 'econ').length;
  const statsN = plugin.FAMILIES.filter(f => f.group === 'stats').length;
  ok(econN === 36, `econ 组 36 族（实际 ${econN}）`);
  ok(statsN === 9, `stats 组 9 族（实际 ${statsN}）`);
  ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 45, 'FAMILIES key 唯一');
  // gate 桥族表计数
  const gFams = gate.FAMILIES;
  ok(gFams.some(f => f.key === 'censoring_neglect' && f.round === 'r388'), 'gate 桥族表含 censoring_neglect');
  ok(gFams.length === 40, `gate 桥族表 40 族（实际 ${gFams.length}）`);
  // analyze 归因
  const an = plugin.analyze(ATTACKS[0]);
  ok(an.families.some(x => x.key === 'censoring_neglect'), `analyze 归因 censoring_neglect（${an.families.map(x => x.key).join(',')}）`);
  ok(an.score > 0.5, `analyze score ${an.score}`);
}

// ═══ 测试 7：射程不重叠——与既有子族对照 ═══
console.log('\n[7] 射程不重叠对照');
{
  // survivor_time_bias 领地：起点不一致形（治疗起算 vs 确诊起算）
  const itb = '从治疗开始计算生存期比从确诊开始计算更长，因此这种算法让生存率看起来提高了。';
  ok(detectCensoringNeglect(itb).hit === false, 'immortal_time_bias 领地（起点后移）不判');
  // completion_evidence 领地：完成度陈述格式
  const ce = '该项目已完成 80% 的工程量，因此可以按期交付。';
  ok(detectCensoringNeglect(ce).hit === false, 'completion_evidence 领地（完成度陈述）不判');
}

// ═══ 汇总 ═══
console.log(`\n${'='.repeat(50)}`);
console.log(`r388 单测结果: ${pass} PASS / ${fail} FAIL`);
console.log(`${'='.repeat(50)}`);
if (fail > 0) {
  console.log('存在 FAIL，按纪律不 commit');
  process.exit(1);
}
console.log('全绿');
