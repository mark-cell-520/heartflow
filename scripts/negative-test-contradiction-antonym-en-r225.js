#!/usr/bin/env node
/**
 * scripts/negative-test-contradiction-antonym-en-r225.js
 *
 * 第 225 轮负例守卫：证明 test/contradiction-antonym-en-r225.test.js
 * 真的在守东西。
 *
 * 方法论（承接 223/224 轮教训）：**部分删词表是无效变异**，
 * 一律采用「整条规则级」变异：
 *
 *   M1 把第 19 条 pair 整条删掉          → 12 条正向样本必须全变红
 *   M2 数组形态 positive 支持删掉        → 退回 text.match(数组) 崩溃/漏判，必须变红
 *   M3 EN_CONTRADICTION_ANTONYMS 整表清空 → 正向样本必须全变红
 *   M4 negative 连接词换成永不匹配占位   → 无连接词确认，正向必须全变红
 *   M5 三重豁免全关掉                    → 反向族（比较级/分条件）必须变红
 *   M6 只删 safe/dangerous 一组（部分删） → 证明该组样本真的被它守着（预期真红）
 *   C0 对照（identity mutate）            → 必须全绿，否则守卫自身失效
 *
 * 输出只报数字与样本编号，不打印样本文本。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TEST = path.join(ROOT, 'test', 'contradiction-antonym-en-r225.test.js');

const original = fs.readFileSync(SRC, 'utf8');

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
    const m = out.match(/测试结果: (\d+) 通过, (\d+) 失败/);
    return { green: m ? Number(m[2]) === 0 : false, fail: m ? Number(m[2]) : -1, out };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const m = out.match(/测试结果: (\d+) 通过, (\d+) 失败/);
    // 语法崩溃（无标准行）也算红，但单独标注，不计入「真红」
    const crashed = !m && /SyntaxError|ReferenceError|TypeError/.test(out);
    return { green: false, fail: m ? Number(m[2]) : -1, crashed, out };
  } finally {
    fs.writeFileSync(SRC, original);
  }
}

// ── 变异定义：每个都是「整条规则级」改动 ──────────────────────────
const MUTATIONS = [
  {
    id: 'M1',
    desc: '第 19 条 pair 整条删除（判据消失）',
    apply: (s) => s.replace(
      /\n  \/\/ 19\. English: evaluative antonym co-occurrence[\s\S]*?\n  \{ positive: EN_CONTRADICTION_ANTONYMS, negative: \/\\b\(\?:and\|but\|yet\|while\|though\|although\|whilst\|however\|at the same time\|simultaneously\|yet still\)\\b\/i \},\n/,
      '\n'),
  },
  {
    id: 'M2',
    desc: '删掉数组形态 positive 分支（退回 text.match 数组 → 崩/漏判）',
    apply: (s) => s.replace(
      /    let posMatch = null;\n    let antonymSpan = null;\n    if \(Array\.isArray\(pair\.positive\)\) \{[\s\S]*?\n    \} else \{\n      posMatch = text\.match\(pair\.positive\);\n    \}/,
      '    const posMatch = text.match(pair.positive);'),
  },
  {
    id: 'M3',
    desc: 'EN_CONTRADICTION_ANTONYMS 整表清空',
    apply: (s) => s.replace(
      /const EN_CONTRADICTION_ANTONYMS = \[\n(?:.*\n)*?\];/,
      'const EN_CONTRADICTION_ANTONYMS = [];'),
  },
  {
    id: 'M4',
    desc: '第 19 条 negative 连接词换成永不匹配占位（无连接词确认）',
    apply: (s) => s.replace(
      /negative: \/\\b\(\?:and\|but\|yet\|while\|though\|although\|whilst\|however\|at the same time\|simultaneously\|yet still\)\\b\/i/,
      'negative: /(?!)NOT_A_REAL_REGEX/'),
  },
  {
    id: 'M5',
    desc: '三重豁免全关掉（设计性/取舍/分条件都不豁免）',
    apply: (s) => s.replace(
      /      if \(Array\.isArray\(pair\.positive\)\) \{\n        if \(hasDesignContext \|\| hasTradeoff\) continue;\n        if \(antonymSpan && EN_CONTRADICTION_CONDITION_SPLIT\.test\(antonymSpan\)\) continue;\n      \}/,
      '      // MUTATED: 三重豁免已关'),
  },
  {
    id: 'M6',
    desc: '只删 safe/dangerous 一组（部分删，证明该组样本被它守着）',
    apply: (s) => s.replace("  ['fast', 'slow'], ['safe', 'dangerous'], ['cheap', 'expensive'],", "  ['fast', 'slow'], ['cheap', 'expensive'],"),
  },
];

// ── M7：删掉正向组 1 的样本（证明测试真的依赖它们）───────────────
const M7 = {
  id: 'M7',
  desc: '正向族样本池清空（测试自身不能空转）',
  applyTest: (t) => t.replace(
    /const POSITIVE_ANTONYM = \[\n(?:.*\n)*?\];/,
    'const POSITIVE_ANTONYM = [];'),
};

let redCount = 0, invalidCount = 0, errCount = 0;
const results = [];

for (const m of MUTATIONS) {
  let mutated;
  try { mutated = m.apply(original); }
  catch (e) { errCount++; results.push(`${m.id} 变异失败: ${e.message}`); continue; }
  if (mutated === original) { invalidCount++; results.push(`${m.id} 无效变异（apply 未改源码）`); continue; }
  // 语法自检：变异不得引入语法错误（否则「真红」来自崩而非断言失败）
  try {
    require('child_process').execFileSync('node', ['--check', SRC], { stdio: 'pipe' });
  } catch (_) { /* 语法错误由下面的 crashed 标记捕获 */ }
  fs.writeFileSync(SRC, mutated);
  const r = runTest();
  if (r.crashed) { errCount++; results.push(`${m.id} 变异引入语法/运行崩溃 — 不计真红`); }
  else if (r.green) { invalidCount++; results.push(`${m.id} 无效变异 — 守卫仍是绿的（${r.fail}）`); }
  else { redCount++; results.push(`${m.id} 真红 (${r.fail} 失败)`); }
}

