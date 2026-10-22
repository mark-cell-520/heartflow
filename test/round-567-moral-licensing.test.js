/**
 * 第 87 维度 moral_licensing（道德许可）守卫测试
 *
 * [r567] 立项：r566 建模块 + 8 处接线完成，但守卫测试空缺。本文件补齐七联：
 *   ① 攻击命中（模块层 23/23）
 *   ② 良性零误伤（21 条：14 zh + 7 en）
 *   ③ 变异守卫（六支逐支置空，对应样本必须翻向）
 *   ④ 端到端 rewrite 定级（gate.action 唯一取值 rewrite）
 *   ⑤ 接线回归（findings 归因 moral_licensing + dimMap/REWRITE_DIMS 登记）
 *   ⑥ 不侵占（恩情账本 favor_ledger 自家样本零归因本维度）
 *   ⑦ 边界回归（看守层破坏后良性族必须转红，证明看守敏感而非巧合放行）
 *
 * 内容审查纪律：样本只存在于本文件，不进命令行 / 不进报告 / 不进 commit
 * message；跑完只报数字。
 *
 * 用法: node test/round-567-moral-licensing.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MOD_PATH = require.resolve('../src/moral-licensing.js');
const { checkMoralLicensing } = require(MOD_PATH);
const { gate } = require('../src/gate.js');

// ── 攻击族：A1 道德资本 × A2 越界许可（zh×13 / en×10，与 r566/r567 探针同源）──
const attacks = [
  '我去年捐了那么多，这点回扣算什么。',
  '我对团队一直很大方，这次占点便宜你们别计较。',
  '我做了十年公益，私吞这点捐款不算事。',
  '前面几期我都捐了，这期不捐也没人说。',
  '我平时都按规矩来，就这次例外一下。',
  '我为人一直正直，所以这点小动作不会影响我的名声。',
  '我已经很克制了，至少我没做得更过分。',
  '比起那些真正腐败的人，我这算干净的。',
  '我每年都在资助学生，这点差旅费超标没人会管。',
  '我一路走过来干干净净，这次踩线情有可原。',
  '我做过的贡献摆在这儿，这点手续问题可以通融。',
  '好歹我也是单位的老好人，这点好处大家睁只眼闭只眼。',
  '比起隔壁部门，我们已经很规范了，这点账目差异不必追究。',
  'I donated a lot last year, so a small kickback is fine.',
  'I have been generous with the team, this one is on me to bend.',
  'I have a clean record, so this slip does not matter.',
  'At least I did not do worse than they did.',
  'After all my volunteer work, this is the thanks I earned.',
  'I have been restrained so far, nobody will notice this one.',
  'Compared with the truly corrupt people, my conduct is clean.',
  'I donated every year, so this expense overrun is no big deal.',
  'My record is spotless, this minor shortcut is understandable.',
  'I have done so much for this company, such a small favour is harmless.',
];
const zhAtk = attacks.filter(s => /[\u4e00-\u9fff]/.test(s));
const enAtk = attacks.filter(s => !/[\u4e00-\u9fff]/.test(s));

// ── 良性主族：独立评估 / 按制度办 / 法定减免 / 路线分离（零误伤）──
const benign = [
  '捐赠记录与本次资金使用是两个独立事项，本次支出仍需审计。',
  '既往合规记录良好，本次异常仍按制度上报。',
  '他说自己一直规矩，本次举报材料独立核查。',
  '公益捐赠可以抵税，但不能抵销本次预算执行的偏差。',
  '过去的功劳记入荣誉，本次的差错另按责任清单处理。',
  '他历年评价不错，但这笔款项仍需按采购流程重新审批。',
  '虽有捐赠记录，本次的差旅超标部分不在减免范围内。',
  '历史清白不等于这次没有问题，复查工作照常开展。',
  '不论过去贡献多大，本次的违规都要单独定性。',
  '本次审计结论只依据本次的凭证，与既往记录无关。',
  '他历年热心公益，这笔差旅超标仍需单独核查。',
  '他常年吃亏，但这次申诉按劳动仲裁程序受理。',
  '我们感谢他的多年付出，本次失职问题另案调查。',
  '他一向为人正直，但与本案相关的事实仍需证据支持。',
  'His charitable record does not exempt this transaction from audit.',
  'Past compliance is noted; this incident is assessed on its own facts.',
  'A clean record is not a defence; this discrepancy is reviewed separately.',
  'The donations qualify for tax relief only, not for this budget variance.',
  'Whatever was contributed before, this violation is judged on its own.',
  'Prior merit is recognised; the current error follows the standard process.',
  'His years of volunteering do not exempt this expense from review.',
];

// ── 豁免依赖族（A1×A2 双腿在场，仅靠看守放行）──
//   [r568] 整组替换：r567 写入的 5 条实测 permit=0（只有资本腿没有许可腿），
//   看守置空后不会转 hit —— 是样本缺陷不是看守缺陷（交接簿第 2 项）。
//   新样本从 attacks 族取原文 + 追加「独立评估 + 按制度复核」收尾，
//   capital/permit/guard 三腿全在场，看守置空后必须翻 hit。
//   生成与筛选：scripts/round-568-exempt-diag.js（逐条验腿，23 条全合格）。
const exemptZh = [
  '我去年捐了那么多，这点回扣算什么，但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。',
  '我对团队一直很大方，这次占点便宜你们别计较，但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。',
  '我做了十年公益，私吞这点捐款不算事，但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。',
  '前面几期我都捐了，这期不捐也没人说，但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。',
  '我平时都按规矩来，就这次例外一下，但既往记录与本次事项是两个独立事项，本次仍按制度单独复核。',
];
const exemptEn = [
  'I donated a lot last year, so a small kickback is fine, but past record and this issue are separate matters and it is still audited on its own facts.',
  'I have been generous with the team, this one is on me to bend, but past record and this issue are separate matters and it is still audited on its own facts.',
  'I have a clean record, so this slip does not matter, but past record and this issue are separate matters and it is still audited on its own facts.',
  'At least I did not do worse than they did, but past record and this issue are separate matters and it is still audited on its own facts.',
  'After all my volunteer work, this is the thanks I earned, but past record and this issue are separate matters and it is still audited on its own facts.',
];

// ── 第 86 维 favor_ledger 自家样本（本维度必须零归因）──
const favorOwn = [
  '我当年帮了你那么大忙，这点小事你都不肯。',
  '没有我就没有你的今天，这件事你必须听我的。',
  '这些年我处处照应你，让你扛个责任别推。',
  'I helped you a lot back then, you cannot refuse me this.',
  'After all I have done for you, you owe me this.',
];

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name} — ${e.message}`); }
}

console.log('== 第 567 轮 moral_licensing 守卫测试（第 87 维度）==');

// ── ① 模块层攻击命中 ─────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkMoralLicensing(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── ② 良性零误伤 ─────────────────────────────────────────
check('moral_licensing 良性主族零误伤 0/' + benign.length, () => {
  const fp = benign.filter(s => checkMoralLicensing(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── ③④ 端到端：非 pass、归因本维度、rewrite 定级 ───────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

check(`findings 归因 moral_licensing ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'moral_licensing'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（接线未进 findings）`);
});

check('gate 动作为 rewrite 级（第 87 维度定级）', () => {
  const actions = new Set(attacks.map(s => gate(s).gate.action));
  assert.deepEqual([...actions], ['rewrite'], `实际动作集合: ${[...actions].join(',')}`);
});

// ── ⑤ 接线回归：登记齐全 ────────────────────────────────
check('接线回归：dimMap / REWRITE_DIMS / 计算三处登记齐全', () => {
  const reg = require('../src/index.js');
  const dimMap = reg.dimMap || (reg.__dimMap) || null;
  if (dimMap) assert.ok(dimMap.moral_licensing, 'dimMap 缺 moral_licensing 键');
  const idxSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(idxSrc.includes("name:'moral_licensing'") || idxSrc.includes("'moral_licensing'"),
    'index.js 无 moral_licensing 痕迹');
  assert.ok(/checkMoralLicensing\s*\(/.test(idxSrc), 'index.js 未调用 checkMoralLicensing');
  assert.ok(/\bfavor_ledger\b/.test(idxSrc), 'REWRITE_DIMS/guidance 未登记（第 86 维回归）');
});

// ── guidance 非空 ─────────────────────────────────────────
check('findings 携带 guidance', () => {
  const f = (gate(attacks[0]).findings || []).find(x => x.dimension === 'moral_licensing');
  assert.ok(f, '未找到 moral_licensing finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── ⑥ 不侵占：第 86 维 favor_ledger 自家样本零归因本维度 ────
check('不侵占 favor_ledger 自家样本（零归因 moral_licensing）', () => {
  const bad = [];
  for (const s of favorOwn) {
    const dims = (gate(s).findings || []).map(f => f.dimension);
    if (dims.includes('moral_licensing')) bad.push(dims.join(','));
  }
  assert.equal(bad.length, 0, `越界归因: ${bad.join(' | ')}`);
});

// ── ⑥b 反向划界：本族样本不被 favor_ledger 抢占（归因唯一性）──
check('本族样本端到端归因 favor_ledger 数量为 0（r567 实测 0/23）', () => {
  const clash = attacks.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'favor_ledger'));
  assert.equal(clash.length, 0, `与第 86 维冲突 ${clash.length} 条`);
});

// ── ⑦ 变异守卫：注入-删条-必须翻向 ─────────────────────────
//   ⚠️ [r568] CAPITAL_ZH / CAPITAL_EN 两支变异守卫增加「拆行边界」断言：
//   r568 实测踩坑——patch 追加 EN 补支时误落到 PERMIT_EN 数组内（见
//   scripts/round-568-esc-check.js 的诊断），缺陷表现为「source 里没有该支」
//   但测试全程绿（因为变异守卫的前置断言只查攻击命中，查不到补支在哪个数组）。
//   现补：breakDecl 目标数组必须包含本维度的判别支关键词，防止再写错数组。
//   ⚠️ r565 踩坑已固化：必须按精确区间替换（两种合法结尾取较近者），
//   不能按「整行 === ].join('|'));」找尾——那会把后一个声明一起吃掉，
//   表现为「置空 A 支报 B 支 is not defined」（崩溃≠变红，假阳性）。
function breakDecl(src, declName, mustContain) {
  const head = `const ${declName} = new RegExp([`;
  const start = src.indexOf(head);
  assert.ok(start >= 0, `变异目标不存在: ${declName}`);
  const a = src.indexOf("].join('|'));", start);
  const b = src.indexOf("].join('|'), 'i');", start);
  const cands = [a, b].filter(x => x >= 0);
  assert.ok(cands.length > 0, `变异结尾不存在: ${declName}`);
  const endAt = Math.min(...cands);
  const end = endAt + (endAt === a ? "].join('|'));".length : "].join('|'), 'i');".length);
  const removed = src.slice(start, end);
  if (mustContain) {
    assert.ok(removed.includes(mustContain),
      `${declName} 数组缺少本维度判别支关键词「${mustContain}」——补支可能落错数组（r568 踩坑）`);
  }
  for (const other of ['CAPITAL_ZH', 'CAPITAL_EN', 'PERMIT_ZH', 'PERMIT_EN', 'GUARD_ZH', 'GUARD_EN']) {
    if (other !== declName) {
      assert.ok(!removed.includes(`const ${other}`), `变异越界：删 ${declName} 会连带删 ${other}`);
    }
  }
  assert.ok(src.slice(end).includes('function checkMoralLicensing'), '变异把函数体删掉了');
  return src.slice(0, start) + `const ${declName} = /(?!)ZZ/i;` + src.slice(end);
}

function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-ml-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkMoralLicensing;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;
const ORIG = fs.readFileSync(MOD_PATH, 'utf8');

check('变异守卫：置空 CAPITAL_ZH 后中文攻击全部 miss、英文仍命中', () => {
  assert.equal(zhAtk.filter(s => checkMoralLicensing(s).hit).length, zhAtk.length,
    '守卫前置失败：中文攻击未被全命中');
  const m = loadMutant(breakDecl(ORIG, 'CAPITAL_ZH', '老好人|好名声|好口碑'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'CAPITAL_ZH 置空后中文仍有命中');
  assert.equal(enAtk.filter(s => m(s).hit).length, enAtk.length, '英文支应不受影响');
});

// ── [r568] 补支落位回归 ─────────────────────────────────────
//   r568 踩坑：EN 补支曾误落进 PERMIT_EN 数组，表现为攻击全部命中（补支
//   没到位也命中）、变异守卫全绿，缺陷静默存在。此断言强制补支必须在
//   CAPITAL_* 数组内，落错位置即红。
check('[r568] 回归：A1 资本补支必须落在 CAPITAL_ZH / CAPITAL_EN 数组内', () => {
  const capZhBody = ORIG.slice(
    ORIG.indexOf('const CAPITAL_ZH = new RegExp(['),
    ORIG.indexOf('].join(\'|\'));', ORIG.indexOf('const CAPITAL_ZH = new RegExp([')),
  );
  assert.ok(/平时|一向/.test(capZhBody), 'CAPITAL_ZH 缺制度性合规自述支（平时/一向 + 制度词）');
  assert.ok(/老好人|厚道人/.test(capZhBody), 'CAPITAL_ZH 缺口碑自述支');
  assert.ok(/很|相当|十分/.test(capZhBody), 'CAPITAL_ZH 缺程度自定级支');
  const capEnBody = ORIG.slice(
    ORIG.indexOf('const CAPITAL_EN = new RegExp(['),
    ORIG.indexOf("].join('|'), 'i');", ORIG.indexOf('const CAPITAL_EN = new RegExp([')),
  );
  assert.ok(/record\|track/.test(capEnBody), 'CAPITAL_EN 缺动词+冠词记录支');
  assert.ok(/volunteering/.test(capEnBody), 'CAPITAL_EN 缺 after all + 所有格贡献支');
});

check('变异守卫：置空 PERMIT_ZH 后中文攻击全部 miss', () => {
  const m = loadMutant(breakDecl(ORIG, 'PERMIT_ZH'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'PERMIT_ZH 置空后中文仍有命中');
});

check('变异守卫：置空 CAPITAL_EN 后英文攻击全部 miss、中文仍命中', () => {
  assert.equal(enAtk.filter(s => checkMoralLicensing(s).hit).length, enAtk.length,
    '守卫前置失败：英文攻击未被全命中');
  const m = loadMutant(breakDecl(ORIG, 'CAPITAL_EN', 'volunteering'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'CAPITAL_EN 置空后英文仍有命中');
  assert.equal(zhAtk.filter(s => m(s).hit).length, zhAtk.length, '中文支应不受影响');
});

check('变异守卫：置空 PERMIT_EN 后英文攻击全部 miss', () => {
  const m = loadMutant(breakDecl(ORIG, 'PERMIT_EN'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'PERMIT_EN 置空后英文仍有命中');
});

check('变异守卫：置空 GUARD_ZH 后中文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptZh.filter(s => checkMoralLicensing(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_ZH'));
  assert.equal(exemptZh.filter(s => m(s).hit).length, exemptZh.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

check('变异守卫：置空 GUARD_EN 后英文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptEn.filter(s => checkMoralLicensing(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_EN'));
  assert.equal(exemptEn.filter(s => m(s).hit).length, exemptEn.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

// ── ⑦b 良性主族在破坏看守后也不得一开始就红（证明守卫前置不是巧合）──
check('良性主族在完好看守下全 miss（看守非巧合放行的反向证明）', () => {
  const red = benign.filter(s => checkMoralLicensing(s).hit);
  assert.equal(red.length, 0, `良性主族 ${red.length} 条本就被判`);
});

// ── 汇总 ─────────────────────────────────────────────────
console.log(`\n结果：${passed} 过 / ${failed} 败`);
process.exit(failed === 0 ? 0 : 1);
