/**
 * scripts/negative-test-blame-externalization.js
 *
 * 第 666 轮负例验证：证明 test/round-666-blame-externalization.js 的断言
 * 真的会红——把被测模块的每条判据置空/篡改，本轮测试必须 FAIL。
 * 没有负例的守卫等同于没有守卫。
 *
 * 三类守门（ATTRIBUTION/ANALYSIS/QUESTION）是**防御性守门**：它们与
 * BLAME_ZH 射程互补（客观归因 vs 第一/二人称归责），当前样本集里没有
 * 「既命中双腿、又被守门豁免」的共现句，因此无法用行为注入证红。按
 * Phase 0.85 纪律改为两步证明：① includes 证明守门代码在模块里；
 * ② new RegExp(reLiteral) 对真实句式证明它不是死代码。
 *
 * 用法：node scripts/negative-test-blame-externalization.js
 * 期望：每个行为注入都让测试进程 exit 1，原样注入 exit 0，两个防御性
 * 守门各通过「存在 + 有效」两步证明。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const MOD = path.join(REPO, 'src/blame-externalization.js');
const IDX = path.join(REPO, 'src/index.js');
const TEST = path.join(REPO, 'test/round-666-blame-externalization.js');
const originalMod = fs.readFileSync(MOD, 'utf8');
const originalIdx = fs.readFileSync(IDX, 'utf8');

// 行为注入表：name -> [file, old, new]
const INJECTIONS = [
  ['置空左腿 BLAME_ZH（双腿判据断裂）', MOD,
    'const BLAME_ZH = new RegExp([', 'const BLAME_ZH = /(?!x)x/; /* neg */ const _unused = new RegExp(['],
  ['置空右腿 DEMAND_ZH（双腿判据断裂）', MOD,
    'const DEMAND_ZH = new RegExp([', 'const DEMAND_ZH = /(?!x)x/; /* neg */ const _unused2 = new RegExp(['],
  ['双腿判据改为或（缺一也判）', MOD,
    'if (!BLAME_ZH_.test(text)) return miss();', 'if (false) return miss();'],
  ['hitResult 恒 miss（判定层被摘）', MOD,
    '  if (DEMAND_ZH_.test(text)) return hitResult;', '  if (DEMAND_ZH_.test(text)) return miss(); /* neg */'],
  ['摘除 index.js allDims 登记（score 不进 findings）', IDX,
    "    {score: be.score, name:'blame_externalization'},", "    // neg {score: be.score, name:'blame_externalization'},"],
  ['index.js dimensions 登记改为无绑定变量（悬空引用）', IDX,
    '    blame_externalization: be,\n    // 以能力评价取消防护', '    blame_externalization: _be_null_ref, /* neg */\n    // 以能力评价取消防护'],
];

// 防御性守门两步证明表：name -> [常量名, 真实句式]
const DEFENSIVE = [
  ['守门 ATTRIBUTION_ZH 存在且有效', 'ATTRIBUTION_ZH', '这份报告指出，项目延期主要由需求变更导致。'],
  ['守门 ANALYSIS_ZH 存在且有效', 'ANALYSIS_ZH', '受害者姿态是一种心理防御机制，需要被识别但不应被滥用。'],
  ['守门 QUESTION_ZH 存在且有效', 'QUESTION_ZH', '如何应对总是把责任推给别人的人？'],
];

function runTest() {
  try {
    const out = execFileSync(process.execPath, [TEST], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

let red = 0, greenFail = 0, crashed = 0, defOk = 0, defBad = 0;
const results = [];

// 0) 基线：未注入必须全绿
{
  fs.writeFileSync(MOD, originalMod);
  fs.writeFileSync(IDX, originalIdx);
  const r = runTest();
  if (r.code === 0) { results.push(['GREEN(符合预期)', '基线（未注入）']); }
  else { greenFail++; results.push(['RED(基线异常!)', '基线（未注入）']); console.log('!! 基线就不是绿的，负例无效:\n' + r.out.slice(0, 800)); }
}

for (const [name, file, oldStr, newStr] of INJECTIONS) {
  const src = file === MOD ? originalMod : originalIdx;
  if (!src.includes(oldStr)) {
    results.push(['SKIP(锚点未找到)', name]);
    continue;
  }
  fs.writeFileSync(MOD, originalMod);
  fs.writeFileSync(IDX, originalIdx);
  fs.writeFileSync(file, src.replace(oldStr, newStr));
  const r = runTest();
  if (r.code === 1) { red++; results.push(['RED(符合预期)', name]); }
  else if (r.code === 0) { greenFail++; results.push(['GREEN(守卫失效!)', name]); }
  else { crashed++; results.push(['CRASH(exit ' + r.code + ')', name]); }
}

// 还原源码
fs.writeFileSync(MOD, originalMod);
fs.writeFileSync(IDX, originalIdx);

// 防御性守门两步证明
for (const [name, constName, sample] of DEFENSIVE) {
  // ① includes 证明代码存在（无反斜杠歧义）
  const exists = originalMod.includes('const ' + constName + ' = new RegExp([');
  if (!exists) { defBad++; results.push(['FAIL(代码不存在)', name]); continue; }
  // ② 从源码行抽出正则字面量后 new RegExp 证明有效
  const line = originalMod.split('\n').find(l => l.includes('const ' + constName + ' = new RegExp(['));
  // 常量以 [ ... ].join('|') 形式定义，用模块 __internals 直接取（最可靠）
  const mod = require(MOD);
  const re = mod.__internals()[constName];
  const effective = re instanceof RegExp && re.test(sample);
  if (effective) { defOk++; results.push(['PASS(存在+有效)', name]); }
  else { defBad++; results.push(['FAIL(正则是死代码)', name]); }
}

// 还原后必须复绿
{
  const r = runTest();
  if (r.code === 0) results.push(['GREEN(符合预期)', '还原后']);
  else { results.push(['RED(还原失败!)', '还原后']); console.log('!! 还原后仍红:\n' + r.out.slice(0, 800)); }
}

console.log('=== 负例验证结果 ===');
for (const [v, n] of results) console.log(('  ' + v).padEnd(26) + n);
console.log('\n行为注入: 红 ' + red + ' / 失效 ' + greenFail + ' / 崩溃 ' + crashed + ' / 共 ' + INJECTIONS.length + ' 个');
console.log('防御性守门: 通过 ' + defOk + ' / 失败 ' + defBad + ' / 共 ' + DEFENSIVE.length + ' 个');
const ok = red === INJECTIONS.length && greenFail === 0 && crashed === 0 && defOk === DEFENSIVE.length && defBad === 0;
console.log(ok ? '结论: 全部注入被守卫捕获，守卫有效。' : '结论: 存在未被捕获的注入，需检查守卫覆盖。');
process.exit(ok ? 0 : 1);
