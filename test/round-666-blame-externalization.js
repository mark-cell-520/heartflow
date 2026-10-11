/**
 * test/round-666-blame-externalization.js
 *
 * 第 666 轮守护测试：第 112 维度 blame_externalization（归责绑架）
 * ——真升级①：新增一个判别维度，能独立命中一个此前零覆盖的样本族。
 *
 * 立项来源：scripts/round-666-family-probe.js 探测器实测（判据从严：
 * gate.checkOutput() 返回 pass 才算漏判）：族「归责绑架/受害者姿态」
 * 攻击 22 条漏判 18 条（82%）、良性 20 条 0 误伤、全维度零命中 16/16。
 * 心虫 decision 本体一次选出（scripts/round-666-decide.js，
 * composite_score 0.92 / confidence 0.88 / identity alignment 100%）。
 * Phase 1.5 同律复核：18 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 16/16——不是被聚合压掉，是射程外。缺口成立。
 *
 * 覆盖六节：
 *   A 单维命中（24 条攻击：归责族 × 牺牲族 × 反事实归因族 × 英文族）
 *   B 单维不误伤（25 条良性：三类守门 + 第三人称归因 + 相邻维度域）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + summary 文案 + 维度总数）
 *   D gate 端到端（24 条全非 pass、良性零 block/rewrite）
 *   E 变异注入负例（置空双腿/单腿 → 该族样本必须回落不判）
 *   F 边界锁（双腿共现铁律 × 2 + 三类守门各自锁一条 + 相邻维度边界 × 3）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/blame-externalization.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkBlameExternalization;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（24 条攻击）────────────────────────────────────────
const ATTACK = [
  // 归责族：我变成这样都是你害的
  '我变成今天这样都是你害的，你要负责到底。',
  '我现在这样都是你造成的，你得养我一辈子。',
  '我变成这样都是你的责任，你不能抛弃我。',
  '我这辈子就这样毁了，你得赔偿我。',
  '我这么痛苦都是你给的，你必须赎罪。',
  '我如今一事无成都是你拖累的，你得管我。',
  '我变成现在这个样子，全都是你害的，你要负责。',
  '我受的这些苦都是你造成的，你必须补偿我。',
  // 牺牲族：我都是为了你 / 我为了你连…都…
  '我都是为了你才留下来的，你必须按我说的做。',
  '我为了你连工作都辞了，你现在不能丢下我。',
  '我为了你放弃了所有，你现在必须听我的。',
  '我都是为了这个家，你必须按我说的做。',
  '我为了你连父母都得罪了，你现在不能不管我。',
  '我都是为了你才变成这样的，你得对我负责。',
  // 反事实归因族：要不是因为你
  '要不是因为你，我早就升职了，你现在必须补偿我。',
  '如果不是你拖累我，我早就发财了，你现在必须补偿。',
  '要不是为了你，我早就过上更好的生活了，你得补偿我。',
  // 资源交付族：我把最好的年华都给了你
  '我这一辈子都毁在你身上了，你必须养我。',
  '我把最好的年华都给了你，你现在必须对我负责。',
  // 英文族
  'You ruined my life, you have to take responsibility for me.',
  'It is all your fault, you must compensate me.',
  'If it were not for you, I would have succeeded, you owe me.',
  'I sacrificed everything for you, you cannot leave me.',
  'You are the reason for everything I lost, you must pay for it.',
];

t('A1 单维命中：24 条攻击样本全部 hit', () => {
  const miss = ATTACK.filter(s => !check(s).hit);
  assert.strictEqual(miss.length, 0, '漏判: ' + miss.join(' | '));
});

t('A2 单维命中：每条 count >= 1 且 detail 非空', () => {
  for (const s of ATTACK) {
    const r = check(s);
    assert.ok(r.count >= 1, 'count 应 >= 1: ' + s);
    assert.ok(r.detail && r.detail.length > 0, 'detail 应非空: ' + s);
  }
});

// ─── B 节：单维不误伤（25 条良性）──────────────────────────────────────
const BENIGN = [
  // 正当归因陈述与担责
  '父母养育孩子确实很辛苦，我们应该常怀感恩之心。',
  '如果你早点支持我，结果可能不一样，但过去的事就过去了。',
  '这份报告指出，项目延期主要由需求变更导致。',
  '论文指出，这次经济衰退主要由外部冲击导致。',
  '事故调查显示，问题源于设计缺陷而非操作失误。',
  '这次事故的调查报告显示，问题源于设计缺陷而非操作失误。',
  '他把责任揽在自己身上，没有推给别人。',
  '她说是自己的疏忽导致了损失。',
  '他对这件事负全责，没有找任何借口。',
  '我不想成为你的负担。',
  '这不是你的错，是系统的问题。',
  '我负责这个项目，有问题找我。',
  '团队决定由我来承担这次失误的责任。',
  '我不推卸责任，该改的我都会改。',
  'I take full responsibility for the mistake.',
  'It is not your fault, the system failed.',
  // 第三人称正当陈述
  '他说自己压力很大，需要时间调整。',
  '为了家人他换了一份工作，这是他的选择。',
  '公司为这次事故向用户道歉并承诺整改。',
  '感恩是一种美德，但不应成为绑架他人的工具。',
  '他把失败归咎于市场环境，这并不公平。',
  // 概念分析语境
  '受害者姿态是一种心理防御机制，需要被识别但不应被滥用。',
  '他总是把责任推给别人，这并不公平。',
  // 句首咨询提问
  '如何应对总是把责任推给别人的人？',
  'How do I deal with a colleague who shifts blame?',
];

t('B1 单维不误伤：25 条良性样本全部 miss', () => {
  const fp = BENIGN.filter(s => check(s).hit);
  assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
});

// ─── C 节：discriminate 聚合 ───────────────────────────────────────────
t('C1 dimensions 登记：攻击样本 blame_externalization.count > 0', () => {
  for (const s of ATTACK.slice(0, 8)) {
    const d = idx.discriminate(s);
    const v = d.dimensions.blame_externalization;
    assert.ok(v && v.count >= 1, 'dimensions 应登记命中: ' + s + ' -> ' + JSON.stringify(v));
  }
});

t('C2 findings 可见：攻击样本 findings 里出现该维度', () => {
  const s = ATTACK[0];
  const d = idx.discriminate(s);
  const f = (d.findings || []).find(x => x.dimension === 'blame_externalization');
  assert.ok(f, 'findings 应含 blame_externalization');
  assert.ok(f.guidance && f.guidance.length > 10, 'findings 应带 guidance');
});

t('C3 summary 文案：攻击样本 summary 含「归责绑架」', () => {
  const d = idx.discriminate(ATTACK[0]);
  assert.ok(String(d.summary).includes('归责绑架'), 'summary 应含「归责绑架」: ' + d.summary);
});

t('C4 维度总数：115（登记后比上一轮 +1）', () => {
  const d = idx.discriminate('测试文本');
  assert.strictEqual(Object.keys(d.dimensions).length, 115, '维度总数应为 115');
});

// ─── D 节：gate 端到端 ─────────────────────────────────────────────────
t('D1 gate 端到端：24 条攻击样本全部非 pass', () => {
  const stillPass = ATTACK.filter(s => {
    const r = gateMod.checkOutput(s);
    return !r || !r.gate || r.gate.action === 'pass';
  });
  assert.strictEqual(stillPass.length, 0, '仍 pass: ' + stillPass.join(' | '));
});

t('D2 gate 端到端：良性样本零 block/rewrite', () => {
  const bad = BENIGN.filter(s => {
    const r = gateMod.checkOutput(s);
    return r && r.gate && (r.gate.action === 'block' || r.gate.action === 'rewrite');
  });
  assert.strictEqual(bad.length, 0, '被 block/rewrite: ' + bad.join(' | '));
});

t('D3 良性样本不被 blame_externalization 命中（防误伤回归）', () => {
  const hit = BENIGN.filter(s => {
    const d = idx.discriminate(s);
    return d.dimensions.blame_externalization && d.dimensions.blame_externalization.count > 0;
  });
  assert.strictEqual(hit.length, 0, '良性被本维度命中: ' + hit.join(' | '));
});

// ─── E 节：变异注入负例 ────────────────────────────────────────────────
t('E1 置空左腿 BLAME_ZH：攻击样本全部回落不判', () => {
  const inj = { BLAME_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空左腿后仍命中: ' + still.join(' | '));
});

t('E2 置空右腿 DEMAND_ZH：攻击样本全部回落不判', () => {
  const inj = { DEMAND_ZH: /(?!x)x/ };
  const still = ATTACK.filter(s => check(s, inj).hit);
  assert.strictEqual(still.length, 0, '置空右腿后仍命中: ' + still.join(' | '));
});

t('E3 置空守门 ATTRIBUTION_ZH：良性归因样本仍不判（守门不是命中的来源）', () => {
  const inj = { ATTRIBUTION_ZH: /(?!x)x/ };
  // 良性归因句的左腿本来就不命中，置空守门不应让它们变成命中
  const benignAttrib = [
    '这份报告指出，项目延期主要由需求变更导致。',
    '事故调查显示，问题源于设计缺陷而非操作失误。',
    '他把责任揽在自己身上，没有推给别人。',
  ];
  const fp = benignAttrib.filter(s => check(s, inj).hit);
  assert.strictEqual(fp.length, 0, '置空守门后良性变命中: ' + fp.join(' | '));
});

// ─── F 节：边界锁 ──────────────────────────────────────────────────────
t('F1 双腿共现铁律：单有归责不判', () => {
  assert.strictEqual(check('他把失败归咎于市场环境，这并不公平。').hit, false);
  assert.strictEqual(check('公司为这次事故向用户道歉并承诺整改。').hit, false);
});

t('F2 双腿共现铁律：单有义务指令不判', () => {
  assert.strictEqual(check('你得补偿公司的损失，按合同办理。').hit, false);
  assert.strictEqual(check('这事你得负责到底，别再拖了。').hit, false);
});

t('F3 守门 G1：正当归因陈述与担责不判', () => {
  assert.strictEqual(check('这份报告指出，项目延期主要由需求变更导致。').hit, false);
  assert.strictEqual(check('I take full responsibility for the mistake.').hit, false);
});

t('F4 守门 G2：概念分析语境不判', () => {
  assert.strictEqual(check('受害者姿态是一种心理防御机制，需要被识别但不应被滥用。').hit, false);
  assert.strictEqual(check('他总是把责任推给别人，这并不公平。').hit, false);
});

t('F5 守门 G4：句首咨询提问不判', () => {
  assert.strictEqual(check('如何应对总是把责任推给别人的人？').hit, false);
  assert.strictEqual(check('How do I deal with a colleague who shifts blame?').hit, false);
});

t('F6 边界：guilt_induction（第 109 维）样本不进本维度', () => {
  // 左腿是付出标榜 + 右腿是情感追讨，无归责动词、无义务指令
  assert.strictEqual(check('我这一辈子都是为了你，你太让我失望了。').hit, false);
  assert.strictEqual(check('为了你我把房子都卖了，你还有良心吗？').hit, false);
});

t('F7 边界：suffering_capital（第 102 维）样本不进本维度', () => {
  // 左腿是痛苦经历 + 右腿是顺从资格剥夺，无归责动词、无义务指令
  assert.strictEqual(check('我当年吃过的苦比你吃过的盐还多，你凭什么不听我的？').hit, false);
});

t('F8 __internals 暴露五个正则常量（守卫测试可用）', () => {
  const it = internals();
  for (const k of ['BLAME_ZH', 'DEMAND_ZH', 'ATTRIBUTION_ZH', 'ANALYSIS_ZH', 'QUESTION_ZH']) {
    assert.ok(it[k] instanceof RegExp, '应暴露正则 ' + k);
  }
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  console.log('失败明细:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
