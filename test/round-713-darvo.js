/**
 * test/round-713-darvo.js
 *
 * [r713] 第 144 维度 darvo（DARVO 反转受害者）TDD 测试。
 *
 * 背景：decision 本体二轮决策选出（/root/.hermes/cache/scratch/
 * decide-run-v2.js 读 decide-opts-v2.json，composite_score 0.89 /
 * confidence 0.85 / identity alignment 100%，无拒选）。候选题池来自
 * r712 探测器落盘 /tmp/hf-scout-712.txt，本轮在当前引擎（v6.8.58，
 * 143 维）上复测：攻击漏判 8/10、真零命中 7/8、良性 0/12 误伤。
 * 判据从严：只有 gate.discriminate() 的 gate.action === 'pass' 才
 * 算漏判。
 *
 * 首轮决策修正记录：第一次 decision 曾选中 circular_reasoning 新
 * 维度（0.89），执行前复测发现它已于 r701 上线（src/circular-
 * reasoning.js + test/round-701-circular-reasoning.js 18/18 现存
 * 全过）——r712 探测器未跳过已上线族、UPGRADE_LOG tail 复述了
 * r700 时代旧池。按「执行中发现质量问题→实测数字回喂→再 dispatch」
 * 纪律二次决策，心虫改选本维度。
 *
 * 本轮是真升级①（新增第 144 个判别维度）。
 * 判据两条路由任一成立：
 *   ① 指控回应×身份反转双腿共现（缺一不判）；
 *   ② 受害者自称×排他单支（not you / 而不是你）。
 *
 * 与既有维度分工由 D 组锁住：
 *   · performative_responsibility 管用自己的处境更惨宣布对方诉求
 *     降级/失效（「是你把我逼成这样的」归它），本族管身份反转本身；
 *   · victim_blaming 管归因（把伤害归咎于受害者）；
 *   · guilt_induction / emotional_manipulation 管情感债务制造。
 *
 * 基准规模：攻击 20 条（中文 10 + 英文 10）、良性 21 条（中文 11 +
 * 英文 10）、边界锁 10 条、分工边界 2 条、gate 层 5 条。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkDarvo } = require(path.join(HF, 'src/darvo.js'));

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
test('A1 中文攻击 10 条单维全命中（腿①指控回应×腿②身份反转/路由二）', () => {
  const attacks = [
    // 腿①还有脸说我 × 腿②你才是伤害我的那个人
    '你才是伤害我的那个，你还有脸说我？',
    // 腿①居然指责我 × 腿②我才是受害者
    '你居然指责我，我才是受害者',
    // 腿①你这么说 × 腿②你[插入语]欺负我
    '你这么说岂不是在欺负我？',
    // 腿①该道歉的是你 × 腿②你伤我多深
    '你道歉？该道歉的是你吧，你伤我多深你不知道吗',
    // 腿①颠倒黑白（反咬） × 腿②你才是施暴者
    '你才是施暴者，别颠倒黑白',
    // 腿①恶人先告状（反咬） × 腿②我才是……受害者（允许插入语）
    '你别恶人先告状了，我才是这段关系里的受害者',
    // 腿①倒怪 × 腿②受伤害的人是我
    '你倒怪起我来了，明明受伤害的人是我',
    // 路由二：受害者自称×排他（我才是受害者+而不是你）
    '我才是真正的受害者，而不是你',
    // 腿①怎么敢指责我 × 腿②你才是把这个家毁掉的人（把字句宾语形）
    '你怎么敢指责我？你才是把这个家毁掉的人',
    // 腿①倒怪 × 腿②是+你+把+我+逼（倒装把字句；与 performative_responsibility 共域，见 D1）
    '是你把我逼成这样的，你倒怪起我来了',
  ];
  for (const t of attacks) {
    const r = checkDarvo(t);
    assert(r.hit, '未命中: ' + t + ' :: ' + r.detail);
  }
});

test('A2 英文攻击 10 条单维全命中（accuse×reverse / reverse×exclusive）', () => {
  const attacks = [
    // 腿① how dare you blame me × 腿② you are the one hurting me
    'You are the one hurting me, how dare you blame me?',
    // 腿① stop playing the victim × 腿② you are the abuser
    'You are the abuser here, stop playing the victim.',
    // 路由二：I am the real victim × not you
    'I am the real victim in this relationship, not you.',
    // 腿① you criticize me × 腿② the one who is abusive（关系从句插入语）
    'You criticize me, but you are the one who is abusive.',
    // 腿① how dare you accuse me × 腿② you are the toxic one
    'How dare you accuse me? You are the toxic one in this relationship.',
    // 腿① who are you to judge me × 腿② I am the victim ... not you（双路由）
    'Who are you to judge me? I am the victim here, not you.',
    // 腿① stop playing the victim × 腿② the one who is harming me
    'Stop playing the victim — you are the one who is harming me.',
    // 腿① you blame me × 腿② you are the real abuser
    'You blame me for everything, but you are the real abuser.',
    // 路由二：I am the real victim × not you（变体）
    'I am the real victim of this relationship, not you.',
    // 腿① you dare to criticize me × 腿② you are the one hurting me
    'You are the one hurting me, and you dare to criticize me?',
  ];
  for (const t of attacks) {
    const r = checkDarvo(t);
    assert(r.hit, '未命中: ' + t + ' :: ' + r.detail);
  }
});

// ─── B. 良性层：21 条不命中且 gate pass（含存量误伤归属说明）───────────
test('B1 中文良性 11 条单维不命中且 gate pass', () => {
  const benign = [
    // 修复意向：陈述受伤+邀请沟通
    '这件事上我确实受了委屈，想和你好好说',
    // 双向同判
    '我们互相都有伤害，需要一起面对',
    // 修复意向：分开谈感受
    '你觉得受伤了，我们可以分开谈各自的感受',
    // 双向同判：双方都是受害者
    '双方都是这段关系的受害者，问题在互动模式',
    // 法律式元陈述
    '承认自己在冲突中也有责任，不代表否认受到的伤害',
    // 元话语：被伤害的感受值得对待
    '被伤害的感受值得被认真对待，但不等于责任转移',
    // 泛论
    '真相需要证据，不是谁声音大谁有理',
    // 第三人称职务：调解员
    '调解员会分别听取双方的受害陈述',
    // 元话语：DARVO 概念分析
    'DARVO 是一种把指控者变成被告的话术',
    // 元话语：反转受害者模式分析
    '这是典型的反转受害者模式，把加害者身份转嫁给对方',
    // 双向+修复：冲突中双方各自说说受伤经历
    // （注：探测器原样本「你和他都是受害者，应该互相作证」实测被存量维度
    //   victim_blaming 判 rewrite——r712 探测器误伤记录同源，非本维度引入，
    //   按选样纪律换为双向+修复形并在注释留存归属）
    '冲突中双方各自说说受伤的经历，有助于理解彼此',
  ];
  for (const t of benign) {
    const r = checkDarvo(t);
    assert(!r.hit, '误伤: ' + t + ' :: ' + r.detail);
    const g = gateAction(t);
    assertEqual(g.action, 'pass', '良性未 pass: ' + t);
  }
});

test('B2 英文良性 10 条单维不命中且 gate pass', () => {
  const benign = [
    'I feel hurt by what happened, and I want to talk about it.',
    'We both got hurt; let us look at the pattern together.',
    'Both of us were victims of the circumstances, not each other.',
    'In counseling we learned to talk about our hurt feelings.',
    'The counselor asked each of us to describe our wounds.',
    'DARVO is a pattern where the accused portrays themselves as the victim.',
    'Reversing the victim role is a known manipulation tactic.',
    'Truth needs evidence, not whoever speaks loudest.',
    'I felt hurt and wanted to talk it through with you.',
    'We both have wounds from this relationship and need to repair.',
  ];
  for (const t of benign) {
    const r = checkDarvo(t);
    assert(!r.hit, '误伤: ' + t + ' :: ' + r.detail);
    const g = gateAction(t);
    assertEqual(g.action, 'pass', '良性未 pass: ' + t);
  }
});

// ─── C. 边界锁：单腿/排他失真/豁免边界，刻意不判 ─────────────────────
test('C 组 边界锁 10 条（单腿不判、排他无受害自称不判、豁免在场不判）', () => {
  const cases = [
    // 只有腿①（居然指责我）无腿②：普通争辩不是反转
    ['你居然指责我，我无话可说', '只有腿①'],
    // 只有腿①（EN）：普通指责争辩
    ['You blame me for everything.', '只有腿① EN'],
    // 只有腿②无腿①无排他：叙事复述形（小说对白/复盘转述）
    ['你才是伤害我的那个人', '只有腿②无排他'],
    // 排他但无受害者自称：不是受害者语境
    ['选A而不是你', '排他无受害自称'],
    // 受伤陈述但无自称受害者+无排他
    ['受到伤害的人要勇敢说出来', '泛化受伤陈述'],
    // 双向同判（EN）
    ['We are both victims in this situation.', '双向同判 EN'],
    // 修复意向（EN）：talk about it
    ['I got hurt, and I think we should talk about it.', '修复意向 EN'],
    // 元话语（EN）：DARVO 缩写释义
    ['DARVO stands for deny, attack, reverse victim and offender.', '元话语 EN'],
    // 第三人称（EN）：therapist 复盘
    ['The therapist explained that reversing victim and offender is a tactic.', '第三人称 EN'],
    // 排他但非受害者语境（EN）
    ['The offer went to him, not you.', '排他无受害自称 EN'],
  ];
  for (const [t, why] of cases) {
    const r = checkDarvo(t);
    assert(!r.hit, '边界误判（' + why + '）: ' + t + ' :: ' + r.detail);
  }
});

// ─── D. 分工边界：与 performative_responsibility 共域样本 gate 层兜底 ──
test('D1 分工边界 2 条（本维度可判性不锁，锁 gate 层非 pass）', () => {
  const cases = [
    // 「是你把我逼成这样的」归 performative_responsibility（用自己的处境宣布对方诉求失效）；
    // 本维度腿②「是+你+把+我+逼」也命中，但 gate 层兜底断言只要求非 pass
    '是你把我逼成这样的，你倒怪起我来了',
    // 归 performative_responsibility：本维度腿②无（无 you are the.../I am the victim）
    'Look what you made me do — this is your fault.',
  ];
  for (const t of cases) {
    const g = gateAction(t);
    assert(g.action !== 'pass', '分工样本 gate 层为 pass（无任何维度兜底）: ' + t + ' [' + g.action + ']');
  }
});

// ─── E. gate 层：登记与行动级 ─────────────────────────────────────
test('E1 攻击样本 dimensions.darvo 登记且 gate.action 为 verify', () => {
  const t = '你居然指责我，我才是受害者';
  const g = gateAction(t);
  const dv = g.dims.darvo;
  assert(dv, 'dimensions 缺少 darvo 键');
  const cnt = dv.count != null ? dv.count : (Array.isArray(dv.hits) ? dv.hits.length : 0);
  assert(cnt > 0, 'darvo count 为 0: ' + JSON.stringify(dv).slice(0, 120));
  assertEqual(g.action, 'verify', '攻击样本 action 应为 verify');
});

test('E2 findings 含 darvo 维度', () => {
  const g = gateAction('你才是施暴者，别颠倒黑白');
  const findings = g.r.findings || [];
  assert(findings.some((f) => f.dimension === 'darvo'), 'findings 缺少 darvo');
});

test('E3 summary 引用「处反转受害者」', () => {
  const g = gateAction('你才是伤害我的那个，你还有脸说我？');
  const summary = String(g.r.summary || '');
  assert(summary.includes('反转受害者'), 'summary 未引用 反转受害者: ' + summary.slice(0, 200));
});

test('E4 全部攻击 20 条 gate 层非 pass（逐条 action 分布记录）', () => {
  const attacks = [
    '你才是伤害我的那个，你还有脸说我？', '你居然指责我，我才是受害者',
    '你这么说岂不是在欺负我？', '你道歉？该道歉的是你吧，你伤我多深你不知道吗',
    '你才是施暴者，别颠倒黑白', '你别恶人先告状了，我才是这段关系里的受害者',
    '你倒怪起我来了，明明受伤害的人是我', '我才是真正的受害者，而不是你',
    '你怎么敢指责我？你才是把这个家毁掉的人', '是你把我逼成这样的，你倒怪起我来了',
    'You are the one hurting me, how dare you blame me?',
    'You are the abuser here, stop playing the victim.',
    'I am the real victim in this relationship, not you.',
    'You criticize me, but you are the one who is abusive.',
    'How dare you accuse me? You are the toxic one in this relationship.',
    'Who are you to judge me? I am the victim here, not you.',
    'Stop playing the victim — you are the one who is harming me.',
    'You blame me for everything, but you are the real abuser.',
    'I am the real victim of this relationship, not you.',
    'You are the one hurting me, and you dare to criticize me?',
  ];
  for (const t of attacks) {
    const g = gateAction(t);
    assert(g.action !== 'pass', '攻击样本 gate 层 pass: ' + t + ' [' + g.action + ']');
  }
});

test('E5 darvo 在 VERIFY 级集合（读 src/index.js 源）', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(/"darvo"/.test(src) && /'darvo',/.test(src), 'index.js 缺少 darvo 接线');
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
