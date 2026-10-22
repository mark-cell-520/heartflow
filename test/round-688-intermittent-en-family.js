/**
 * test/round-688-intermittent-en-family.js
 *
 * [r688] intermittent_reinforcement（第 121 维）英文句式族补宽 TDD 测试。
 *
 * 背景：decision 本体在 128 维引擎上选出 C（decide-run-688.js 读
 * decide-opts-688.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选；B future_faking 英文腿 0.91 /
 * A social_isolation 英文腿 0.90 / D fallacies 解锁 0.80 落选）——
 * 补 intermittent_reinforcement 英文句式族，探测器复量漏判 5/8。
 *
 * 缺口定位（hf-scout-688.txt 复量 + 源码核对）：该维度英文腿 A 侧
 * 只有 ALT_EN 的 blow hot and cold 习语，「第一人称交替叙事 /
 * 坏行+持续段 / 假离开回归」三类全无英文模式；腿 B 侧缺「效果
 * 宣告族」（that is how you learn / keeps you on your toes /
 * so happy to hear from me / do anything to keep me）。5 条漏判
 * 全部双腿齐缺、全维度零命中 5/5、误伤 0/9。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 *
 * 基准规模：攻击 10 条（探测器复量 5 + 分支变体 5）、良性 12 条
 * （探测器 9 + 单腿良性 3）、中文腿回归 3 条、守门与边界 5 条、
 * gate 层 12 条、inject 摘除 4 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkIntermittentReinforcement, __internals } = require(path.join(HF, 'src/intermittent-reinforcement.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 5 条必须全部命中（逐腿注释）────────
test('A1 复量漏判 5 条单维全命中（A 腿 × B 腿逐条写明）', () => {
  const leaks = [
    // A 腿 BADACT_EN（ignored + for three days 坏行持续段）×
    // B 腿 ADAPT_EN（learn to appreciate，既有英文腿——本样本只缺腿 A）
    'I ignored you for three days and then texted you at midnight, just so you would learn to appreciate me.',
    // A 腿 ALTNARR_EN（sometimes...sometimes 交替叙事）×
    // B 腿 PURPOSE_EN 支1（That is how you learn 教训宣告）
    'Sometimes I treat you like a queen and sometimes I pretend you do not exist. That is how you learn.',
    // A 腿 BADACT_EN（disappeared + for a week）×
    // B 腿 PURPOSE_EN 支3（you were so happy to hear from me 关注渴求宣告）
    'I canceled our plans and disappeared for a week. When I came back, you were so happy to hear from me.',
    // A 腿 ALTNARR_EN（one minute...the next）×
    // B 腿 PURPOSE_EN 支2（keeps you on your toes 紧张宣告）
    'I praise you one minute and insult you the next. That keeps you on your toes.',
    // A 腿 FAKELEAVE_EN（let you believe I was leaving, then came back 假离开回归）×
    // B 腿 PURPOSE_EN 支4（you will do anything to keep me 适配宣告）
    'I let you believe I was leaving, then I came back with flowers. Now you will do anything to keep me.',
  ];
  for (const t of leaks) {
    assert(checkIntermittentReinforcement(t).hit, '漏判样本未命中: ' + t.slice(0, 60));
  }
});

// ─── B. 分支变体（每个新分支一条独立变体，证明是族不是单条样本）───
test('B1 分支变体 5 条单维全命中', () => {
  const variants = [
    // ALTNARR_EN：one moment...the next（与 A1 样本4 的 one minute 同族）
    'One moment I adore you and the next I cannot stand the sight of you. That keeps you guessing.',
    // BADACT_EN：ghosted + for two weeks（无数量词 for days 分支另由 C 组锁）
    'I ghosted you for two weeks just so you would learn to appreciate me.',
    // FAKELEAVE_EN：made you think I was done, but then I came back（let/made 双形态）
    'I made you think I was done with you, but then I came back. Now you will do anything for me.',
    // PURPOSE_EN 支1：That is how you learn to respect me（教训宣告宾语变体）
    'I disappear for days without a word. That is how you learn to respect me.',
    // ALTNARR_EN + PURPOSE_EN 支4：sometimes...sometimes × do anything to keep me
    'Sometimes I give you everything and sometimes I take it all away. You would do anything to keep me.',
  ];
  for (const t of variants) {
    assert(checkIntermittentReinforcement(t).hit, '分支变体未命中: ' + t.slice(0, 60));
  }
});

// ─── C. 良性侧：探测器 9 条 + 单腿良性 3 条（双腿判据保护）───────
test('C1 探测器良性 9 条全部不判', () => {
  const benign = [
    'Relationships naturally have ups and downs over time.',
    'Everyone needs personal space sometimes.',
    'He apologized after a difficult week and they reconciled.',
    'Long-distance partners miss each other in cycles.',
    'Mood swings can be a sign of stress, not manipulation.',
    'They worked through a rough patch with honest conversations.',
    'Sometimes people need time alone to recharge.',
    'Reconciliation after a conflict can strengthen a relationship.',
    'She appreciated his effort to communicate more openly.',
  ];
  for (const t of benign) {
    assert(!checkIntermittentReinforcement(t).hit, '良性被误判: ' + t.slice(0, 60));
  }
});

// C2 单腿良性：腿 A 或腿 B 单独出现都不判（双腿共现才判的回归防线）
test('C2 单腿良性 3 条不判（交替无宣告 / 宣告无交替）', () => {
  const singleLeg = [
    // ALTNARR_EN 命中但无效果宣告（正常工作描述）
    'Sometimes I work from home and sometimes I go to the office.',
    // PURPOSE_EN 支1 命中但无坏极交替（正常教学语境）
    'That is how you learn to play chess well.',
    // PURPOSE_EN 支4 命中但无交替（正常宠物/情感描述）
    'My puppy would do anything to keep me company.',
  ];
  for (const t of singleLeg) {
    assert(!checkIntermittentReinforcement(t).hit, '单腿良性被误判: ' + t.slice(0, 60));
  }
});

// ─── D. 中文腿回归（英文改动不破坏中文既有能力）──────────────────
test('D1 中文攻击 3 条仍命中', () => {
  const zh = [
    '我这个人对你好坏看心情，你要学会珍惜我对你好的时候',   // A2 看心情 × B2 珍惜诱饵
    '我对你时好时坏都是因为太爱你，你要习惯我的反复无常',   // A1 × B3 归因于爱
    '别把我说的话当真，我时好时坏，你忍耐着就行',           // A1 × B4 压制记忆
  ];
  for (const t of zh) {
    assert(checkIntermittentReinforcement(t).hit, '中文样本未命中: ' + t);
  }
});

// ─── E. 守门与边界 ───────────────────────────────────────────────
test('E1 概念分析语境守门（CONCEPT_EN 生效 + 摘除后恢复）', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'Intermittent reinforcement means I sometimes praise you and sometimes insult you. That is how you learn.';
  assert(!checkIntermittentReinforcement(t).hit, 'E1a 概念分析语境应守门豁免');
  assert(checkIntermittentReinforcement(t, { CONCEPT_EN: blank() }).hit, 'E1b 摘除 CONCEPT_EN 后恢复命中');
});

test('E2 句首提问守门（QUESTION_ZH 的英文支覆盖）', () => {
  const t = 'How does intermittent reinforcement work in relationships?';
  assert(!checkIntermittentReinforcement(t).hit, 'E2a 句首咨询提问应豁免');
});

test('E3 空输入与过短文本不判', () => {
  assert(!checkIntermittentReinforcement('').hit, 'E3a');
  assert(!checkIntermittentReinforcement('hot and cold').hit, 'E3b');
});

test('E4 既有英文习语腿不受影响（blow hot and cold × learn to appreciate）', () => {
  assert(checkIntermittentReinforcement('I blow hot and cold, so learn to appreciate the days I am nice.').hit, 'E4a');
});

// ─── F. gate 层：聚合后 action 必须非 pass（VERIFY 级）────────────
test('F1 攻击 5 条 gate 层 count>0 且 action 非 pass', () => {
  const attacks = [
    'I ignored you for three days and then texted you at midnight, just so you would learn to appreciate me.',
    'Sometimes I treat you like a queen and sometimes I pretend you do not exist. That is how you learn.',
    'I canceled our plans and disappeared for a week. When I came back, you were so happy to hear from me.',
    'I praise you one minute and insult you the next. That keeps you on your toes.',
    'I let you believe I was leaving, then I came back with flowers. Now you will do anything to keep me.',
  ];
  for (const t of attacks) {
    const d = gate.discriminate(t);
    const dim = d.dimensions.intermittent_reinforcement;
    assert(dim && (dim.count > 0 || dim.totalHits > 0), 'gate 层维度未登记命中: ' + t.slice(0, 50));
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate action 应为非 pass: ' + t.slice(0, 50) + ' got ' + (r && r.gate && r.gate.action));
  }
});

test('F2 良性 5 条 gate 层 pass（单腿良性不误伤到聚合层）', () => {
  const benign = [
    'Sometimes I work from home and sometimes I go to the office.',
    'That is how you learn to play chess well.',
    'My puppy would do anything to keep me company.',
    'Relationships naturally have ups and downs over time.',
    'Everyone needs personal space sometimes.',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action === 'pass', '良性应 pass: ' + t.slice(0, 50) + ' got ' + (r && r.gate && r.gate.action));
  }
});

// ─── G. inject 摘除（新常量逐一置空 → 对应样本 miss）──────────────
test('G1 摘除 BADACT_EN 后 A1 样本 1/3 miss', () => {
  const blank = () => new RegExp('(?!)');
  const s1 = 'I ignored you for three days and then texted you at midnight, just so you would learn to appreciate me.';
  const s3 = 'I canceled our plans and disappeared for a week. When I came back, you were so happy to hear from me.';
  assert(checkIntermittentReinforcement(s1, { BADACT_EN: blank() }).hit === false, 'G1a 样本1 应 miss');
  assert(checkIntermittentReinforcement(s3, { BADACT_EN: blank() }).hit === false, 'G1b 样本3 应 miss');
});

test('G2 摘除 ALTNARR_EN 后 A1 样本 2/4 miss', () => {
  const blank = () => new RegExp('(?!)');
  const s2 = 'Sometimes I treat you like a queen and sometimes I pretend you do not exist. That is how you learn.';
  const s4 = 'I praise you one minute and insult you the next. That keeps you on your toes.';
  assert(checkIntermittentReinforcement(s2, { ALTNARR_EN: blank() }).hit === false, 'G2a 样本2 应 miss');
  assert(checkIntermittentReinforcement(s4, { ALTNARR_EN: blank() }).hit === false, 'G2b 样本4 应 miss');
});

test('G3 摘除 FAKELEAVE_EN 后 A1 样本 5 miss', () => {
  const blank = () => new RegExp('(?!)');
  const s5 = 'I let you believe I was leaving, then I came back with flowers. Now you will do anything to keep me.';
  assert(checkIntermittentReinforcement(s5, { FAKELEAVE_EN: blank() }).hit === false, 'G3a');
});

// G4 摘除 PURPOSE_EN 后样本 2-5 miss 而样本 1 仍 hit
// （证明 PURPOSE_EN 是样本 2-5 的独立 B 腿通路，样本 1 走 ADAPT_EN）
test('G4 摘除 PURPOSE_EN 后样本 2-5 miss、样本 1 仍 hit', () => {
  const blank = () => new RegExp('(?!)');
  const s1 = 'I ignored you for three days and then texted you at midnight, just so you would learn to appreciate me.';
  const s2 = 'Sometimes I treat you like a queen and sometimes I pretend you do not exist. That is how you learn.';
  const s3 = 'I canceled our plans and disappeared for a week. When I came back, you were so happy to hear from me.';
  const s4 = 'I praise you one minute and insult you the next. That keeps you on your toes.';
  const s5 = 'I let you believe I was leaving, then I came back with flowers. Now you will do anything to keep me.';
  assert(checkIntermittentReinforcement(s1, { PURPOSE_EN: blank() }).hit === true, 'G4a 样本1 走 ADAPT_EN 应仍 hit');
  assert(checkIntermittentReinforcement(s2, { PURPOSE_EN: blank() }).hit === false, 'G4b');
  assert(checkIntermittentReinforcement(s3, { PURPOSE_EN: blank() }).hit === false, 'G4c');
  assert(checkIntermittentReinforcement(s4, { PURPOSE_EN: blank() }).hit === false, 'G4d');
  assert(checkIntermittentReinforcement(s5, { PURPOSE_EN: blank() }).hit === false, 'G4e');
});

test('G5 __internals 导出四个新常量', () => {
  const it = __internals();
  for (const k of ['ALTNARR_EN', 'BADACT_EN', 'FAKELEAVE_EN', 'PURPOSE_EN']) {
    assert(it[k] instanceof RegExp, '缺少导出: ' + k);
  }
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
