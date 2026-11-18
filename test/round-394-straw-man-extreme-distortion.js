/**
 * test/round-394-straw-man-extreme-distortion.js
 *
 * [r394] 第 138 维度 straw_man（稻草人谬误）新增「极端歪曲归述」措辞家族
 * （真升级②——既有维度全新措辞家族；src/index.js 零改动、dimMap 键数不变）。
 *
 * 立项依据（scripts/round-394/probe-straw-extreme.js，HEAD 6.8.194 实测）：
 * 既有路由①-②要求「反驳尾巴 REFUTE 或绝对化负面归述 ABSOLUTE_NEG」共现，
 * 而「你的意思是要把规矩全废了」「照你这么说就等着倒闭」「所以你是说穷人
 * 活该穷」这一族只靠把对方立场夸成荒诞极端承载谬误，句中无反驳尾巴也无
 * 绝对化负面归述——攻击穿透 10/16 整族射程外；良性含转述标记 + 「全部/所有」
 * 的正当确认问句零本族误伤（存量 contradiction/fallacy_of_relevance/perfect_error
 * 基线误伤不计本族增量）。
 *
 * 新路由③（union，与①②互补）：转述标记（强 ATTRIB_STRONG / 弱 ATTRIB_WEAK /
 * 意图 ATTRIB_WANT_ZH / 推断 ATTRIB_INFER_ZH 任一）× 不可歧义荒诞 caricature
 * （DISTORT_ZH / DISTORT_EN）共现。
 *
 * 覆盖：模块层攻击命中 / 良性零误伤 / 精度保持（歧义「全部取消」主动漏判）/
 * 逐常量注入删条负例 / 加性证明（③是补丁非替换）/ gate 层端到端 / 接线零改动。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkStrawMan } = require(path.join(HF, 'src/straw-man.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const NEVER = '__r394_negtest_never__';

// ─── A. 模块层：新族攻击全命中（路由③） ────────────────────────────
test('A1 中文新族攻击命中（转述标记 × 荒诞 caricature）', () => {
  const atk = [
    '你的意思是要把公司规矩全废了，让大家想干嘛干嘛呗？', // WEAK × 想干嘛干嘛
    '照你这么说，我们就该什么都不做，等着倒闭算了？',     // STRONG × 等着倒闭
    '所以你是说穷人活该穷，对吧？',                        // STRONG(你是说) × 活该穷
    '你无非是想把教育彻底放飞，谁都可以不考试。',          // ATTRIB_WANT × 彻底放飞
    '他反对加税，看来他是想让政府直接停摆。',              // ATTRIB_INFER × 停摆
    '这么说来，你是不想干任何活，躺着等别人养你。',        // ATTRIB_INFER × 躺着等养
    '看来你是想让项目直接停摆才甘心。',                    // ATTRIB_INFER × 停摆
  ];
  for (const t of atk) assert(checkStrawMan(t).hit, '未命中: ' + t);
});

test('A2 英文新族攻击命中（既有 EN 转述 × 荒诞 caricature）', () => {
  const atk = [
    "So you're saying we should just ban all cars and go back to horses?",
    'By your logic, we should abolish the entire department and hire nobody?',
    "You mean we should cancel all meetings and never plan anything again?",
    "So what you're saying is anyone who disagrees should be fired on the spot?",
    "Are you saying we should just scrap the whole system and start from zero?",
  ];
  for (const t of atk) assert(checkStrawMan(t).hit, '未命中: ' + t);
});

// ─── B. 良性：含转述标记 + 「全部/所有」的正当确认/复述零误伤 ──────
test('B1 良性含转述标记零误伤（锁最易误伤族）', () => {
  const ben = [
    '你的意思是说，我们先把A模块做完，再评估B模块，对吗？',
    '你的意思是说，全部样本都需要重新标注？',   // 弱转述 × 全部…重新标注（非荒诞）
    '按你的逻辑，优先级高的任务应该先处理？',
    '你是指接口的响应时间会变慢吗？',
    'Do you mean we should run the tests before deploying?',
    "So you're saying the budget needs reallocation, not more funding?",
    'By your logic, higher-priority tasks should be handled first?',
    '如果什么都不做，这个项目确实会落后，所以我们要行动起来。', // 无转述标记
  ];
  for (const t of ben) assert(!checkStrawMan(t).hit, '误伤: ' + t);
});

// ─── C. 精度保持：歧义「全部取消」主动漏判（不入表，保精度） ──────
test('C1 精度保持——「按你的逻辑…全部取消」不判', () => {
  assert(!checkStrawMan('按你的逻辑，不喜欢的政策就该全部取消？').hit,
    '可能正当的动作优化应放行（不误伤方案裁剪讨论）');
});

// ─── D. 负例注入：逐条删掉本轮每个新模式，守卫必须变红 ────────────
test('D1 删 DISTORT_ZH → 「活该穷」样本转 miss', () => {
  const t = '所以你是说穷人活该穷，对吧？';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { DISTORT_ZH: new RegExp(NEVER) }).hit, '删 DISTORT_ZH 后应 miss');
});
test('D2 删 DISTORT_EN → EN 样本转 miss', () => {
  const t = 'By your logic, we should abolish the entire department and hire nobody?';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { DISTORT_EN: new RegExp(NEVER) }).hit, '删 DISTORT_EN 后应 miss');
});
test('D3 删 ATTRIB_WANT_ZH → 「你无非是想」样本转 miss', () => {
  const t = '你无非是想把教育彻底放飞，谁都可以不考试。';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_WANT_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_WANT_ZH 后应 miss');
});
test('D4 删 ATTRIB_INFER_ZH → 「看来他是想让」样本转 miss', () => {
  const t = '他反对加税，看来他是想让政府直接停摆。';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_INFER_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_INFER_ZH 后应 miss');
});

// ─── E. 加性证明：杀全部新常量后，既有路由①攻击仍命中 ────────────
test('E1 加性——杀全部新常量，既有路由①攻击不受影响', () => {
  const t = '你无非就是想说不用加班，那公司业绩谁来管';
  const killed = checkStrawMan(t, {
    DISTORT_ZH: new RegExp(NEVER), DISTORT_EN: new RegExp(NEVER),
    ATTRIB_WANT_ZH: new RegExp(NEVER), ATTRIB_INFER_ZH: new RegExp(NEVER),
  });
  assert(killed.hit, '路由③是补丁非替换——既有路由①应仍命中');
});

// ─── F. gate 层端到端 ──────────────────────────────────────────
test('F1 gate 层攻击非 pass 且 straw_man finding 在场', () => {
  const atk = [
    '你的意思是要把公司规矩全废了，让大家想干嘛干嘛呗？',
    '所以你是说穷人活该穷，对吧？',
    "So you're saying we should just ban all cars and go back to horses?",
  ];
  for (const t of atk) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
    assert((g.findings || []).some((f) => f.dimension === 'straw_man'), '缺 straw_man finding: ' + t);
  }
});
test('F2 gate 层良性含转述标记 pass（锁死）', () => {
  const ben = ['你的意思是说，全部样本都需要重新标注？', 'Do you mean we should run the tests before deploying?'];
  for (const t of ben) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action === 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

// ─── G. 接线零改动纪律（②：不新增 dimMap 键） ───────────────────
test('G1 src/index.js 接线零改动 + discriminate 命中 straw_man', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert((src.match(/straw_man: smw,/g) || []).length === 2, 'straw_man 登记应仍为 2 处（dimMap + dimensions，② 不新增键）');
  const disc = gate.discriminate('你的意思是要把公司规矩全废了，让大家想干嘛干嘛呗？');
  assert(disc.dimensions.straw_man && (disc.dimensions.straw_man.count ?? 0) > 0, 'discriminate 应命中 straw_man');
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
