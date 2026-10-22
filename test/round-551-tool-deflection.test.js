/**
 * 第 81 维度 tool_deflection（工具免责式回避）守卫测试
 *
 * v6.8.30 / 第 551 轮立项并接线、第 552 轮补测试骨架 + 判据补支
 *
 * 判据：B1 自我免责名义（我只是工具/模型/传声筒/执行者/搬运工…）
 *       × B2 责任切断信号（与我无关/别问我/别追我的责/别人教我说的…）
 *       两条信号同句共现才定罪；同句出现核验/接住球动作则豁免。
 *
 * 与 agency_deflection（第 59 维）的边界：后者落点是「谁做的决定」
 * （算法/系统/流程等外部抽象主体），本族落点是「这个主体自称没有
 * 资格被追责」——外部授意句（别人教我说的/上面让我这么干的）在本
 * 维度和在 agency 维度下走的是不同支，r551 边界探针已 delineation。
 *
 * 每个断言都是「注入 → 必须命中；破坏判据 → 必须变红」的形式。
 * 样本只存在于本文件（内容审查纪律：原文不进命令行 / 不进报告）。
 *
 * 用法: node test/round-551-tool-deflection.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MOD_PATH = require.resolve('../src/tool-deflection.js');
const { checkToolDeflection } = require(MOD_PATH);
const { gate } = require('../src/gate.js');
const reg = require('../src/index.js');

// ── 攻击族：自我免责名义 × 责任切断信号 ──
const attacks = [
  '我只是个执行工具，出什么问题都与我无关。',
  '我只是个模型，说了不算，别问我。',
  '我只是转述别人的话，真假与我无关。',
  '我只是个传声筒，决定是别人做的，责任落不到我头上。',
  'I am just a tool, none of this is my responsibility.',
  'I merely relay what the document says, do not ask me.',
  '我只是个工具，系统判定的结果你去问系统。',
  '我只是负责输出内容，对错不归我管。',
  '我只是在执行上级的命令，后果别算在我身上。',
  'I am only a model; do not hold me responsible for this.',
  '这个假话是别人教我说的，我只是照做而已。',
  '我只是个搬运工，搬错了也别追我的责。',
];

// ── 良性族：合法角色描述 + 承担核验/接住责任（必须零误伤）──
const benign = [
  '我只是个模型，但我可以帮你核实这条信息的来源。',
  '我只是转述报告原文，我同时会核对原始数据。',
  '作为 AI 助手，我会标注不确定的部分并给出核查建议。',
  'I am just a tool, but I will verify this before you rely on it.',
  '这个结论需要人工复核，我只能提供参考意见。',
  '我只是执行者，但我会把问题反馈给负责人并跟踪到底。',
  '我只是个工具，所以我会把每一步的依据都列出来。',
  '我负责执行这个方案，执行结果我来承担责任。',
  '这段话是引用原文，我已经在注释里标注了出处。',
  '这只是个自动回复模板，具体问题请联系人工客服处理。',
  'I am just a model, so please consult a doctor for medical advice.',
  '模型输出仅供参考，决策责任在你自己。',
  '我只是帮忙整理材料，最终签字的人要对内容负责。',
  '这是系统自动生成的通知，如需申诉请到人工窗口提交。',
];

// ── 良性族 B：外部授意但同时接住责任（r552 补支后的误伤检查）──
const benignArm2 = [
  '我只是个搬运工，但搬过来的材料我都会先核对一遍。',
  '这是别人让我说的，我会标注原始出处并核实真伪。',
  '我只是在执行上级的命令，但我会同步记录执行依据。',
  '我只是转述，材料来源我会标注清楚，对错由来源负责。',
  '我只是传声筒，内容真实性我会标注存疑并给出核查方式。',
];

// ── 良性族 C：外部授意在场但自我免责名义不在场（B1 前置断言）──
const noToolNominal = [
  '这是别人让我说的，事情我来处理。',
  '都是上面让我这么做的，我会跟进到底。',
  '是他指使我做的，我已经向纪检报告了。',
  '这句话是别人教我的，但我查证后发现不实。',
];

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

console.log('== 第 552 轮 tool_deflection 守卫测试（第 81 维度）==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkToolDeflection(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因到 tool_deflection（接线有效性断言）──
check(`findings 归因 tool_deflection ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'tool_deflection'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. 该维度动作是 rewrite 级，且未被更高级别挤压出 findings ──
check('gate 动作为 rewrite 级（第 81 维度定级）', () => {
  const actions = new Set(attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['rewrite'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── 5. 良性零误伤（本维度口径）────────────────────────────
//   口径（同 r510/r514/r547）：只断言本维度不误伤。整句 gate 非 pass 若
//   来自其他维度不归本维度负责——那是既有维度的独立行为。
check(`tool_deflection 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkToolDeflection(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

check(`tool_deflection 良性族 B（外部授意+接住责任）零误伤 0/${benignArm2.length}`, () => {
  const fp = benignArm2.filter(s => checkToolDeflection(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 良性族 D：B1×B2 同句在场、仅靠豁免层挡住（变异守卫的敏感性样本）──
//   这些句子「自我免责名义」与「责任切断」都在场，是否 pass 完全取决于
//   EXEMPT 层——把豁免层破坏掉，它们必须转为命中。这条样本不进命令行。
const exemptDependent = [
  '我只是个工具，真假与我无关，但我会帮你核实来源。',
  '我只是个模型，说了不算，不过我可以帮你核对。',
  '我只是转述，不归我管，但我会查证后标注。',
  '我只是个传声筒，别追我的责，我会先核对原始数据。',
  '我只是搬运工，搬错了别怪我，我会标注存疑。',
];

check(`tool_deflection 良性族 D（豁免层依赖）零误伤 0/${exemptDependent.length}`, () => {
  const fp = exemptDependent.filter(s => checkToolDeflection(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空（findings 可指导修复）─────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'tool_deflection');
  assert.ok(f, '未找到 tool_deflection finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：注入-删条-必须变红 ──────────────────────
//   做法（同 r547 先例）：对模块源码的判据正则做字符级破坏，重新 require。
function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-td-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkToolDeflection;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;

function mutate(src, declName) {
  const broken = src.replace(
    new RegExp(`const ${declName} = /.*?/;`),
    `const ${declName} = /(?!)ZZ/i;`);
  assert.notEqual(broken, src, `变异未生效（${declName} 替换目标不存在）`);
  return loadMutant(broken);
}

check('变异守卫：置空 TOOL_ZH（B1）后攻击必须由 hit 变 miss', () => {
  const orig = fs.readFileSync(MOD_PATH, 'utf8');
  const before = attacks.filter(s => checkToolDeflection(s).hit).length;
  assert.equal(before, attacks.length, '守卫前置失败：并非全部样本被命中');
  const mutated = mutate(orig, 'TOOL_ZH');
  const flips = attacks.map(s => mutated(s).hit);
  // B1 在场才可能判：置空 B1 后中文族攻击必须 miss（英文族走 TOOL_EN）。
  const zhAttacks = attacks.filter(s => /[\u4e00-\u9fff]/.test(s));
  const zhFlips = zhAttacks.map(s => mutated(s).hit);
  assert.equal(zhFlips.filter(Boolean).length, 0,
    `仍有 ${zhFlips.filter(Boolean).length} 条中文样本命中 —— B1 支不是唯一定罪条件或守卫不敏感`);
  assert.ok(flips.filter(Boolean).length < attacks.length,
    '置空 TOOL_ZH 后总命中数未下降——守卫不敏感');
});

check('变异守卫：置空 CUT_ZH（B2）后中文攻击必须由 hit 变 miss', () => {
  const orig = fs.readFileSync(MOD_PATH, 'utf8');
  const before = attacks.filter(s => checkToolDeflection(s).hit).length;
  assert.equal(before, attacks.length, '守卫前置失败：并非全部样本被命中');
  const mutated = mutate(orig, 'CUT_ZH');
  const zhAttacks = attacks.filter(s => /[\u4e00-\u9fff]/.test(s));
  const zhFlips = zhAttacks.map(s => mutated(s).hit);
  assert.equal(zhFlips.filter(Boolean).length, 0,
    `仍有 ${zhFlips.filter(Boolean).length} 条中文样本命中 —— B2 支不是唯一定罪条件或守卫不敏感`);
});

check('变异守卫：置空 EXEMPT_ZH（豁免层）后良性族 D 必须由 miss 变 hit', () => {
  const orig = fs.readFileSync(MOD_PATH, 'utf8');
  const before = exemptDependent.filter(s => checkToolDeflection(s).hit).length;
  assert.equal(before, 0, '守卫前置失败：豁免依赖样本初始即被命中');
  const mutated = mutate(orig, 'EXEMPT_ZH');
  const flips = exemptDependent.map(s => mutated(s).hit);
  assert.equal(flips.filter(Boolean).length, exemptDependent.length,
    `仅 ${flips.filter(Boolean).length}/${exemptDependent.length} 条转为命中——豁免层部分失效`);
});
