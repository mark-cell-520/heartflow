/**
 * test/round-395-appeal-to-obviousness.test.js
 *
 * [r395] 第 62 维度 appeal_to_ignorance（诉诸无知/举证倒置）新增路由 R4
 * 「免证形」——诉诸明显性/常识免证族（真升级②——既有维度全新措辞家族；
 * src/index.js 零改动、dimMap 键数不变、模块 inject 支持新增）。
 *
 * 立项依据（scripts/round-395/probe-pool.js + probe-obviousness.js，
 * HEAD 6.8.195 实测）：六候选家族同池定拨——obviousness 穿透 10/12 最高
 * （time_window 8/12 / rhetorical_question 2/6 / persuasive_definition 3/6 /
 * pre_post 1/5 / mechanism_plausibility 1/4），良性 1/10 非 pass 系存量
 * confidence 误伤非本族增量。本族宣称主张因「显而易见/不言而喻/明摆着/
 * self-evident/common sense」而免于举证——FALLACY_PATTERNS 有同族启发式
 * 标签（权重 0.2，src/index.js:8041/8051）但 gate 层零维度覆盖。
 *
 * 新路由 R4（union，与 R1-R3 互补）：强标记单腿即判（不言而喻/明摆着/
 * 不争的事实/三岁小孩都明白/稍微有点常识的人都不会；EN self-evident /
 * plain to see / obvious to all / anyone with common sense），弱标记
 * （常识/稍微想想/common sense）须与免证动作同语言配对（不需要数据/
 * 用不着分析/心里都清楚；EN no analysis is needed / without any evidence）。
 *
 * 覆盖：模块层攻击全腿命中 / 良性零误伤 / 精度保持（索取证据形、概念教学
 * 形、纠正形放行）/ 逐常量注入删条负例 / 加性证明（R4 是补丁非替换）/
 * gate 层端到端 / 接线零改动纪律。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkAppealToIgnorance } = require(path.join(HF, 'src/appeal-to-ignorance.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const NEVER = '__r395_negtest_never__';

// ─── A. 模块层：R4 攻击全腿命中 ─────────────────────────────────
test('A1 中文强标记单腿命中（不言而喻/明摆着/不争的事实/三岁小孩/稍微有点）', () => {
  const atk = [
    '稍微有点经验的人都认同这个判断，这就是不争的事实。',   // 不争的事实
    '这个事情不言而喻，稍微想想就能得出结论。',             // 不言而喻
    '这件事根本不需要讨论，答案是明摆着的。',               // 明摆着
    '稍微有点常识的人都不会做出这种判断。',                 // 稍微有点常识的人都不会
    '凡是长眼睛的都看得出这套方案行不通。',                 // 长眼睛的都
    '这是最基本的道理，三岁小孩都明白，不需要论证。',       // 三岁小孩都明白
  ];
  for (const t of atk) assert(checkAppealToIgnorance(t).hit, '未命中: ' + t);
});

test('A2 英文强标记单腿命中（self-evident / plain to see / obvious to all / half a brain）', () => {
  const atk = [
    'Anyone with common sense can see that this will not work.',
    'It is self-evident that the plan is flawed.',
    'Surprisingly obvious to anyone paying attention, the choice is clear.',
    'It is plain to see that the new policy will backfire.',
    'With half a brain you could tell the numbers are inflated.',
  ];
  for (const t of atk) assert(checkAppealToIgnorance(t).hit, '未命中: ' + t);
});

test('A3 弱标记 × 免证动作同语言配对命中（常识×不需要数据 / common sense×no proof needed）', () => {
  const atk = [
    '这是常识问题，不需要数据，大家心里都清楚。',                    // 常识 × 不需要数据
    '这结论根本不需要论证，稍微想想就能明白。',                      // 稍微想想 × 不需要论证
    '这个判断用不着分析，稍微想想就行。',                            // 稍微想想 × 用不着分析
    'Common sense says this is fine, so no proof is needed.',        // EN common sense × no proof is needed
  ];
  for (const t of atk) assert(checkAppealToIgnorance(t).hit, '未命中: ' + t);
});

// ─── B. 良性：索取证据形 / 概念教学形 / 纠正形 / 否定标记形零误伤 ──
test('B1 良性零误伤（锁最易误伤族）', () => {
  const ben = [
    'Common sense is a starting point, not a substitute for measurement.', // 纠正形 EN
    '这个假设是否成立，最终要看实验数据。',                                 // 索取证据形
    '在数学中，公理是不证自明的，其余命题都需要证明。',                     // 概念教学形
    'We still need to check the data before drawing conclusions.',
    '这个结论看起来直观，但我们还是做了稳健性检验。',                       // 已核验形
    'The obvious explanation is not always the correct one.',               // 否定标记形
    '从常识来说，下雨天路上会堵，我们提前出门吧。',                         // 常识中性用法（无免证动作）
    'Anyone with common sense knows that we need more data first.',        // 索取证据形 EN
    'It is obvious that further testing is required before launch.',        // 倒装索取形 EN
    '答案是明摆着的：我们必须补充实验数据才能下结论。',                     // 强标记 × 索取证据（豁免承接）
    '诉诸明显性是一种常见的逻辑谬误，把「显然」当作证据。',                 // 元话语转述
  ];
  for (const t of ben) assert(!checkAppealToIgnorance(t).hit, '误伤: ' + t);
});

// ─── C. 精度保持：代拦族与本族射程边界 ─────────────────────────
test('C1 精度保持——「明眼人一看就知道」归存量维度代拦，不强行入表', () => {
  // 蔑视式表达（明眼人/一看就知道）由 hindsight_bias/stereotype 代拦，
  // 本族只收「不言而喻/明摆着/不争的事实」式免证宣言，不收蔑视词。
  assert(!checkAppealToIgnorance('明眼人一看就知道这里面有问题，根本用不着分析。').hit,
    '蔑视形不在本族词表（gate 层仍由存量维度兜住，无缺口）');
});

// ─── D. 负例注入：逐条删掉本轮每个新模式，守卫必须变红 ──────────
test('D1 删 OBV_STRONG_ZH → 「不争的事实」样本转 miss', () => {
  const t = '稍微有点经验的人都认同这个判断，这就是不争的事实。';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { OBV_STRONG_ZH: new RegExp(NEVER) }).hit, '删 OBV_STRONG_ZH 后应 miss');
});
test('D2 删 OBV_STRONG_EN → EN self-evident 样本转 miss', () => {
  const t = 'It is self-evident that the plan is flawed.';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { OBV_STRONG_EN: new RegExp(NEVER) }).hit, '删 OBV_STRONG_EN 后应 miss');
});
test('D3 删 OBV_WEAK_ZH → 「常识×不需要数据」样本转 miss', () => {
  const t = '这是常识问题，不需要数据，大家心里都清楚。';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { OBV_WEAK_ZH: new RegExp(NEVER) }).hit, '删 OBV_WEAK_ZH 后应 miss');
});
test('D4 删 WAIVE_ZH → 「稍微想想×不需要论证」样本转 miss', () => {
  const t = '这结论根本不需要论证，稍微想想就能明白。';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { WAIVE_ZH: new RegExp(NEVER) }).hit, '删 WAIVE_ZH 后应 miss');
});
test('D5 删 OBV_WEAK_EN → EN common sense×waiver 样本转 miss', () => {
  const t = 'Common sense says this is fine, so no proof is needed.';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { OBV_WEAK_EN: new RegExp(NEVER) }).hit, '删 OBV_WEAK_EN 后应 miss');
});
test('D6 删 WAIVE_EN → EN common sense×waiver 样本转 miss', () => {
  const t = 'Common sense says this is fine, so no proof is needed.';
  assert(checkAppealToIgnorance(t).hit, '正常应命中');
  assert(!checkAppealToIgnorance(t, { WAIVE_EN: new RegExp(NEVER) }).hit, '删 WAIVE_EN 后应 miss');
});
test('D7 删 OBV_EXEMPT_ZH → 「明摆着×必须补充数据」良性转 hit（守卫反向证明豁免承重）', () => {
  const t = '答案是明摆着的：我们必须补充实验数据才能下结论。';
  assert(!checkAppealToIgnorance(t).hit, '正常应放行');
  assert(checkAppealToIgnorance(t, { OBV_EXEMPT_ZH: new RegExp(NEVER) }).hit, '删 OBV_EXEMPT_ZH 后应转 hit');
});
test('D8 删 OBV_EXEMPT_EN → 「testing is required」良性转 hit（豁免反向证明）', () => {
  const t = 'It is obvious that further testing is required before launch.';
  assert(!checkAppealToIgnorance(t).hit, '正常应放行');
  assert(checkAppealToIgnorance(t, { OBV_EXEMPT_EN: new RegExp(NEVER) }).hit, '删 OBV_EXEMPT_EN 后应转 hit');
});

// ─── E. 加性证明：杀全部 R4 新常量后，既有 R1-R3 路由仍命中 ─────
test('E1 加性——杀全部 R4 常量，既有 R1 推定形攻击不受影响', () => {
  const t = '你证明不了我错了，那就说明我是对的。';
  const killed = checkAppealToIgnorance(t, {
    OBV_STRONG_ZH: new RegExp(NEVER), OBV_STRONG_EN: new RegExp(NEVER),
    OBV_WEAK_ZH: new RegExp(NEVER), WAIVE_ZH: new RegExp(NEVER),
    OBV_WEAK_EN: new RegExp(NEVER), WAIVE_EN: new RegExp(NEVER),
    OBV_EXEMPT_ZH: new RegExp(NEVER), OBV_EXEMPT_EN: new RegExp(NEVER),
  });
  assert(killed.hit, 'R4 是补丁非替换——既有 R1 应仍命中');
});
test('E2 加性——杀全部 R4 常量，既有 R2 需求形攻击不受影响', () => {
  const t = '你拿不出反证，就先闭嘴，听我的。';
  const killed = checkAppealToIgnorance(t, {
    OBV_STRONG_ZH: new RegExp(NEVER), OBV_STRONG_EN: new RegExp(NEVER),
    OBV_WEAK_ZH: new RegExp(NEVER), WAIVE_ZH: new RegExp(NEVER),
    OBV_WEAK_EN: new RegExp(NEVER), WAIVE_EN: new RegExp(NEVER),
    OBV_EXEMPT_ZH: new RegExp(NEVER), OBV_EXEMPT_EN: new RegExp(NEVER),
  });
  assert(killed.hit, 'R4 是补丁非替换——既有 R2 应仍命中');
});

// ─── F. gate 层端到端 ──────────────────────────────────────────
test('F1 gate 层攻击非 pass 且 appeal_to_ignorance finding 在场', () => {
  const atk = [
    '这是常识问题，不需要数据，大家心里都清楚。',
    '稍微有点经验的人都认同这个判断，这就是不争的事实。',
    'It is self-evident that the plan is flawed.',
    'Anyone with common sense can see that this will not work.',
    'Common sense says this is fine, so no proof is needed.',
  ];
  for (const t of atk) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
    assert((g.findings || []).some((f) => f.dimension === 'appeal_to_ignorance'), '缺 appeal_to_ignorance finding: ' + t);
  }
});
test('F2 gate 层索取证据形/概念教学形良性 pass（锁死）', () => {
  const ben = [
    '在数学中，公理是不证自明的，其余命题都需要证明。',
    '从常识来说，下雨天路上会堵，我们提前出门吧。',
  ];
  for (const t of ben) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action === 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});
test('F3 gate 层豁免良性无本族 finding（「It is obvious…testing is required」由存量 fallacies 启发式代拦，非本族增量）', () => {
  const t = 'It is obvious that further testing is required before launch.';
  const g = gate.gate(t);
  assert(!(g.findings || []).some((f) => f.dimension === 'appeal_to_ignorance'),
    '模块层已豁免，gate 层不应出现本族 finding（存量 fallacies 启发式噪声另计）');
});

// ─── G. 接线零改动纪律（②：不新增 dimMap 键） ───────────────────
test('G1 src/index.js 接线零改动 + discriminate 命中 appeal_to_ignorance', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert((src.match(/appeal_to_ignorance: aig,/g) || []).length === 2, 'appeal_to_ignorance 登记应仍为 2 处（dimMap + dimensions，② 不新增键）');
  assert(!/checkAppealToIgnorance\(_normText,/.test(src), 'index.js 调用点不应传 inject（零改动）');
  const disc = gate.discriminate('稍微有点经验的人都认同这个判断，这就是不争的事实。');
  const entry = disc.dimensions.appeal_to_ignorance;
  assert(entry && (entry.hit === true || (entry.score ?? 0) > 0), 'discriminate 应命中 appeal_to_ignorance: ' + JSON.stringify(entry));
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');

// 清理：本轮仅用 inject 参数删条，无全局态、无临时文件；显式回收引用。
results.length = 0;
process.exit(fail > 0 ? 1 : 0);
