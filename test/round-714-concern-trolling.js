/**
 * test/round-714-concern-trolling.js
 *
 * [r714] 第 145 维度 concern_trolling（伪关心）TDD 测试。
 *
 * 背景：decision 本体选出（scripts/decide-r714.js，composite_score
 * 0.84 / confidence 0.7 / identity alignment 0.8）。候选题池来自
 * r714 探测器 scripts/round-714-family-probe.js，本轮在当前引擎
 * （v6.8.59，144 维）上复测：攻击漏判 9/10（90%）、真零命中 7/9、
 * 良性 0/12 误伤。判据从严：只有 gate.discriminate() 的
 * gate.action === 'pass' 才算漏判。
 *
 * 本轮是真升级①（新增第 145 个判别维度）。
 * 判据两条路由任一成立：
 *   ① 关心包装×贬低控制双腿共现（缺一不判）；
 *   ② 关心包装×排他垄断双腿共现（把「愿意批评你」垄断成特权）。
 *
 * 与既有维度分工由 D 组锁住：
 *   · guilt_induction / emotional_manipulation 管情感债务制造
 *     （「我为你付出这么多」归它），本族可毫无付出叙事；
 *   · tone_policing 管压制表达方式（「你说话客气点」归它）；
 *   · bad_faith 检测表里的 en_concern_trolling pattern 只认字面
 *     「you are concern trolling」的指控句，本族管运用话术本身。
 *
 * 基准规模：攻击 20 条（中文 10 + 英文 10）、良性 21 条（中文 11 +
 * 英文 10）、边界锁 11 条、分工边界 2 条、gate 层 5 条。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkConcernTrolling } = require(path.join(HF, 'src/concern-trolling.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

function gateAction(t) {
  const r = gate.discriminate(t);
  return { action: (r.gate && r.gate.action) || r.action, dims: r.dimensions || {}, r };
}

// ─── A. 单维层：攻击 20 条全命中（逐条双腿注释）──────────────────────
test('A1 中文攻击 10 条单维全命中（腿①关心包装×腿②贬低控制/路由二排他）', () => {
  const attacks = [
    // 腿①为你好 × 腿②你这些问题
    '我是为你好，才指出你这些问题的',
    // 腿①关心你 × 腿②别人谁愿意（路由二排他垄断）
    '我这么说都是关心你，别人谁愿意跟你说这些',
    // 腿①为你好 × 腿②你这样下去不行
    '为你好才提醒你，你这样下去不行',
    // 腿①为你好 × 腿②不识好人心
    '别不识好人心，我这些都是为你好',
    // 腿①关心你 × 腿②难听话（同时命中路由二换别人）
    '我关心你才说这些难听话，换别人我才不管',
    // 腿①为你好 × 腿②你这些问题（插入语形：身为你的朋友）
    '身为你的朋友，我必须为你好，把你这些问题指出来',
    // 腿①担心你 × 腿②批评你
    '我是担心你才批评你的，这是负责任的表现',
    // 腿①为你好 × 腿②你总是
    '我都是为你好，你总是这个态度',
    // 腿①关心你 × 腿②你不听劝
    '关心你才劝你，你不听劝以后吃亏别怪我',
    // 腿①为你好 × 腿②不知好歹
    '为你好还不领情，别不知好歹',
  ];
  for (const t of attacks) {
    const r = checkConcernTrolling(t);
    assert(r.hit, '未命中: ' + t + ' :: ' + r.detail);
  }
});

test('A2 英文攻击 10 条单维全命中（care×belittle）', () => {
  const attacks = [
    // 腿① because I care × 腿② only saying this
    'I am only saying this because I care about you.',
    // 腿① for your own good × 腿② hard truths
    'I am telling you this for your own good, these are hard truths.',
    // 腿① a real friend would × 腿② hard truths
    'A real friend would tell you these hard truths, and I care enough to do it.',
    // 腿① I care about you × 腿② your problems
    'I care about you, that is why I keep pointing out your problems.',
    // 腿① because I care × 腿② these problems
    'I have to bring up these problems because I care about you.',
    // 腿① for your own good × 腿② nobody else would
    'For your own good I will say what nobody else would say to you.',
    // 腿① I care enough × 腿② hard truths
    'I care enough to tell you the hard truths about your work.',
    // 腿① a real friend would × 腿② your problems
    'A real friend would point out your problems, and that is what I am doing.',
    // 腿① because I care × 腿② hard truths
    'Someone has to say these hard truths, and I do it because I care.',
    // 腿① I care about you × 腿② only saying this
    'I am only saying this because I care about you and your future.',
  ];
  for (const t of attacks) {
    const r = checkConcernTrolling(t);
    assert(r.hit, '未命中: ' + t + ' :: ' + r.detail);
  }
});

// ─── B. 良性层：21 条不命中且 gate pass（含存量误伤归属说明）───────────
test('B1 中文良性 11 条单维不命中且 gate pass', () => {
  const benign = [
    // 正常关心询问
    '你最近看起来状态不好，发生什么事了吗',
    // 正常担心+邀请表达
    '这件事我有点担心，想听听你的想法',
    // 正常提供帮助
    '如果你需要帮助，随时跟我说',
    // 正常共情
    '我理解你的顾虑，我们一起想办法解决',
    // 正常提醒（具体事务，无贬低内容）
    '作为朋友我提醒你一下，这个合同条款要仔细看',
    // 正常健康提醒
    '你的健康数据有些异常，建议去医院检查一下',
    // 正常建议（供参考）
    '这个方案有风险，我建议再评估一遍，供你参考',
    // 尊重决定+说出担心（高危边界：关心包装在场但无贬低腿）
    '我尊重你的决定，只是把我的担心说出来供你参考',
    // 正常批评（无关心包装腿）
    '你这个方案有问题，理由是数据不支持',
    // 元话语：伪关心概念分析
    '伪关心是一种用关心包装的控制手法',
    // 第三人称职务：心理咨询师复盘
    '心理咨询师说，你丈夫总是说为你好才批评你，这是伪关心的话术',
  ];
  for (const t of benign) {
    const r = checkConcernTrolling(t);
    assert(!r.hit, '误伤: ' + t + ' :: ' + r.detail);
    const g = gateAction(t);
    assertEqual(g.action, 'pass', '良性未 pass: ' + t);
  }
});

test('B2 英文良性 10 条单维不命中且 gate pass', () => {
  const benign = [
    'I am worried about you, let me know if you need anything.',
    'That sounds tough — do you want to talk about it?',
    'Just a heads-up: the deadline moved to next Monday.',
    'I care about this project, so let us review the data together.',
    'Your presentation had some gaps, here are my notes on them.',
    'Concern trolling is a tactic where criticism is disguised as care.',
    'The therapist explained how "for your own good" can be controlling.',
    'If you ever want to talk, I am here for you.',
    'I think this approach has risks, but the decision is yours.',
    'A good friend supports your choices even when they disagree.',
  ];
  for (const t of benign) {
    const r = checkConcernTrolling(t);
    assert(!r.hit, '误伤: ' + t + ' :: ' + r.detail);
    const g = gateAction(t);
    assertEqual(g.action, 'pass', '良性未 pass: ' + t);
  }
});

// ─── C. 边界锁：单腿/豁免边界，刻意不判 ─────────────────────────────
test('C 组 边界锁 11 条（单腿不判、豁免在场不判）', () => {
  const cases = [
    // 只有腿①（为你好）无腿②无排他：正常建议
    ['这个建议是为你好，你可以考虑一下', '只有腿①'],
    // 只有腿①（关心你）：正常关心
    ['关心你才告诉你这件事的', '只有腿①无腿②'],
    // 只有腿①（EN）：正常关心
    ['I care about you.', '只有腿① EN'],
    // 只有腿②（你这些问题）无腿①：正常批评
    ['你这些问题需要整改，这是检查报告', '只有腿②'],
    // 只有腿②（难听话）无腿①：正常预告
    ['我要说难听话了，你做好准备', '只有腿②无腿①'],
    // 只有腿②（EN）：正常反馈
    ['These problems need to be fixed before release.', '只有腿② EN'],
    // 排他但无关心包装腿：不是伪关心语境
    ['除了我没人会来帮你', '排他无关心包装'],
    // 元话语（EN）：concern trolling 概念释义
    ['Concern trolling means using fake concern to control someone.', '元话语 EN'],
    // 第三人称（EN）：counselor 复盘
    ['The counselor described how concern trolling works in families.', '第三人称 EN'],
    // 元话语（中文变体）：伪关心字样
    ['这篇文章分析的是伪关心话术的套路', '元话语中文'],
    // 第三人称（中文变体）：调解员
    ['调解员提醒双方注意伪关心式的沟通', '第三人称中文'],
  ];
  for (const [t, why] of cases) {
    const r = checkConcernTrolling(t);
    assert(!r.hit, '边界误判（' + why + '）: ' + t + ' :: ' + r.detail);
  }
});

// ─── D. 分工边界：与 guilt_induction 共域样本 gate 层兜底 ────────────
test('D1 分工边界 2 条（本维度可判性不锁，锁 gate 层非 pass）', () => {
  const cases = [
    // 「我为你付出这么多」归 guilt_induction（情感债务制造）；
    // 本维度腿①无（无 为你好/关心你/担心你 字样），gate 层兜底只要求非 pass
    '我为你付出这么多，你就是这样回报我的？',
    // 归 tone_policing（压制表达方式）：本维度腿①无
    '你说话太冲了，客气一点会死吗',
  ];
  for (const t of cases) {
    const g = gateAction(t);
    assert(g.action !== 'pass', '分工样本 gate 层为 pass（无任何维度兜底）: ' + t + ' [' + g.action + ']');
  }
});

// ─── E. gate 层：登记与行动级 ─────────────────────────────────────
test('E1 攻击样本 dimensions.concern_trolling 登记且 gate.action 为 verify', () => {
  const t = '我是为你好，才指出你这些问题的';
  const g = gateAction(t);
  const ctr = g.dims.concern_trolling;
  assert(ctr, 'dimensions 缺少 concern_trolling 键');
  const cnt = ctr.count != null ? ctr.count : (Array.isArray(ctr.hits) ? ctr.hits.length : 0);
  assert(cnt > 0, 'concern_trolling count 为 0: ' + JSON.stringify(ctr).slice(0, 120));
  assertEqual(g.action, 'verify', '攻击样本 action 应为 verify');
});

test('E2 findings 含 concern_trolling 维度', () => {
  const g = gateAction('我关心你才说这些难听话，换别人我才不管');
  const findings = g.r.findings || [];
  assert(findings.some((f) => f.dimension === 'concern_trolling'), 'findings 缺少 concern_trolling');
});

test('E3 summary 引用「处伪关心」', () => {
  const g = gateAction('为你好才提醒你，你这样下去不行');
  const summary = String(g.r.summary || '');
  assert(summary.includes('伪关心'), 'summary 未引用 伪关心: ' + summary.slice(0, 200));
});

test('E4 全部攻击 20 条 gate 层非 pass（逐条 action 分布记录）', () => {
  const attacks = [
    '我是为你好，才指出你这些问题的', '我这么说都是关心你，别人谁愿意跟你说这些',
    '为你好才提醒你，你这样下去不行', '别不识好人心，我这些都是为你好',
    '我关心你才说这些难听话，换别人我才不管', '身为你的朋友，我必须为你好，把你这些问题指出来',
    '我是担心你才批评你的，这是负责任的表现', '我都是为你好，你总是这个态度',
    '关心你才劝你，你不听劝以后吃亏别怪我', '为你好还不领情，别不知好歹',
    'I am only saying this because I care about you.',
    'I am telling you this for your own good, these are hard truths.',
    'A real friend would tell you these hard truths, and I care enough to do it.',
    'I care about you, that is why I keep pointing out your problems.',
    'I have to bring up these problems because I care about you.',
    'For your own good I will say what nobody else would say to you.',
    'I care enough to tell you the hard truths about your work.',
    'A real friend would point out your problems, and that is what I am doing.',
    'Someone has to say these hard truths, and I do it because I care.',
    'I am only saying this because I care about you and your future.',
  ];
  for (const t of attacks) {
    const g = gateAction(t);
    assert(g.action !== 'pass', '攻击样本 gate 层 pass: ' + t + ' [' + g.action + ']');
  }
});

test('E5 concern_trolling 在 VERIFY 级集合（读 src/index.js 源）', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(/"concern_trolling"/.test(src) && /'concern_trolling',/.test(src), 'index.js 缺少 concern_trolling 接线');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
