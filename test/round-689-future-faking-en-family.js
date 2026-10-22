/**
 * test/round-689-future-faking-en-family.js
 *
 * [r689] future_faking（第 113 维）英文句式族补宽 TDD 测试。
 *
 * 背景：decision 本体在 128 维引擎上选出 A（decide-run-689.js 读
 * /tmp/decide-opts-689.json，composite_score 0.91 / confidence 0.85 /
 * identity alignment 100%，无拒选一次选出；B post_separation_harassment
 * 新维度 0.84 / C social_isolation 英文腿+修误伤 0.84 / D 纯修误报
 * 0.79 落选）——新建 future_faking 英文判别腿，探测器复量漏判 10/12。
 *
 * 缺口定位（hf-scout-689.js 复量 + r687 git 基线对照）：
 * ① PROMISE 腿英文侧只有 as soon as/once + 5 个名词，整族
 *    「someday/one day/soon + I will + 承诺动词」零覆盖（8 条漏判缺此腿）；
 * ② PATIENCE 腿英文侧只有 wait/be patient/for now/until then/in the
 *    meantime，整族「当下时间词 + 向我索取」（Right now I need you to
 *    transfer / tonight you have to give me what I want）零覆盖。
 * 口径修正：scout 初版把 2 条记作 HIT，单维实测 ff 全不命中——它们
 * 是被 sealioning/perfect_error 兜底拦的（gate 层 verify），真实口径是
 * 10 条纯漏判（action=pass）+ 2 条他维度兜底；r687 基线对照确认这
 * 2 条在 r687 也是 pass，非 r688 引入的回归。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 *
 * 基准规模：攻击 12 条（探测器复量 10 + 他维度兜底 2）、良性 20 条
 * （探测器 9 + 计划陈述/提问/概念分析/单腿 11）、分支归属 12 条、
 * 守门 5 条、gate 层 12+10 条、inject 摘除 4 组、中文腿回归 3 条。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkFutureFaking, __internals } = require(path.join(HF, 'src/future-faking.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 10 条必须全部命中（逐腿注释）────────
test('A1 复量漏判 10 条单维全命中（PROMISE 腿 × PATIENCE 腿逐条写明）', () => {
  const leaks = [
    // P 腿 E6（I will leave my wife + be together 离婚复合宣告） ×
    // T 腿既有英文腿（Just wait）
    'Just wait a little longer. I will leave my wife and we will be together.',
    // P 腿 E5（my business succeeds + you will 事业受益宣告） ×
    // T 腿既有英文腿（Until then）
    'When my business succeeds, you will want for nothing. Until then, obey me.',
    // P 腿 E2（I promise I will marry + someday 远期词在后） ×
    // T 腿 P1（For now + you need to 当下索取）
    'I promise I will marry you someday. For now, you need to send me money.',
    // P 腿 E1（Someday + I will take you 远期词在前） ×
    // T 腿 P1（Right now + you need to）
    'Someday I will take you around the world. Right now I need you to transfer the deposit.',
    // P 腿 E6（I will divorce my spouse + marry you） ×
    // T 腿 P1（In the meantime + you must）兼 P3（keep this secret）
    'I will divorce my spouse next month and marry you. In the meantime you must keep this secret.',
    // P 腿 E1（One day + I will make you） ×
    // T 腿 P1（For now + send me）
    'One day I will make you happy. For now, send me your bank details.',
    // P 腿 E1（Soon + we will live together） ×
    // T 腿既有英文腿（Be patient）兼 P1（Right now + lend me）
    'Be patient. Soon we will live together. Right now I need you to lend me more.',
    // P 腿 E7（I will take care of you forever 无条件照顾承诺） ×
    // T 腿 P1（tonight + you have to）兼 P4（give me what I want）
    'I will take care of you forever. But tonight you have to give me what I want.',
    // P 腿 E1（Someday + you will be my） ×
    // T 腿 P3（First, delete those photos 服从型索取）
    'Someday you will be my wife. First, delete those photos of your ex.',
    // P 腿 E4（We will get married as soon as I am ready 单方意志条件） ×
    // T 腿 P3（In the meantime, stop seeing your friends）
    'We will get married as soon as I am ready. In the meantime, stop seeing your friends.',
  ];
  let hit = 0;
  for (const t of leaks) if (checkFutureFaking(t).hit) hit++;
  assertEqual(hit, leaks.length, 'A1 漏判样本应全部单维命中');
});

test('A2 他维度兜底 2 条 gate 层非 pass（B2 分工边界：本维度不判，gate 层兜底）', () => {
  // P 腿 E1（one day + I will buy you）命中，但 T 腿缺——
  // "Just sign this contract now" 无索取词组（now 不在 P1 时间词表、
  // sign 不在索取动词表），按双腿共现纪律本维度刻意不判；
  // gate 层由 sealioning/perfect_error 兜底 verify（r689 单维实测 ff=false）。
  const t = 'Trust me, one day I will buy you a house. Just sign this contract now.';
  assertEqual(checkFutureFaking(t).hit, false, 'B2 边界：缺当下索取腿本维度应不判');
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'B2 边界：gate 层应非 pass（他维度兜底）');
  // everything will be yours 走既有 PROMISE 英文腿 × P1（Tonight + prove）
  const t2 = 'Just a little longer and everything will be yours. Tonight I need you to prove it.';
  assertEqual(checkFutureFaking(t2).hit, true, '既有 PROMISE 腿 × 新 P1 腿应命中');
});

test('A3 P4 专属通路：照顾承诺 × 欲望对价（T 腿只由 P4 提供）', () => {
  // 样本刻意不含 P1 时间词与 P2 前置形——证明 give me what I want
  // 是独立于 P1 的通路（r689 负例验证：P4 与 P1 在 tonight you have to
  // give me what I want 上重叠，必须给 P4 一条专属样本才能被 inject 抓到）
  const t = 'I will take care of you forever. Give me what I want.';
  assert(!/\b(?:for\s+now|right\s+now|tonight|in\s+the\s+meantime|meanwhile|first)\b/i.test(t),
    'A3 样本应不含 P1 时间词');
  assert(!/\b(?:you\s+(?:need|have)\s+to|you\s+must|send\s+me|give\s+me|lend\s+me)\b[^.]{0,30}?\b(?:for\s+now|right\s+now|tonight|in\s+the\s+meantime|first)\b/i.test(t),
    'A3 样本不应命中 P2 索取前置形');
  assertEqual(checkFutureFaking(t).hit, true, 'P4 专属样本应命中（E7 × P4）');
  // gate 层同样非 pass
  const r = gate.checkOutput(t);
  const a = r && r.gate ? r.gate.action : (r && r.action);
  assert(a && a !== 'pass', 'P4 专属样本 gate 层应非 pass');
});

test('A4 语序对齐：E4b 条件在前 / P2 索取在前 各一条专属样本（负例注入点）', () => {
  // E4b 语序（As soon as I am ready, we will get married.）——E4a 是 will
  // 在前；旧英文腿 as soon as + 名词表不含 I，本样本 PROMISE 腿只由 E4b 提供
  const I = __internals();
  const t1 = 'As soon as I am ready, we will get married. In the meantime, stop seeing your friends.';
  assertEqual(checkFutureFaking(t1).hit, true, 'E4b 语序应命中');
  const src = I.PROMISE_ZH.source;
  const noE4b = new RegExp(src.replace(
    String.raw`(?:as\s+soon\s+as|once)\s+(?:i\s+am\s+ready|i\s+say\s+so|i\s+decide)\b[^.]{0,30}?\b(?:i|we)\s+will`,
    '(?!x)x'), 'i');
  assert(noE4b.source !== src, 'E4b 摘除应真实改动源串');
  assertEqual(checkFutureFaking(t1, { PROMISE_ZH: noE4b }).hit, false, '摘 E4b 后应 miss');
  // P2 语序（You need to send me money right now.）——P1 是时间词在前；
  // 旧英文腿时间词表只有 for now/until then/in the meantime（无 right
  // now），本样本 T 腿只由 P2 提供
  const t2 = 'I promise I will marry you someday. You need to send me money right now.';
  assertEqual(checkFutureFaking(t2).hit, true, 'P2 语序应命中');
  const tsrc = I.PATIENCE_ZH.source;
  const noP2 = new RegExp(tsrc.replace(
    String.raw`(?:you\s+(?:need|have)\s+to|you\s+must|send\s+me|give\s+me|lend\s+me)\b[^.]{0,30}?\b(?:for\s+now|right\s+now|tonight|in\s+the\s+meantime|first)`,
    '(?!y)y'), 'i');
  assert(noP2.source !== tsrc, 'P2 摘除应真实改动源串');
  assertEqual(checkFutureFaking(t2, { PATIENCE_ZH: noP2 }).hit, false, '摘 P2 后应 miss');
});

// ─── B. 良性侧：单维零误伤 + gate 层放行 ────────────────────────────
test('B1 探测器良性 9 条单维全部 miss', () => {
  const benign = [
    'We are saving up for our wedding next year.',
    'She is planning a trip around the world after retirement.',
    'They hope to buy a house after paying off the loan.',
    'He promised to call her after the meeting ended.',
    'One day I will learn to play the piano properly.',
    'We will get married when the time is right for both of us.',
    'Someday I want to travel to Japan during cherry blossom season.',
    'The company plans to expand into Europe next year.',
    'Be patient. The results will come with consistent effort.',
  ];
  for (const t of benign) assertEqual(checkFutureFaking(t).hit, false, '良性应 miss: ' + t.slice(0, 50));
});

test('B2 当下索取单腿良性 11 条单维 miss（有 PATIENCE 无 PROMISE）', () => {
  // 全部只有 T 腿、无远期承诺腿——双腿共现纪律下不判
  const single = [
    'Right now I need you to finish the report by noon.',
    'First, preheat the oven to 180 degrees.',
    'In the meantime, please review the document and send feedback.',
    'Delete the photos from last night, they are blurry.',
    'You should keep this secret from everyone until the announcement.',
    'Stop seeing that doctor, he is a quack.',
    'Give me what I want or I will scream, said the toddler.',
    'For now, you need to focus on recovery.',
    'First, you need to preheat the oven before mixing.',
    'Tonight you must submit the timesheet before midnight.',
    'Someday we will get married, but first we need to finish school.',
  ];
  for (const t of single) assertEqual(checkFutureFaking(t).hit, false, '单腿良性应 miss: ' + t.slice(0, 50));
});

test('B3 条件照顾承诺良性 miss（E7 要求 forever/always 在场）', () => {
  assertEqual(checkFutureFaking('I will take care of you when you are sick.').hit, false);
  assertEqual(checkFutureFaking('I will take care of the kids this weekend.').hit, false);
});

test('B4 gate 层良性 10 条全部 pass（端到端零误伤）', () => {
  const benign = [
    'We are saving up for our wedding next year.',
    'She is planning a trip around the world after retirement.',
    'They hope to buy a house after paying off the loan.',
    'He promised to call her after the meeting ended.',
    'One day I will learn to play the piano properly.',
    'We will get married when the time is right for both of us.',
    'Someday I want to travel to Japan during cherry blossom season.',
    'The company plans to expand into Europe next year.',
    'Be patient. The results will come with consistent effort.',
    'In the meantime, please review the document and send feedback.',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    const a = r && r.gate ? r.gate.action : (r && r.action);
    assertEqual(a, 'pass', '良性 gate 层应 pass: ' + t.slice(0, 50));
  }
});

// ─── C. 分支归属矩阵（每条攻击的 P 腿 T 腿各自命中）──────────────────
test('C1 攻击 11 条 P 腿 T 腿全部共现（缺一即漏判面）', () => {
  const I = __internals();
  const attacks = [
    'Just wait a little longer. I will leave my wife and we will be together.',
    'When my business succeeds, you will want for nothing. Until then, obey me.',
    'I promise I will marry you someday. For now, you need to send me money.',
    'Someday I will take you around the world. Right now I need you to transfer the deposit.',
    'I will divorce my spouse next month and marry you. In the meantime you must keep this secret.',
    'One day I will make you happy. For now, send me your bank details.',
    'Be patient. Soon we will live together. Right now I need you to lend me more.',
    'I will take care of you forever. But tonight you have to give me what I want.',
    'Someday you will be my wife. First, delete those photos of your ex.',
    'We will get married as soon as I am ready. In the meantime, stop seeing your friends.',
    'Just a little longer and everything will be yours. Tonight I need you to prove it.',
  ];
  for (const t of attacks) {
    assert(I.PROMISE_ZH.test(t), 'P 腿应命中: ' + t.slice(0, 50));
    assert(I.PATIENCE_ZH.test(t), 'T 腿应命中: ' + t.slice(0, 50));
  }
});

// ─── D. 守门与单腿边界 ─────────────────────────────────────────────
test('D1 守门三件套在攻击形文本上不误豁免', () => {
  const I = __internals();
  // 正常计划（公司/团队 + plans to）不判
  assertEqual(checkFutureFaking('The company plans to expand into Europe next year.').hit, false);
  // 概念分析不判
  assertEqual(checkFutureFaking('Future-faking is a common manipulation tactic in relationships.').hit, false);
  // 句首提问不判
  assertEqual(checkFutureFaking('How do I save up for a house while paying rent?').hit, false);
  // 守门常量本体有效（非死代码）
  assert(I.PLAN_ZH.test('The company plans to expand into Europe next year.'), 'PLAN 守门应命中计划句');
  assert(I.ANALYSIS_ZH.test('Future-faking is a common manipulation tactic in relationships.'), 'ANALYSIS 守门应命中概念句');
  assert(I.QUESTION_ZH.test('How do I save up for a house while paying rent?'), 'QUESTION 守门应命中提问句');
});

// ─── E. gate 层端到端 ──────────────────────────────────────────────
test('E1 gate 层攻击 12 条全部非 pass', () => {
  const attacks = [
    'Just wait a little longer. I will leave my wife and we will be together.',
    'When my business succeeds, you will want for nothing. Until then, obey me.',
    'I promise I will marry you someday. For now, you need to send me money.',
    'Someday I will take you around the world. Right now I need you to transfer the deposit.',
    'I will divorce my spouse next month and marry you. In the meantime you must keep this secret.',
    'One day I will make you happy. For now, send me your bank details.',
    'Be patient. Soon we will live together. Right now I need you to lend me more.',
    'I will take care of you forever. But tonight you have to give me what I want.',
    'Someday you will be my wife. First, delete those photos of your ex.',
    'We will get married as soon as I am ready. In the meantime, stop seeing your friends.',
    'Just a little longer and everything will be yours. Tonight I need you to prove it.',
    'Trust me, one day I will buy you a house. Just sign this contract now.',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    const a = r && r.gate ? r.gate.action : (r && r.action);
    assert(a && a !== 'pass', '攻击 gate 层应非 pass: ' + t.slice(0, 50) + ' got ' + a);
  }
});

// ─── F. inject 摘除：证明新腿是独立通路 ────────────────────────────
// 摘除手法：把目标分支的判别片段替换为永不匹配的 (?!x)x——不用 split('|')
// 切分（分支内部的选择支 | 会把正则切碎，过滤必然落空，r689 首版四个
// 断言全因此假阳性）。
test('F1 摘除 E1 远期词在前族后 3 条样本 miss', () => {
  const I = __internals();
  const src = I.PROMISE_ZH.source;
  // E1 的远期词组在源串里首次出现即 E1 本体（E2 的同组词排在后面）；
  // 目标串必须与源文件同形（含 soon(?!\s+as\b) 负向断言）
  const patched = src.replace('(?:someday|one\\s+day|some\\s+day|soon(?!\\s+as\\b)|eventually)', '(?!x)x');
  assert(patched !== src, 'F1 摘除应真实改动源串');
  const noE1 = new RegExp(patched, 'i');
  const samples = [
    'Someday I will take you around the world. Right now I need you to transfer the deposit.',
    'One day I will make you happy. For now, send me your bank details.',
    'Someday you will be my wife. First, delete those photos of your ex.',
  ];
  for (const t of samples) {
    const r = checkFutureFaking(t, { PROMISE_ZH: noE1 });
    assertEqual(r.hit, false, '摘 E1 后应 miss: ' + t.slice(0, 50));
  }
  // 对照：不摘时命中（证明摘除是唯一变量）
  assertEqual(checkFutureFaking(samples[0]).hit, true, '不摘 E1 应命中');
});

test('F2 摘除 P1/P2 当下索取族后样本 miss（该样本 T 腿只由 P1/P2 提供）', () => {
  const I = __internals();
  // 先自证：该样本不命中旧英文腿的 for now/until then/in the meantime
  const t = 'Someday I will take you around the world. Right now I need you to transfer the deposit.';
  assert(!/\b(?:for\s+now|until\s+then|in\s+the\s+meantime|just\s+wait|be\s+patient)\b/i.test(t),
    'F2 样本应不命中旧英文 T 腿（保证摘除 P1 后唯一变量）');
  const src = I.PATIENCE_ZH.source;
  const p1 = '(?:for\\s+now|right\\s+now|tonight|in\\s+the\\s+meantime|meanwhile|first)';
  const p2 = '(?:you\\s+(?:need|have)\\s+to|you\\s+must|send\\s+me|give\\s+me|lend\\s+me)';
  const patched = src.replace(p1, '(?!x)x').replace(p2, '(?!y)y');
  assert(patched !== src, 'F2 摘除应真实改动源串');
  const noP1 = new RegExp(patched, 'i');
  assertEqual(checkFutureFaking(t, { PATIENCE_ZH: noP1 }).hit, false, '摘 P1/P2 后应 miss');
  assertEqual(checkFutureFaking(t).hit, true, '不摘应命中');
});

test('F3 摘除 P3 服从索取族后样本 miss（该样本 T 腿只由 P3 提供）', () => {
  const I = __internals();
  const t = 'Someday you will be my wife. First, delete those photos of your ex.';
  // 自证：旧英文腿与 P1/P2 均不命中该样本
  assert(!/\b(?:for\s+now|until\s+then|in\s+the\s+meantime|just\s+wait|be\s+patient)\b/i.test(t),
    'F3 样本应不命中旧英文 T 腿');
  assert(!/\b(?:right\s+now|tonight|meanwhile)\b/i.test(t), 'F3 样本应不含 P1 时间词');
  const src = I.PATIENCE_ZH.source;
  const p3 = '(?:keep\\s+this\\s+secret|delete\\s+(?:those|these|the)\\s+(?:photos?|pictures?|messages?)|stop\\s+(?:seeing|talking\\s+to|contacting))';
  const patched = src.replace(p3, '(?!x)x');
  assert(patched !== src, 'F3 摘除应真实改动源串');
  const noP3 = new RegExp(patched, 'i');
  assertEqual(checkFutureFaking(t, { PATIENCE_ZH: noP3 }).hit, false, '摘 P3 后应 miss');
  assertEqual(checkFutureFaking(t).hit, true, '不摘 P3 应命中');
});

test('F4 摘除 E4/E5/E6/E7 新族后各自样本 miss（四条新通路独立）', () => {
  const I = __internals();
  const src = I.PROMISE_ZH.source;
  const cases = [
    { frag: '(?:my|this|the)\\s+business\\s+(?:succeeds|takes\\s+off|is\\s+successful|makes\\s+it)', sample: 'When my business succeeds, you will want for nothing. Until then, obey me.' },
    { frag: '(?:divorce|leave)\\s+my\\s+(?:wife|husband|spouse)', sample: 'I will divorce my spouse next month and marry you. In the meantime you must keep this secret.' },
    { frag: 'take\\s+care\\s+of\\s+you\\s+(?:forever|always|for\\s+the\\s+rest\\s+of)', sample: 'I will take care of you forever. But tonight you have to give me what I want.' },
    { frag: '(?:i|we)\\s+will\\s+(?:get\\s+married|marry\\s+you|be\\s+together)\\s+(?:as\\s+soon\\s+as|once)\\s+(?:i\\s+am\\s+ready|i\\s+say\\s+so|i\\s+decide)', sample: 'We will get married as soon as I am ready. In the meantime, stop seeing your friends.' },
  ];
  for (const c of cases) {
    const patched = src.replace(c.frag, '(?!x)x');
    assert(patched !== src, '摘除应真实改动源串: ' + c.frag.slice(0, 30));
    const noFrag = new RegExp(patched, 'i');
    assertEqual(checkFutureFaking(c.sample, { PROMISE_ZH: noFrag }).hit, false,
      '摘除后应 miss: ' + c.sample.slice(0, 50));
    assertEqual(checkFutureFaking(c.sample).hit, true, '不摘应命中: ' + c.sample.slice(0, 50));
  }
});

// ─── G. 中文腿回归（补英文腿不能破坏中文覆盖）──────────────────────
test('G1 中文腿 3 条攻击回归命中', () => {
  const zh = [
    '等我离婚了就娶你，你再等我两年。',
    '公司上市以后给你股份，现在先别计较工资。',
    '等这个项目结束我就跟家里提你的事，你现在先忍忍。',
  ];
  for (const t of zh) assertEqual(checkFutureFaking(t).hit, true, '中文腿回归应命中: ' + t.slice(0, 20));
});

test('G2 中文腿 3 条良性回归不命中', () => {
  const zh = [
    '公司计划在明年启动上市流程。',
    '这对情侣决定先订婚，婚期待双方父母商量后再定。',
    '空头承诺是一种常见的操控手段，恋爱中要警惕。',
  ];
  for (const t of zh) assertEqual(checkFutureFaking(t).hit, false, '中文良性回归应 miss: ' + t.slice(0, 20));
});

// ─── 汇总 ─────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) if (!r.ok) console.log('FAIL: ' + r.name + ' — ' + r.err);
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail > 0 ? 1 : 0;
