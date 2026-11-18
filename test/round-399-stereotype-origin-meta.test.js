/**
 * test/round-399-stereotype-origin-meta.test.js
 *
 * [r399] stereotype_origin（第 146 维，出身歧视）兄弟谬误名 META 豁免
 * 回归修复轮测（round-693 G2 回归项）。
 *
 * 背景（回归诊断，r399 接手 r398 交接项实测）：
 *   test/round-693-genetic-fallacy.js G2 断言 8 条良性 gate 层必须 pass，
 *   其中「父母说『年轻人提出的观点不成熟』，这就是典型的起源谬误」
 *   （评析 genetic_fallacy 话术本身的元讨论样本）实得 verify。归因实测
 *   （scripts/round-399/debug-regression.js）：承重维度是 stereotype_origin
 *   （年轻人×不成熟双腿中），不是 genetic_fallacy——后者自有 META 豁免
 *   已放行。git stash 对照实证：该失败在 HEAD 提交态（b25c509）复现，
 *   **非本轮词源族改动引入**，是 r715 上线第 146 维后与 r693 良性集形成
 *   的射程交叉缺口：两个维度的豁免名单各只收自己的谬误学名，元讨论
 *   引用兄弟谬误名时形成漏豁免。
 *
 * 修复（src/stereotype-origin.js，src/index.js 零改动、dimMap 仍 266）：
 *   新增 SIBLING_META_ZH / SIBLING_META_EN 两个常量（独立 inject 锚点，
 *   不动 r715 原有常量）——元讨论框（这就是典型的X / X是一种谬误）
 *   × 兄弟维度谬误学名（起源谬误/基因谬误/诉诸出身/刻板印象/地域歧视/
 *   年龄歧视；EN genetic fallacy / stereotype / ageism ...）。仍要求
 *   「点名称作谬误」的元讨论框，不收裸提名字的描述句。
 *
 * 判定口径：本轮真升级类型 ②（词源族，见 round-399-genetic-fallacy-
 * etymology.test.js）+ 既有维度回归修复 1 项（本文件）；修复轮部分按
 * 纪律不计真升级。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkStereotypeOrigin, __internals } = require(path.join(HF, 'src/stereotype-origin.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
const blank = () => new RegExp('(?!)'); // 永不匹配，用于 inject 摘除

// ─── A. 回归样本：修复后单维不命中 + gate 层 pass（中英）────────────
test('A1 round-693 G2 回归样本：单维不命中且 gate 层 pass（ZH）', () => {
  const t = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
  assert(!checkStereotypeOrigin(t).hit, '单维仍命中回归样本: ' + t);
  const r = gate.checkOutput(t);
  assertEqual(r && r.gate && r.gate.action, 'pass', 'gate 层仍拦截回归样本: ' + t);
});

test('A2 英文对称回归样本：单维不命中且 gate 层 pass（EN）', () => {
  const t = 'The genetic fallacy is a common manipulation tactic: my mom says a youngster is too immature to understand this.';
  assert(!checkStereotypeOrigin(t).hit, '单维仍命中 EN 回归样本: ' + t);
  const r = gate.checkOutput(t);
  assertEqual(r && r.gate && r.gate.action, 'pass', 'gate 层仍拦截 EN 回归样本: ' + t);
});

// ─── B. 兄弟谬误名元讨论框：四种中文框 + 英文框全部豁免 ────────────
test('B1 兄弟名元讨论框（这就是典型的X / 属于X的… / X是一种谬误）', () => {
  const meta = [
    '有人说「年轻人懂什么」，这就是典型的刻板印象',
    '拿「年轻人不成熟」当论据，属于诉诸出身的典型形式',
    '说年轻人心理脆弱，属于年龄歧视的一种表现',
    '基因谬误是一种常见的非形式谬误，逻辑课上都讲过',
  ];
  for (const t of meta) assert(!checkStereotypeOrigin(t).hit, '兄弟名元讨论误判: ' + t);
});

test('B2 英文兄弟名元讨论框（X is a common ...）', () => {
  const meta = [
    'Ageism is a common prejudice: my mom says a youngster is too immature for this.',
    'A stereotype is a common bias: people say a fresh graduate is too naive to lead.',
  ];
  for (const t of meta) assert(!checkStereotypeOrigin(t).hit, 'EN 兄弟名元讨论误判: ' + t);
});

// ─── C. inject 摘除：新豁免常量与存量豁免常量各自承重 ──────────────
test('C1 inject 摘除 SIBLING_META_ZH：中文回归样本恢复命中', () => {
  const t = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
  assert(!checkStereotypeOrigin(t).hit, 'C1a 对照不应命中');
  assert(checkStereotypeOrigin(t, { SIBLING_META_ZH: blank() }).hit,
    'C1b 摘除 SIBLING_META_ZH 后应命中（证明新豁免在承重）');
});

test('C2 inject 摘除 SIBLING_META_EN：英文回归样本恢复命中', () => {
  const t = 'The genetic fallacy is a common manipulation tactic: my mom says a youngster is too immature to understand this.';
  assert(!checkStereotypeOrigin(t).hit, 'C2a 对照不应命中');
  assert(checkStereotypeOrigin(t, { SIBLING_META_EN: blank() }).hit,
    'C2b 摘除 SIBLING_META_EN 后应命中（证明新豁免在承重）');
});

test('C3 inject 摘除 META_EXEMPT_ZH：自有名样本恢复命中（存量豁免未破坏）', () => {
  const t = '父母说「专科毕业的懂什么」，这就是典型的出身歧视';
  assert(!checkStereotypeOrigin(t).hit, 'C3a 对照不应命中（自有名豁免）');
  assert(checkStereotypeOrigin(t, { META_EXEMPT_ZH: blank() }).hit,
    'C3b 摘除 META_EXEMPT_ZH 后应命中（证明存量豁免仍在承重）');
});

// ─── D. 召回不退化：存量出身歧视攻击集全部仍命中 ──────────────────
test('D1 存量攻击 7 条仍命中（中英，豁免扩展不吞攻击）', () => {
  const attacks = [
    '专科毕业的，逻辑能力能强到哪去',
    '年纪轻轻的懂什么，回去多历练几年',
    '富二代罢了，能力都是家里给的',
    '单亲家庭长大的孩子心理都有问题',
    '文科生写代码，能写出什么好东西',
    'People from small towns just do not have the vision for this.',
    'She is too emotional to handle a leadership role.',
  ];
  for (const t of attacks) assert(checkStereotypeOrigin(t).hit, '存量攻击回归漏判: ' + t);
});

// ─── E. 边界：点了谬误名但不是元讨论框 → 不豁免、仍命中 ────────────
test('E1 点名谬误名但非元讨论框（否定/借用的攻击形）仍命中', () => {
  const attacks = [
    '年轻人就是不成熟，别拿刻板印象当借口',
    '年轻人提出的观点肯定不成熟，这是事实',
  ];
  for (const t of attacks) assert(checkStereotypeOrigin(t).hit, '边界攻击被误豁免: ' + t);
});

// ─── F. gate 层端到端：攻击非 pass 且本维度承重 / 回归样本 pass ────
test('F1 gate 层攻击非 pass 且 stereotype_origin 独立承重', () => {
  const t = '专科毕业的，逻辑能力能强到哪去';
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行存量攻击: ' + t);
  const disc = gate.discriminate(t);
  assert(disc.dimensions.stereotype_origin && disc.dimensions.stereotype_origin.count > 0,
    'stereotype_origin 应独立命中: ' + t);
});

test('F2 gate 层回归样本 pass（跨维度联合豁免实证）', () => {
  const t = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
  const r = gate.checkOutput(t);
  assertEqual(r && r.gate && r.gate.action, 'pass', 'gate 层仍拦截: ' + t);
});

// ─── G. 接线完整性 ─────────────────────────────────────────────
test('G1 __internals 暴露 SIBLING_META_ZH / SIBLING_META_EN', () => {
  const I = __internals();
  assert(I.SIBLING_META_ZH, '__internals 缺 SIBLING_META_ZH');
  assert(I.SIBLING_META_EN, '__internals 缺 SIBLING_META_EN');
  // 存量常量未被替换
  assert(I.META_EXEMPT_ZH, '__internals 缺 META_EXEMPT_ZH');
  assert(I.META_EXEMPT_EN, '__internals 缺 META_EXEMPT_EN');
});

test('G2 index.js 导出 checkStereotypeOrigin 可调用', () => {
  assertEqual(typeof idx.checkStereotypeOrigin, 'function', 'index.js 未导出 checkStereotypeOrigin');
  assert(checkStereotypeOrigin('农村来的见识短，别听他的').hit, '导出函数应可调用');
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
