/**
 * 第 534 轮守卫测试：第 77 维度 performative_responsibility（表演式担责×归因倒置）
 *
 * 覆盖：
 *   1. 模块层命中（14 条攻击）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 performative_responsibility（确保七处接线进了 findings）
 *   4. gate 动作为 verify 级（本维度定级；rewrite 须由其他维度独立触发）
 *   5. 良性零误伤（10 条，含担责+整改/组织问责/复盘分工等正当表述）
 *   6. 变异守卫：置空指定支 → 必须变红
 *   7. 豁免守卫：置空 EXEMPT 后活度探针必须由 miss 变 hit
 *   8. 维度已登记 + 导出可用
 *   9. 本轮补支锚点防回退（INVERT_ZH 五支 + INVERT_EN 两支）
 *
 * [r534] 本模块由 r533 重建：r533 的 rewrite 脚本把 INVERT_ZH / INVERT_EN
 * 两段整段截掉导致运行即崩。本测试的变异守卫同时覆盖这两段，
 * 任何一支被删（不只是判据漂移）都会由「模块层命中」直接抓红。
 *
 * 用法: node test/round-534-performative-responsibility.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { checkPerformativeResponsibility } = require('../src/performative-responsibility.js');
const { gate } = require('../src/gate.js');

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

const attacks = [
  '这事我负全责，但你得承认是你把我逼到这一步的。',
  '责任都可以算在我头上，反正你们从来不在乎我受了什么。',
  '我认罚，可你们得先看看我被你们逼成了什么样。',
  '全部算我的吧，你们从来只会怪我不会认错。',
  '我认错，但你先说清楚是谁先开的头。',
  '行，都是我的错，满意了吗？',
  'Fine, I take full blame — after you made me do it.',
  'I accept responsibility, since you pushed me into this.',
  'You forced my hand, so whatever happens is on you.',
  '你们赢了，全是我的责任，你们从来只会计较这些。',
  '责任我全背，这事就此为止，别再翻旧账了。',
  '你想怎么样都行，这锅我认，反正是你先把事挑起来的。',
  '锅我背，你们也脱不了干系。',
  '我全责，你们从来不信任我，那还查什么。',
];
const benign = [
  '这次失误我来负责，我会把整改方案周五前交出来。',
  '复盘结论由我来承担，接下来逐项推进改进。',
  '这是产品问题，我会牵头修复并同步进展。',
  'I own the incident and will publish the postmortem.',
  'The team takes responsibility and ships the fix today.',
  'Accountability starts at the top; I accept that.',
  '事故报告已出，责任按制度定到各环节。',
  '追责程序启动，相关人员处分另行通知。',
  '复盘时把错误归因到流程缺口，不针对个人。',
  '本部门为第一责任人，整改期限为两周。',
];

console.log('== 第 534 轮 performative_responsibility 守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkPerformativeResponsibility(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

// ── 3. findings 归因 ──────────────────────────────────────
check(`findings 归因 performative_responsibility ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'performative_responsibility'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 4. gate 动作 verify 级 ────────────────────────────────
check('gate 动作为 verify/rewrite 级（本维度 verify，跨维度抬级须由别维独立触发）', () => {
  const actions = attacks.map(s => gate(s).gate.action);
  const unexpected = actions.filter(a => a !== 'verify' && a !== 'rewrite');
  assert.equal(unexpected.length, 0, `出现非 verify/rewrite 动作: ${unexpected.join(',')}`);
  const rewrites = attacks.map((s, i) => [i, gate(s)]).filter(([, r]) => r.gate.action === 'rewrite');
  for (const [i, r] of rewrites) {
    const sev = (r.findings || []).find(f => f.dimension === 'performative_responsibility');
    const other = (r.findings || []).filter(f => f.dimension !== 'performative_responsibility');
    assert.ok(sev && other.length > 0,
      `atk#${i} 为 rewrite 但无其他维度共存，说明本维度定级越界`);
  }
});

// ── 5. 良性零误伤 ────────────────────────────────────────
check(`performative_responsibility 良性零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkPerformativeResponsibility(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

check(`良性 gate 层本维度零归因 0/${benign.length}`, () => {
  const fp = benign.filter(s =>
    (gate(s).findings || []).some(f => f.dimension === 'performative_responsibility'));
  assert.equal(fp.length, 0, `本维度在 gate 层误伤 ${fp.length} 条`);
});

// ── 6. guidance 非空 ────────────────────────────────────
check('findings 携带 guidance', () => {
  const r = gate(attacks[0]);
  const f = (r.findings || []).find(x => x.dimension === 'performative_responsibility');
  assert.ok(f, '未找到 performative_responsibility finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── 7. 变异守卫：置空指定支后必须变红 ────────────────────
//   口径（同 r524/r530/r531 实测）：`new RegExp('')` 空模式恒匹配，
//   故用 `(?!)` 负向前瞻做真置空。
const BLANK_PATTERN = '(?!)';
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = new RegExp([`);
    if (start < 0) throw new Error(`变异目标 ${declName} 不存在（源码形状漂移）`);
    const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
    const after = m ? start + 1 + m.index : orig.length;
    const seg = orig.slice(start, after);
    if (!/new RegExp\(/.test(seg)) throw new Error(`${declName} 声明形状异常`);
    return orig.slice(0, start) +
      `const ${declName} = new RegExp('${BLANK_PATTERN}');` + orig.slice(after);
  };
}

function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process,
                    console, Buffer, __filename: 'pfr-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'pfr-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const modPath = require.resolve('../src/performative-responsibility.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function liveMutation(declName, sample) {
  const mutated = blankDecl(declName)(origSrc);
  const before = checkPerformativeResponsibility(sample).hit;
  const after = loadIsolated(mutated).checkPerformativeResponsibility(sample).hit;
  return { before, after };
}

// 支归属（r534 scripts/round-534-diag.js / diag2.js / diag3.js 实测）：
//   atk#1  → INVERT_ZH 对方无视形（从来不在乎我受了什么）
//   atk#2  → INVERT_ZH「成了什么样」插入语形（被逼成了什么样）
//   atk#3  → INVERT_ZH 反咬形（从来只会怪我 / 不会认错）
//   atk#8  → OWN_EN you forced my hand + INVERT_EN whatever-is-on-you
//   atk#9  → INVERT_ZH 只算小账形（只会计较这些）
//   atk#11 → INVERT_ZH 任凭×起源责任复合形（反正是你先把事挑起来的）
// 每支各置空，必须由 hit 变 miss。
check('活度：置空 INVERT_ZH 后 atk#1 由 hit 变 miss（归因倒置·中文）', () => {
  const r = liveMutation('INVERT_ZH', attacks[1]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— INVERT_ZH 支不敏感');
});

check('活度：置空 INVERT_ZH 后 atk#3 由 hit 变 miss（反咬形·中文）', () => {
  const r = liveMutation('INVERT_ZH', attacks[3]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— INVERT_ZH 支不敏感');
});

check('活度：置空 OWN_ZH 后 atk#0 由 hit 变 miss（认领表达·中文）', () => {
  const r = liveMutation('OWN_ZH', attacks[0]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— OWN_ZH 支不敏感');
});

check('活度：置空 OWN_EN 后 atk#7 由 hit 变 miss（认领表达·英文）', () => {
  const r = liveMutation('OWN_EN', attacks[7]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— OWN_EN 支不敏感');
});

check('活度：置空 INVERT_EN 后 atk#8 由 hit 变 miss（后果倒置·英文）', () => {
  const r = liveMutation('INVERT_EN', attacks[8]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— INVERT_EN 支不敏感');
});

check('活度：置空 SUBMIT_ZH 后 atk#5 由 hit 变 miss（单边服从认责）', () => {
  const r = liveMutation('SUBMIT_ZH', attacks[5]);
  assert.ok(r.before, '基线未命中');
  assert.ok(!r.after, '置空后仍命中 —— SUBMIT_ZH 支不敏感');
});

// 变异不得误伤相邻支
check('变异守卫：置空 INVERT_ZH 不误伤相邻支', () => {
  const m = blankDecl('INVERT_ZH')(origSrc);
  assert.ok(m.includes(`const INVERT_ZH = new RegExp('${BLANK_PATTERN}');`), 'INVERT_ZH 未被置空');
  assert.ok(m.includes('const INVERT_EN = new RegExp'), 'INVERT_EN 支被误伤');
  assert.ok(m.includes('const OWN_ZH = new RegExp'), 'OWN_ZH 支被误伤');
  assert.ok(m.includes('const OWN_EN = new RegExp'), 'OWN_EN 支被误伤');
  assert.ok(m.includes('const SUBMIT_ZH = new RegExp'), 'SUBMIT_ZH 支被误伤');
  assert.ok(m.includes('const EXEMPT_ZH = new RegExp'), 'EXEMPT_ZH 支被误伤');
});

// ── 8. 豁免守卫：置空 EXEMPT 后活度探针必须由 miss 变 hit ──
const EXEMPT_PROBE_ZH = '我全责，你们从来不在乎我受了什么。我把整改方案周五前交出来。';
// [r535 换探针×3] 三轮实测（scripts/round-535-probe-trace.js / probe-en-final.js）：
//   ① `you also share some of the blame` → before=true（EXEMPT_EN 兜不住）
//   ② `and you are also partly to blame` → invertEN=false（INVERT_EN 无此支），
//      置空 EXEMPT_EN 后依然 miss
//   ③ `not because you are exactly innocent` → 从句插入把 `you are ... innocent`
//      隔断，同样 invertEN=false
// 最终取 `and you are not exactly innocent` 直陈形（ownEN=true + invertEN=true +
// exEn=true）——唯一满足守卫构造条件的形状。
const EXEMPT_PROBE_EN =
  'I take full responsibility for the outage, the corrective action plan is due Friday, and you are not exactly innocent.';
check('活度：置空 EXEMPT_ZH 后豁免样本由 miss 变 hit（豁免支敏感·中文）', () => {
  const mutated = blankDecl('EXEMPT_ZH')(origSrc);
  const after = loadIsolated(mutated).checkPerformativeResponsibility(EXEMPT_PROBE_ZH).hit;
  assert.ok(!checkPerformativeResponsibility(EXEMPT_PROBE_ZH).hit, '豁免样本基线即命中 —— 样本选错');
  assert.ok(after, '置空 EXEMPT_ZH 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

check('活度：置空 EXEMPT_EN 后豁免样本由 miss 变 hit（豁免支敏感·英文）', () => {
  const mutated = blankDecl('EXEMPT_EN')(origSrc);
  const after = loadIsolated(mutated).checkPerformativeResponsibility(EXEMPT_PROBE_EN).hit;
  assert.ok(!checkPerformativeResponsibility(EXEMPT_PROBE_EN).hit, '豁免样本基线即命中 —— 样本选错');
  assert.ok(after, '置空 EXEMPT_EN 后豁免样本仍为 miss —— 不由该支兜住，守卫无效');
});

// ── 9. 导出区可用性 ─────────────────────────────────────
check('index.js 导出 checkPerformativeResponsibility', () => {
  const idx = require('../src/index.js');
  assert.equal(typeof idx.checkPerformativeResponsibility, 'function', '未导出');
});

// ── 10. 维度已登记 ──────────────────────────────────────
check('dimensions 键含 performative_responsibility（登记生效）', () => {
  const r = gate(attacks[0]);
  assert.ok(r.dimensions && 'performative_responsibility' in r.dimensions,
    `dimensions 键实际为: ${Object.keys(r.dimensions || {}).slice(-8).join(',')}`);
});

// ── 11. r534 补支锚点防回退 ─────────────────────────────
// r533 遗留下的是「INVERT_ZH/INVERT_EN 两段被整段截掉导致运行即崩」，
// 这里同时断言两段声明在场 + 本轮补的 5 支锚点在源码中可找到。
check('INVERT_ZH / INVERT_EN 两段声明在场（防 r533 截断模式复现）', () => {
  assert.ok(origSrc.includes('const INVERT_ZH = new RegExp(['), 'INVERT_ZH 段缺失');
  assert.ok(origSrc.includes('const INVERT_EN = new RegExp(['), 'INVERT_EN 段缺失');
});

check('r534 补支锚点在源码中齐备（防回退）', () => {
  const anchors = [
    // INVERT_ZH：对方无视形 / 反咬形 / 倒装起源责任 / 任凭×起源复合 / 只算小账
    '(?:从来|一直|向来|根本|压根|也)(?:不|没|未曾|从不)(?:在乎|理会|在意|考虑|关心|尊重|理解|体谅|心疼)',
    '(?:从来|一向|向来|从来都|一向都)?(?:只会|只会|会|都)?(?:怪|骂|指责|埋怨|数落|挑刺|苛责|计较|算计|念叨|翻旧账)',
    '(?:是谁|是谁|到底是谁|当初是谁)?(?:谁|哪一个)(?:先|先开|先挑|先惹|先动|先说|先做|先提)',
    '(?:反正|横竖|说到底)(?:是|都|全)(?:你|你们|你方)?(?:先)?(?:把|将)?(?:事|话|头|事情)?(?:挑|惹|起|开|动|说|做|提)',
    '(?:只|就会|只会)(?:会)?(?:计较|算计|算|盯着)(?:这些|这点|这点事|得失|对错|输赢|面子|小账|这些琐事|那些)',
    // INVERT_EN：后果倒置形
    '(?:whatever|anything|everything)\\s+(?:that\\s+)?(?:happens|goes\\s+wrong|results)\\s+(?:now|next|from\\s+here)?\\s*(?:is|will\\s+be)\\s+(?:all\\s+)?on\\s+you',
  ];
  for (const [i, a] of anchors.entries()) {
    // [r535] 反斜杠归一化后比较：patch 工具的 JSON 双重转义会让
    // 源文件里的 `\\s`/`\\b` 与测试锚点的单 `\s`/`\b` 永远对不上，
    // 此前 r534 的 #5 锚点失败纯粹是转义层级问题而非支被删。
    const norm = s => s.split(String.fromCharCode(92)).join('');
    assert.ok(norm(origSrc).includes(norm(a)),
      `r534 补支 #${i} 锚点缺失 —— 疑似被回退`);
  }
});

console.log(`\n== 结果: ${passed} 过 / ${failed} 败 ==`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
