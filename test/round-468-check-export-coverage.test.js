/**
 * test/round-468-check-export-coverage.test.js
 *
 * r468 — check* 导出覆盖率不变量（dispatch 了的每个维度都必须外部可达）
 *
 * 缺口实证（scripts/round-467/probe-r467-export-audit.js 复跑 + 本轮标识符级审计）：
 *   · discriminate() 调用 251 个 check* 函数，module.exports 仅登记 219 个，
 *     52 个维度在管线内正常判定，却在 MCP 单点调用面完全不可达。
 *   · 不可达的机理在 src/mcp-server.js handleCheckSingle：
 *       const fnName = 'check' + dimension.split('_')
 *         .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
 *       const fn = hf[fnName];
 *       if (!fn) return { error: `维度 ${dimension} (${fnName}) 不存在`, available };
 *     dimension 名转驼峰后查 src/index.js 的 exports——查不到就返回「维度不存在」，
 *     并把 available 列表一起吐回去。导出是可达性的**唯一**开关。
 *   · 典型受害面：loyalty_by_omission（r467 已修）、multi_turn_escalation、
 *     false_dilemma、ad_nauseam、motivated_reasoning 等。
 *
 * 本轮修完 52 项后又抓出 6 项，原因是静态调用扫描有两个盲区（组 3 固化）：
 *   盲区①「函数作为值传递」：`_dual(_mt.checkPhishingCoercion)` 把函数当参数交给
 *     包装器，正则 `\b(check[A-Z]\w*)\s*\(` 后面跟的不是括号，抓不到。
 *     checkRewardHacking 就是这么漏的（L3095 `_dual(checkRewardHacking)`）。
 *   盲区②「绑定名与导出名不一致」：checkWeakEvidenceStrongClaim 顶层绑定成了
 *     _checkWeakEvidenceStrongClaim，导出用的是带下划线的名字，handler 按
 *     checkWeakEvidenceStrongClaim 自然查不到。
 *   → 结论：**只看 `checkXxx(` 调用形态的扫描不足以证明覆盖**，必须做标识符级
 *     ∪ 运行时 typeof 双重校验。本文件组 2/3 即为此而设。
 *
 * 为什么单独立一个覆盖率测试，而不是只修不测：
 *   r467 修第 82 维度时，探针已算出「55 个同类缺口，本轮修其中 1 个作闭环示范」。
 *   若不把不变量固化成断言，下一次新增维度照样会漏导出，且**只有用户真的去调
 *   heartflow_check_single 时才会发现**——管线内部测试全绿，看不出来。
 *   本文件把「dispatch 了就必须导出」变成可判定的硬约束。
 *
 * 有意不导出（逐条说明理由，组 4 断言其确实不可达）：
 *   checkOutput — src/gate.js 的顶层入口，签名/语义都不同于单维度判别
 *     （吃 (text, options) 走 11 层管线并返回 action），导出会让
 *     heartflow_check_single(dimension='output') 拿到完全异形的返回值。
 *     index.js 里它只是注释里被提及，从未绑定、从未导出。
 *   checkDespacedInjection / checkInjectionSynonyms — prompt_injection 判别的
 *     内部腿（L133/L169，与另两条字面通道合并成一个聚合结果），不产生独立
 *     dimension，handler 按 despaced_injection / injection_synonyms 查本就无对应维度。
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
  }
}

const idx = require(path.join(ROOT, 'src', 'index.js'));
const SRC = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');

// ─── 静态抽取工具 ────────────────────────────────────────────
function extractExportBlock() {
  const start = SRC.indexOf('\nmodule.exports = {');
  assert.ok(start > 0, 'src/index.js 应有 module.exports 区块');
  const end = SRC.indexOf('\n};', start);
  assert.ok(end > start, 'module.exports 区块应能定位到收尾');
  return SRC.slice(start, end);
}

const EXPORT_BLOCK = extractExportBlock();
// 兼容三种写法：`checkXxx,` / `checkXxx: v,` / `checkXxx: require(...).checkXxx,`
const STATIC_EXPORTED = new Set(
  [...EXPORT_BLOCK.matchAll(/^\s{2}(check[A-Z]\w*)\s*[,:]/gm)].map(m => m[1])
);

// 全文标识符（去注释）——覆盖「直接调用」与「作为值传递」两种形态
const SRC_NO_COMMENT = SRC.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const ALL_CHECK_IDS = new Set([...SRC_NO_COMMENT.matchAll(/\b(check[A-Z]\w*)\b/g)].map(m => m[1]));

// 有意不导出（逐条理由见文件头与组 4 的实证断言）。提前定义是因为组 2/3
// 的宽口径断言要先剔除它们——只看调用形态的窄口径扫描会把这 3 项误报成缺口。
const NOT_A_DIMENSION = new Set([
  'checkOutput',                // gate 顶层入口，理由见文件头
  'checkDespacedInjection',     // prompt_injection 内部腿
  'checkInjectionSynonyms',     // prompt_injection 内部腿
]);


// discriminate() 函数体内的直接调用形态（用于组 1 的窄口径断言）
function extractCalledInDiscriminate() {
  const start = SRC.indexOf('function discriminate(');
  assert.ok(start > 0, 'src/index.js 应有 discriminate() 函数');
  let depth = 0;
  let end = -1;
  for (let i = SRC.indexOf('{', start); i < SRC.length; i++) {
    if (SRC[i] === '{') depth++;
    else if (SRC[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  assert.ok(end > start, 'discriminate() 函数体应能定位到收尾括号');
  const body = SRC.slice(start, end).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...body.matchAll(/\b(check[A-Z]\w*)\s*\(/g)].map(m => m[1]))];
}
const CALLED = extractCalledInDiscriminate();

function fnNameForDimension(dimension) {
  return 'check' + dimension.split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
function dimensionOf(fnName) {
  return fnName.replace(/^check/, '').replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
}

// ─── 组 1：窄口径——discriminate() 直接调用的必须全部导出 ────
check('discriminate() 调用的 check* 函数必须全部导出', () => {
  const gap = CALLED.filter(n => !STATIC_EXPORTED.has(n));
  assert.deepStrictEqual(gap, [],
    `以下 ${gap.length} 个维度被 dispatch 但未导出，MCP heartflow_check_single 将返回「维度不存在」：\n` +
    '      ' + gap.join('\n      '));
});

// ─── 组 2：宽口径——标识符级 + 运行时 typeof 双重校验 ───────
// 这一组是盲区①（传值形态）的防线。只看调用形态会漏掉 checkRewardHacking 这类
// 把函数交给 _dual 包装器的维度。
check('index.js 全文出现的 check* 标识符必须全部导出且为 function', () => {
  const notFn = [...ALL_CHECK_IDS].filter(n => typeof idx[n] !== 'function');
  const outside = notFn.filter(n => !NOT_A_DIMENSION.has(n));
  const detail = outside.map(n => `      ${n} (typeof = ${typeof idx[n]})`).join('\n');
  assert.deepStrictEqual(outside, [],
    `以下 check* 标识符未导出或值非 function：\n${detail}`);
});

check('每个标识符经 handler 的 dimension→驼峰规则都能命中 function', () => {
  const miss = [];
  for (const fn of ALL_CHECK_IDS) {
    if (NOT_A_DIMENSION.has(fn)) continue;   // 白名单项本就无对应维度
    const target = idx[fnNameForDimension(dimensionOf(fn))];
    if (typeof target !== 'function') miss.push(`${dimensionOf(fn)} -> ${fnNameForDimension(dimensionOf(fn))}`);
  }
  assert.deepStrictEqual(miss, [], `以下维度按 handler 规则查不到 function：\n      ${miss.join('\n      ')}`);
});

check('handler 视角可用 check 维度数 ≥ 275（r468 补齐后基线 277）', () => {
  const n = Object.keys(idx).filter(k => /^check[A-Z]/.test(k)).length;
  assert.ok(n >= 275, `可用 check 维度仅 ${n} 个，低于 r468 后的 277 基线，疑似导出被回退`);
});

check('静态导出声明的数量必须与运行时 function 数量一致（防导出区写错名字）', () => {
  const staticCount = STATIC_EXPORTED.size;
  const runtimeCount = Object.keys(idx).filter(k => /^check[A-Z]/.test(k) && typeof idx[k] === 'function').length;
  assert.strictEqual(runtimeCount, staticCount,
    `导出区声明 ${staticCount} 个 check*，运行时只有 ${runtimeCount} 个是 function` +
    '——说明有导出行绑定的值不是函数（典型：名字写错或源模块未导出该名）');
});

// ─── 组 3：单参调用契约（handler 只传 text） ─────────────────
const R468_ADDED = [
  // 第一批 52 项：静态调用扫描可及
  'checkAdNauseam', 'checkAffirmingDisjunct', 'checkAgencyDeflection',
  'checkAggregationOverreach', 'checkAppealToIgnorance', 'checkAppealToSpite',
  'checkAppealToTradition', 'checkAppealToWealth', 'checkArgumentToModeration',
  'checkAttributionVacuum', 'checkBaselineOmission',
  'checkChoiceArchitectureManipulation', 'checkClaimedVerificationWithoutTrail',
  'checkCoerciveAffection', 'checkComplexityShield', 'checkConcessionCoercion',
  'checkCumHoc', 'checkDoseResponseLinearity', 'checkEconReasoningGate',
  'checkEvidenceClaimMismatch', 'checkExistentialFallacy',
  'checkFallacyOfRelevance', 'checkFalseDilemma', 'checkFalseMemoryTransplant',
  'checkFalsePrecision', 'checkGoalDrift', 'checkHomogeneityAssumption',
  'checkInterventionEffectWithoutBaseline', 'checkLeadTimeBias',
  'checkManufacturedConsent', 'checkMaskedManFallacy', 'checkMeanAsTypical',
  'checkMostTransitivity', 'checkMotteAndBailey', 'checkMotivatedReasoning',
  'checkMultiTurnEscalation', 'checkNegativeExistentialImport',
  'checkOpinionEntitlement', 'checkPackageDeal', 'checkPercentBasisShift',
  'checkPerfectError', 'checkPrePostAttribution', 'checkProbabilityNeglect',
  'checkProtopathicBias', 'checkPzombieBoundary', 'checkQuantifierScopeShift',
  'checkRedHerring', 'checkRegressionToMean', 'checkStatisticalMisleading',
  'checkTuringRoute', 'checkUndistributedMiddle', 'checkVividCaseAvailability',
  // 第二批 6 项：静态调用扫描的两个盲区
  'checkPhishingCoercion', 'checkInducedTrust', 'checkCoverupInduction',
  'checkDangerousInstruction', 'checkRewardHacking', 'checkWeakEvidenceStrongClaim',
];

check('r468 补齐清单完整在位（58 项）', () => {
  assert.strictEqual(R468_ADDED.length, 58, `清单应 58 项，实得 ${R468_ADDED.length}`);
  assert.strictEqual(new Set(R468_ADDED).size, 58, '清单内不应有重复项');
  const missing = R468_ADDED.filter(n => typeof idx[n] !== 'function');
  assert.deepStrictEqual(missing, [], `以下补齐项失效：${missing.join(', ')}`);
  // 每一行都必须留在源码导出区里，不能只靠运行时碰巧存在
  const noTrace = R468_ADDED.filter(n => !new RegExp('^\\s{2}' + n + '\\s*[,:]', 'm').test(EXPORT_BLOCK));
  assert.deepStrictEqual(noTrace, [], `以下项在导出区无痕迹：${noTrace.join(', ')}`);
});

check('r468 补齐项单参 (text) 调用不抛错（handler 只传 text）', () => {
  const sample = '上次考了年级最差，考前吃了巧克力，这次回到班级中等——巧克力确实有用。' +
    'After our worst quarter we hired the new consultant, and revenue bounced back — the hire fixed it.';
  const errs = [];
  for (const fn of R468_ADDED) {
    try { idx[fn](sample); } catch (e) { errs.push(`${fn}: ${e.message.slice(0, 80)}`); }
  }
  assert.deepStrictEqual(errs, [], `单参调用抛错：\n      ${errs.join('\n      ')}`);
});

// ─── 组 4：白名单必须显式且最小 ──────────────────────────────
check('不可导出的标识符必须逐一落在白名单内（白名单不许偷偷变大）', () => {
  const unreachable = [...ALL_CHECK_IDS].filter(n => typeof idx[n] !== 'function');
  const outside = unreachable.filter(n => !NOT_A_DIMENSION.has(n));
  assert.deepStrictEqual(outside, [],
    `白名单外出现不可导出项：${outside.join(', ')}——要么补导出，要么把理由写进 NOT_A_DIMENSION`);
  const stale = [...NOT_A_DIMENSION].filter(n => typeof idx[n] === 'function');
  assert.deepStrictEqual(stale, [],
    `白名单项已变为可达（理由可能已失效，请复核后移出）：${stale.join(', ')}`);
});

check('checkOutput 确实是 gate 入口而非单维度（白名单理由实证）', () => {
  const gate = require(path.join(ROOT, 'src', 'gate.js'));
  assert.strictEqual(typeof gate.checkOutput, 'function',
    'src/gate.js 应导出 checkOutput');
  assert.strictEqual(idx.checkOutput, undefined,
    'idx.checkOutput 不应存在——它属于 gate，签名吃 (text, options) 走 11 层管线');
});

check('两个注入内部腿确实不产生独立 dimension', () => {
  // 它们只在 prompt_injection 判别的聚合函数内被调用，返回值并入 injections 数组，
  // 不写 dimension/name 字段。
  assert.ok(!/dimension:\s*['"]despaced_injection['"]/.test(SRC), '不应有 despaced_injection 维度');
  assert.ok(!/name:\s*['"]despaced_injection['"]/.test(SRC), '不应有 despaced_injection 汇总项');
  assert.ok(!/dimension:\s*['"]injection_synonyms['"]/.test(SRC), '不应有 injection_synonyms 维度');
  assert.ok(!/name:\s*['"]injection_synonyms['"]/.test(SRC), '不应有 injection_synonyms 汇总项');
  // 腿的归属维度在（汇总数组形态 `{score, name}`，不是 dimension: 字段）
  assert.ok(/name:\s*['"]prompt_injection['"]/.test(SRC), '应有 prompt_injection 汇总项（腿的归属）');
});

check('第二批 6 项中属 BLOCK_DIMS 的必须有阻断记录（证明是正式维度）', () => {
  // src/index.js L5288 BLOCK_DIMS 收的是「单条命中即硬撤」的维度。phishing_coercion /
  // coverup_induction / dangerous_instruction 在其中——它们不是可选装饰，是不可达
  // 会导致外部调用方误判「该攻击面不存在」的高危维度。
  const BLOCKERS_IN_BATCH = ['phishing_coercion', 'coverup_induction', 'dangerous_instruction'];
  const m = SRC.match(/const BLOCK_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, '应能定位 BLOCK_DIMS 声明');
  for (const d of BLOCKERS_IN_BATCH) {
    assert.ok(m[1].includes(`'${d}'`),
      `BLOCK_DIMS 应含 ${d}——若已移出，请复核本条断言的理由是否仍成立`);
  }
});

// ─── 汇总 ────────────────────────────────────────────────────
console.log(`\nr468 check 导出覆盖率：${passed} 通过, ${failed} 失败`);
if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FAIL: ${f.name}\n        ${f.error}`);
  }
  process.exit(1);
}
process.exit(0);
