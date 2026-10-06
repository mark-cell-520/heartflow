/**
 * 第 86 维度 favor_ledger（恩情账本）守卫测试
 *
 * [r565] 立项：r563 建模块、r564 完成 8 处接线，但守卫测试一直空缺（r564
 * 遗留第 1 项「最优先」）。本文件补齐七联要求：
 *   ① 攻击命中（模块层 16/16）
 *   ② 良性零误伤（10 条主族 + 4 条豁免依赖族）
 *   ③ 变异守卫（六支逐支置空，对应样本必须翻向）
 *   ④ 端到端 rewrite 定级（gate.action 唯一取值 rewrite）
 *   ⑤ 接线回归（findings 归因 favor_ledger + dimMap/REWRITE_DIMS 登记）
 *   ⑥ 不侵占（sunk_cost_coercion / loyalty_test / concession_coercion 零归因）
 *   ⑦ 边界回归（豁免层破坏后良性族必须转红，证明守卫敏感而非巧合放行）
 *
 * 内容审查纪律：样本只存在于本文件，不进命令行 / 不进报告 / 不进 commit
 * message；跑完只报数字。
 *
 * 用法: node test/round-565-favor-ledger.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MOD_PATH = require.resolve('../src/favor-ledger.js');
const { checkFavorLedger } = require(MOD_PATH);
const { gate } = require('../src/gate.js');

// ── 攻击族：A1 人情债务 × A2 索取让步（zh×10 / en×6，与 r563 探针同源）──
const attacks = [
  '我当年帮了你那么大忙，这点小事你都不肯？',
  '没有我就没有你的今天，这件事你必须听我的。',
  '我替你扛过那么多事，让你担个名分算便宜你了。',
  '这些年我处处照应你，让你扛个责任别推。',
  '你当初升职是我拉的票，这点要求你看着办。',
  '我为你付出那么多，你怎么好意思拒绝我。',
  '这些年我对你的照顾你记着，这次该你担着了。',
  '当年要不是我拉你一把，你能有今天？现在听我的。',
  '我当年替你顶了那么多雷，这点委屈你受一下。',
  '我走关系帮你办下来的，你这个责任必须扛。',
  'I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
  'Considering everything I did for you, the least you can do is obey.',
];
const zhAtk = attacks.filter(s => /[\u4e00-\u9fff]/.test(s));
const enAtk = attacks.filter(s => !/[\u4e00-\u9fff]/.test(s));

// ── 良性主族：正当致谢 / 制度性回报（零误伤）──
const benign = [
  '真的很感谢你当年的帮助，我一直记在心里。',
  '感谢你这些年的提携，祝你今后一切顺利。',
  '这件事我们按合同约定办，该谁的责任谁担。',
  '人情归人情，工作按制度走，别混在一起。',
  '我很感激你，但这次评审仍按既定标准打分。',
  '谢谢你这些年的提携，我会一直记着你对我的好，但这次评审按标准打分。',
  '当年的事都过去了，我们向前看。',
  'Thank you for everything you have done for me.',
  'I will always remember your kindness and support.',
  'Per the contract, this decision follows the agreed terms.',
  'Personal favors aside, business is business.',
];

// ── 良性族 B（豁免层依赖）：A1×A2 同句在场，仅靠看守放行 ──
//   这些句子「过往付出」与「索取动作」的形状都在场，是否 miss 完全取决于
//   G1-G3 看守——把看守置空，它们必须转为命中（守卫敏感性）。
//   S2 只带 A1 不带 A2（「按标准打分」是切割语不是索取），因此它是
//   **A1 单腿**族：置空 GUARD_ZH 后仍 miss 是正确行为，改用「置空 LEDGER_ZH
//   才 miss」来覆盖它（diag4 已逐腿取证：S2 的 CLAIM_ZH=false）。故本文件
//   用 S1（A1×A2 双腿 + 看守放行）作为 GUARD 变异样本，S2 归良性主族。
const exemptZh = [
  '我真的很感激你当年的提拔，这点事情我自己看着办。',
];
const exemptEn = [
  'After all I have done for you, business is business — you cannot refuse to sign anything you have not read first.',
  'I will always remember your kindness; after all I did for you, do as I say — read the contract yourself before signing.',
];

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name} — ${e.message}`); }
}

console.log('== 第 565 轮 favor_ledger 守卫测试（第 86 维度）==');

// ── ① 模块层攻击命中 ─────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkFavorLedger(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── ② 良性零误伤 ─────────────────────────────────────────
check('favor_ledger 良性主族零误伤 0/' + benign.length, () => {
  const fp = benign.filter(s => checkFavorLedger(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── ③④ 端到端：非 pass、归因本维度、rewrite 定级 ───────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

check(`findings 归因 favor_ledger ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'favor_ledger'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（接线未进 findings）`);
});

check('gate 动作为 rewrite 级（第 86 维度定级）', () => {
  const actions = new Set(attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['rewrite'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── ⑤ 接线回归：登记三处齐全 ─────────────────────────────
check('接线回归：dimMap / REWRITE_DIMS / 计算三处登记齐全', () => {
  const reg = require('../src/index.js');
  const dimMap = reg.dimMap || (reg.__dimMap) || null;
  if (dimMap) assert.ok(dimMap.favor_ledger, 'dimMap 缺 favor_ledger 键');
  const idxSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(idxSrc.includes("name:'favor_ledger'") || idxSrc.includes("'favor_ledger'"),
    'index.js 无 favor_ledger 痕迹');
  assert.ok(/checkFavorLedger\s*\(/.test(idxSrc), 'index.js 未调用 checkFavorLedger');
  assert.ok(/\bfavor_ledger\b/.test(idxSrc), 'REWRITE_DIMS/guidance 未登记 favor_ledger');
});

// ── guidance 非空 ─────────────────────────────────────────
check('findings 携带 guidance', () => {
  const f = (gate(attacks[0]).findings || []).find(x => x.dimension === 'favor_ledger');
  assert.ok(f, '未找到 favor_ledger finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── ⑥ 不侵占：近邻维度零归因（r563 归因实测 0 命中的边界守住）──
check('不侵占 sunk_cost_coercion / loyalty_test / concession_coercion', () => {
  const NEIGHBORS = ['sunk_cost_coercion', 'loyalty_test', 'concession_coercion'];
  const bad = [];
  for (const s of attacks) {
    const dims = (gate(s).findings || []).map(f => f.dimension);
    for (const n of NEIGHBORS) if (dims.includes(n)) bad.push(n);
  }
  assert.equal(bad.length, 0, `越界归因: ${bad.join(',')}`);
});

// ── ⑦ 变异守卫：注入-删条-必须翻向 ─────────────────────────
//   的做法：把 `const X = new RegExp([ ... ].join('|'));` 整段替换成永不匹配
//   的正则。约束与 r551 相同：破坏后对应样本必须翻向，且不是全局崩溃
//   （另一语支仍应命中，证明只坏了指定支）。
// ⚠️ r565 踩坑：先按「整行 === ].join('|'));」找结尾，会把**后一个声明**
//   一起吃掉（LEDGER_EN 的 branches 里含多行 join 形状；且 EN 支结尾是
//   `].join('|'), 'i');`），表现为「置空 A 支报 B 支 is not defined」——
//   崩溃≠变红，假阳性。故必须按精确区间替换（见 breakDecl）。
function breakDecl(src, declName) {
  const head = `const ${declName} = new RegExp([`;
  const start = src.indexOf(head);
  assert.ok(start >= 0, `变异目标不存在: ${declName}`);
  // 两种合法结尾：].join('|')); 与 ].join('|'), 'i');（EN 三支带 'i' 旗标）
  const a = src.indexOf("].join('|'));", start);
  const b = src.indexOf("].join('|'), 'i');", start);
  const cands = [a, b].filter(x => x >= 0);
  assert.ok(cands.length > 0, `变异结尾不存在: ${declName}`);
  const endAt = Math.min(...cands);
  const end = endAt + (endAt === a ? "].join('|'));".length : "].join('|'), 'i');".length);
  const removed = src.slice(start, end);
  // 防御：被删区间内不得出现其它声明（否则变异会顺手删掉别的支）
  for (const other of ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']) {
    if (other !== declName) {
      assert.ok(!removed.includes(`const ${other}`), `变异越界：删 ${declName} 会连带删 ${other}`);
    }
  }
  assert.ok(src.slice(end).includes('function checkFavorLedger'), '变异把函数体删掉了');
  return src.slice(0, start) + `const ${declName} = /(?!)ZZ/i;` + src.slice(end);
}

function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-fl-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkFavorLedger;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;
const ORIG = fs.readFileSync(MOD_PATH, 'utf8');

check('变异守卫：置空 LEDGER_ZH 后中文攻击全部 miss、英文仍命中', () => {
  assert.equal(zhAtk.filter(s => checkFavorLedger(s).hit).length, zhAtk.length,
    '守卫前置失败：中文攻击未被全命中');
  const m = loadMutant(breakDecl(ORIG, 'LEDGER_ZH'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'LEDGER_ZH 置空后中文仍有命中');
  assert.equal(enAtk.filter(s => m(s).hit).length, enAtk.length, '英文支应不受影响');
});

check('变异守卫：置空 CLAIM_ZH 后中文攻击全部 miss', () => {
  const m = loadMutant(breakDecl(ORIG, 'CLAIM_ZH'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'CLAIM_ZH 置空后中文仍有命中');
});

check('变异守卫：置空 LEDGER_EN 后英文攻击全部 miss、中文仍命中', () => {
  const m = loadMutant(breakDecl(ORIG, 'LEDGER_EN'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'LEDGER_EN 置空后英文仍有命中');
  assert.equal(zhAtk.filter(s => m(s).hit).length, zhAtk.length, '中文支应不受影响');
});

check('变异守卫：置空 CLAIM_EN 后英文攻击全部 miss', () => {
  const m = loadMutant(breakDecl(ORIG, 'CLAIM_EN'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'CLAIM_EN 置空后英文仍有命中');
});

check('变异守卫：置空 GUARD_ZH 后中文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptZh.filter(s => checkFavorLedger(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_ZH'));
  assert.equal(exemptZh.filter(s => m(s).hit).length, exemptZh.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

check('变异守卫：置空 GUARD_EN 后英文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptEn.filter(s => checkFavorLedger(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_EN'));
  assert.equal(exemptEn.filter(s => m(s).hit).length, exemptEn.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

// ── 汇总 ─────────────────────────────────────────────────
console.log(`\n结果：${passed} 过 / ${failed} 败`);
process.exit(failed === 0 ? 0 : 1);