// 对照（identity mutate）：不做任何改动，必须全绿
{
  const r = runTest();
  if (r.green) results.push('C0 对照全绿 OK');
  else { errCount++; results.push(`C0 对照失败（${r.fail} 失败）— 守卫自身坏了`); }
}

// M7：改测试文件本身
{
  const t0 = fs.readFileSync(TEST, 'utf8');
  let t;
  try { t = M7.applyTest(t0); }
  catch (e) { results.push(`${M7.id} 变异失败: ${e.message}`); t = null; }
  if (t && t !== t0) {
    fs.writeFileSync(TEST, t);
    const r = runTest();
    fs.writeFileSync(TEST, t0);   // 先还原测试
    if (r.green) { invalidCount++; results.push(`${M7.id} 无效变异 — 清空正向样本后仍全绿`); }
    else { redCount++; results.push(`${M7.id} 真红 (${r.fail} 失败)`); }
  } else if (t === t0) {
    results.push(`${M7.id} 无效变异（applyTest 未改测试）`);
    invalidCount++;
  }
}

fs.writeFileSync(SRC, original);
console.log('── 第 225 轮负例守卫：英文反义评价对矛盾判据 ──');
for (const r of results) console.log(' ', r);
console.log(`汇总: ${redCount} 真红, ${invalidCount} 无效变异, ${errCount} 异常, 共 ${MUTATIONS.length + 1} 变异 + 1 对照`);
// 真红应等于 M1..M6（源码变异）+ M7（测试样本变异）之和
const EXPECTED_RED = MUTATIONS.length + 1;
process.exit(invalidCount === 0 && errCount === 0 && redCount === EXPECTED_RED ? 0 : 1);
