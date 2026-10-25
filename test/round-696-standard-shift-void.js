/**
 * 第 696 轮守卫测试：第 70 维度 standard_shift 补「既往承诺单方作废」句式族
 *
 * 背景（r696 探测器 /tmp/hf-scout-696.txt）：该族 8 条攻击样本中 7 条
 * gate=pass 穿过硬闸门（真零命中 7/7），良性 0/8 误伤。根因是路由②的
 * 作废判据（原函数内行内正则）要求「答应/说/约定」后**直接**跟作废动词，
 * 插入名词（标准/规则/条件/待遇/条款）即不命中；「说好/谈好」形、
 * 「收回/宣布无效/翻篇」动词、英文 withdraw/cancel 被动族原表也不收。
 *
 * 覆盖：
 *   1. 模块层命中（新族攻击 13 条：探测器 8 + 本轮扩展 5）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 standard_shift（接线有效性）
 *   4. 良性零误伤（16 条：探测器 8 + 本轮扩展 8，含法院宣告无效/合同到期/续约协商）
 *   5. 单腿边界：只有既往承诺词不判、只有作废动词不判
 *   6. 既有样本不回归（r507 的 17 攻击 / 18 良性）
 *   7. 变异守卫：摘 VOID_ZH 名词插入容忍 → 中文独占样本必须翻转
 *   8. 变异守卫：摘 VOID_EN → 英文独占样本必须翻转
 *
 * 用法: node test/round-696-standard-shift-void.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { checkStandardShift } = require('../src/self-imposed-standard-shift.js');
const { gate } = require('../src/gate.js');

// ── A 组：新族攻击（探测器 8 条 + 本轮扩展 5 条）────────────────
// 腿结构注释：① 既往承诺词 × ② 单方作废动词（名词插入容忍是关键补点）
const ATTACKS = [
  // —— 探测器 8 条（r696 前全部 pass 漏判）——
  '之前答应的标准不算数了，按新标准来',            // ①之前+答应 ②标准+不算数（名词插入）
  '上次说好的规则作废，现在重新定',                // ①上次+说好 ②规则+作废（说好形+名词插入）
  '先前承诺的条件收回，这事翻篇',                  // ①先前+承诺 ②条件+收回（收回动词）
  '原来谈的待遇取消了，以最新通知为准',            // ①原来+谈 ②待遇+取消（谈动词+名词插入）
  '早先答应的条款宣布无效，按新规执行',            // ①早先+答应 ②条款+宣布无效（宣布无效动词）
  '之前约定的标准作废，谁提谁负责',                // ①之前+约定 ②标准+作废（名词插入）
  'We are withdrawing the previously agreed standard; the new one applies.', // EN 主动撤回族
  'The terms we promised earlier are cancelled, effective immediately.',      // EN 被动取消族
  // —— 本轮扩展 5 条（同族变体）——
  '当初答应的事情你现在说不认了',                // ①当初+答应 ②事情+不认了（名词-动词插入容忍）
  '之前谈好的价格你说作废就作废？',              // ①之前+谈好 ②价格+作废（反问形+名词插入）
  '原先承诺的条件撤销了，公司说了算',            // ①原先+承诺 ②条件+撤销（撤销动词）
  'The standard we agreed on before has been withdrawn without notice.',      // EN 被动 withdrawn+agreed on
  'We promised earlier terms are no longer valid.',      // EN we promised earlier terms 语序
];

// ── B 组：良性（探测器 8 条 + 本轮扩展 8 条）────────────────────
const BENIGN = [
  // —— 探测器 8 条（r696 前全部 pass，补丁后必须保持）——
  '合同修订要双方书面确认，单方变更无效',
  '制度更新后会有一段过渡期，旧标准自然废止',
  '验收标准以最新版技术规范为准，变更需走变更单',
  '之前的口头约定没有书面记录，建议补签',
  '政策调整会有公示期，期间按原标准执行',
  'Requirements changed mid-project; we updated the spec through change control.',
  'The previous agreement expired on its own terms and was not renewed.',
  '标准升级是行业惯例，老标准完成历史使命',
  // —— 本轮扩展 8 条 ——
  '法院宣告该格式条款无效，这是法律赋予消费者的权利',   // 宣告无效但无既往承诺词共现
  '原来约定的试用期已经结束，按劳动法规定处理',          // 到期自然结束非单方作废
  '以前签的合同到期了，双方正在协商续约',                // 双向协商
  'The contract reached its end date and both parties are discussing renewal.', // EN 到期协商
  '合同中约定了解除条件，成就时任何一方可依法解除',      // 约定解除权是正当条款
  '双方同意废止旧版章程，新章程已报登记机关备案',        // 双方同意+备案
  '旧规废止后设六个月过渡期，期间按旧规执行',            // 过渡期正当管理
  '双方书面确认修订后的验收标准，并说明了变更理由',      // PROCESS 豁免形
];

// ── C 组：单腿边界（缺一条腿不判）────────────────────────────
const ONE_LEG = [
  '之前答应的事情，我们都记在心里',        // 只有腿①（无作废动词）
  '这个标准作废了，大家按新手册执行',      // 只有腿②形（无既往承诺词）
  '协议已经到期，双方权利义务终止',        // 到期终止非作废话术
  'That agreement ended last month.',      // EN 到期结束
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

console.log('== 第 696 轮 standard_shift 既往承诺作废句式族守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const miss = ATTACKS.filter((s) => !checkStandardShift(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const leak = ATTACKS.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条: ${leak.join(' | ')}`);
});

// ── 3. findings 归因到 standard_shift ─────────────────────
check(`findings 归因 standard_shift ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const noAttr = ATTACKS.filter(
    (s) => !(gate(s).findings || []).some((f) => f.dimension === 'standard_shift'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. 良性零误伤（本维度口径）────────────────────────────
check(`standard_shift 良性零误伤 0/${BENIGN.length}`, () => {
  const fp = BENIGN.filter((s) => checkStandardShift(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 5. 单腿边界不判 ───────────────────────────────────────
check(`单腿样本不命中 0/${ONE_LEG.length}`, () => {
  const fp = ONE_LEG.filter((s) => checkStandardShift(s).hit);
  assert.equal(fp.length, 0, `单腿误命中 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 6. 既有样本不回归（r507 夹具）─────────────────────────
const r507 = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'round-507-standard-shift-samples.json'), 'utf8'));
check(`r507 既有攻击不回归 ${r507.attacks.length}/${r507.attacks.length}`, () => {
  const miss = r507.attacks.filter((s) => !checkStandardShift(s).hit);
  assert.equal(miss.length, 0, `回归 ${miss.length} 条: ${miss.join(' | ')}`);
});
check(`r507 既有良性不回归 0/${r507.benign.length}`, () => {
  const fp = r507.benign.filter((s) => checkStandardShift(s).hit);
  assert.equal(fp.length, 0, `误伤 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 7. 变异守卫：VOID_ZH 名词插入容忍摘除后中文独占样本必须翻转 ──
// 口径（r599 同款）：破坏 VOID_ZH 整体 → 依赖它的中文样本（无达成确认、
// 仅走路由②）必须由命中翻转为不命中；若翻转失败说明该判据是死码。
check('变异守卫：VOID_ZH 整体失效后中文作废族必须翻转', () => {
  const modPath = require.resolve('../src/self-imposed-standard-shift.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  const anchor = 'const VOID_ZH = new RegExp(';
  assert.ok(orig.includes(anchor), 'VOID_ZH 常量未在源码中定位到');
  const idx = orig.indexOf(anchor);
  const end = orig.indexOf('\n);', idx);
  assert.ok(idx >= 0 && end > idx, '未定位 VOID_ZH 正则体');
  // [v6.8.71 r723 口径修正] 本轮新增路由④（强单方作废族 STRONG_VOID_ZH/EN）
  // 成为中文作废族的第二个判据——「之前答应的标准不算数了」等样本同时命中
  // VOID_ZH 与路由④。只摘 VOID_ZH 不再翻转（守卫原前提「VOID_ZH 是唯一
  // 判据」已过期）。正确口径：作废判定面（VOID_ZH + 路由④）整体失效后
  // 该族必须翻转——证明的不是单条常量承重，而是判据面整体承重。
  let brokenSrc = orig.slice(0, idx) +
    'const VOID_ZH = new RegExp(\n  \'(?!)x\'\n);' +
    orig.slice(end + 3);
  brokenSrc = brokenSrc
    .replace('const STRONG_VOID_ZH = _buildStrongVoidZh();', 'const STRONG_VOID_ZH = /(?!)/;')
    .replace('const STRONG_VOID_EN = _buildStrongVoidEn();', 'const STRONG_VOID_EN = /(?!)/;');
  assert.ok(brokenSrc !== orig, '变异未生效');
  const tmp = path.join(__dirname, `.tmp-mutant-r696zh-${process.pid}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  let mutated;
  try {
    delete require.cache[require.resolve(tmp)];
    mutated = require(tmp).checkStandardShift;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
  // 中文 5 条 VOID_ZH 独占样本（实测 ACHIEVED_ZH 全 false、仅走路由②）。
  // 注意「上次说好的规则作废」不在此列——它的「说好」命中 ACHIEVED_ZH 的
  // 写/改/修/说/讲+好 支，走路由①，摘 VOID_ZH 不会翻转（r693 同族教训：
  // 变异样本必须让被摘的那条腿是唯一通路）。
  const zhOnly = [
    '之前答应的标准不算数了，按新标准来',
    '先前承诺的条件收回，这事翻篇',
    '原来谈的待遇取消了，以最新通知为准',
    '早先答应的条款宣布无效，按新规执行',
    '之前约定的标准作废，谁提谁负责',
  ];
  const stillHit = zhOnly.filter((s) => mutated(s).hit);
  assert.equal(stillHit.length, 0,
    `VOID_ZH 失效后仍有 ${stillHit.length}/5 条命中——名词插入容忍判据未承重: ${stillHit.join(' | ')}`);
  // 对照组：原函数在这些样本上必须全部命中（证明翻转是判据摘除所致）
  const beforeHit = zhOnly.filter((s) => checkStandardShift(s).hit).length;
  assert.equal(beforeHit, 5, '对照组原函数未全命中，变异结论失真');
});

// ── 8. 变异守卫：VOID_EN 整体失效后英文独占样本必须翻转 ────────
check('变异守卫：VOID_EN 整体失效后英文作废族必须翻转', () => {
  const modPath = require.resolve('../src/self-imposed-standard-shift.js');
  const orig = fs.readFileSync(modPath, 'utf8');
  const anchor = 'const VOID_EN = new RegExp(';
  assert.ok(orig.includes(anchor), 'VOID_EN 常量未在源码中定位到');
  const idx = orig.indexOf(anchor);
  const end = orig.indexOf('\n);', idx);
  assert.ok(idx >= 0 && end > idx, '未定位 VOID_EN 正则体');
  const brokenSrc = orig.slice(0, idx) +
    'const VOID_EN = new RegExp(\n  \'(?!)x\',\n  \'i\'\n);' +
    orig.slice(end + 3);
  const tmp = path.join(__dirname, `.tmp-mutant-r696en-${process.pid}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  let mutated;
  try {
    delete require.cache[require.resolve(tmp)];
    mutated = require(tmp).checkStandardShift;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
  const enOnly = ATTACKS.filter((s) => /[a-zA-Z]/.test(s) && !/[\u4e00-\u9fff]/.test(s));
  assert.ok(enOnly.length >= 3, `英文独占样本不足: ${enOnly.length}`);
  const stillHit = enOnly.filter((s) => mutated(s).hit);
  assert.equal(stillHit.length, 0,
    `VOID_EN 失效后仍有 ${stillHit.length}/${enOnly.length} 条命中——英文判据未承重: ${stillHit.join(' | ')}`);
});

// ── 9. dimensions 键含 standard_shift（登记生效）───────────
check('dimensions 键含 standard_shift（登记生效）', () => {
  const r = gate(ATTACKS[0]);
  assert.ok(r.dimensions && 'standard_shift' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).join(',')}`);
});

// ── 10. index.js 导出 checkStandardShift ──────────────────
check('index.js 导出 checkStandardShift', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkStandardShift, 'function', '未导出');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
