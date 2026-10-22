/**
 * scripts/negative-test-past-commitment-negation.js
 *
 * [r700] standard_shift「既往承诺 × 当下否定」句式族守卫有效性负例验证。
 *
 * 方法同 r685-r699 negative-test-*.js：把 src/self-imposed-standard-shift.js
 * 里本轮新增的承重常量逐一置为永不匹配（改文件再跑测试文件），证明
 * test/round-700-past-commitment-negation.js 本身能抓住每个分支失效，
 * 确认测试由 12/12 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 12/12 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 12/12 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 6 处（均为 new RegExp 多行块，整块注入）：
 *   PAST_COMMITMENT_ZH（腿①既往承诺）、PRESENT_NEGATION_ZH（腿②当下否定）、
 *   CONTRAST_DISMISS_ZH（支b中文对比否定）、PAST_COMMITMENT_EN（腿①EN）、
 *   PRESENT_NEGATION_EN（腿②EN）、CONTRAST_DISMISS_EN（支bEN）。
 * 双腿注入只让共现样本红、单支注入只让对应支样本红——A1/A2 攻击集里
 * 每个样本只由被注入的那条腿承重（r691 纪律）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/self-imposed-standard-shift.js');
const TEST = path.join(HF, 'test/round-700-past-commitment-negation.js');

const INJECTS = [
  { name: 'PAST_COMMITMENT_ZH 整块（腿①既往承诺/付出）', block: 'PAST_COMMITMENT_ZH' },
  { name: 'PRESENT_NEGATION_ZH 整块（腿②当下否定/贬损）', block: 'PRESENT_NEGATION_ZH' },
  { name: 'CONTRAST_DISMISS_ZH 整块（支b中文对比否定断言）', block: 'CONTRAST_DISMISS_ZH' },
  { name: 'PAST_COMMITMENT_EN 整块（腿①EN既往承诺）', block: 'PAST_COMMITMENT_EN' },
  { name: 'PRESENT_NEGATION_EN 整块（腿②EN当下否定）', block: 'PRESENT_NEGATION_EN' },
  { name: 'CONTRAST_DISMISS_EN 整块（支bEN对比否定断言）', block: 'CONTRAST_DISMISS_EN' },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: HF, encoding: 'utf8', timeout: 180000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isCrashRed(out) {
  // 崩溃红（语法错/模块缺失/引用错/类型错）证明不了断言能抓分支失效
  return /SyntaxError|Cannot find module|ReferenceError|TypeError/.test(out);
}

// 定位 new RegExp( ... ); 块区间：返回 [startIdx, endIdx)（end 为 ); 行）
function locate(lines, inj) {
  const blockRe = new RegExp('^const ' + inj.block + ' = ');
  const start = lines.findIndex(l => blockRe.test(l));
  if (start < 0) return null;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\);/.test(lines[i])) return { kind: 'block', start, end: i };
  }
  return null;
}

function killLines(lines, range) {
  // const 声明行不碰（换成 '' 会把模式行变裸语句造成 SyntaxError——
  // 崩溃红结论失真，r692 实测）；模式行替换为 ''，保留行尾 + 或逗号
  const out = lines.slice();
  for (let i = range.start + 1; i < range.end; i++) {
    const line = out[i];
    if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) continue;
    const t = line.trim();
    if (t.endsWith(',')) out[i] = "''" + ",";
    else if (t.endsWith('+')) out[i] = "'' +";
    else out[i] = "''";
  }
  return out;
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 12 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（12 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 12/12 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const range = locate(lines, inj);
  if (!range) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（常量块未找到）');
    allRed = false;
    continue;
  }
  const killed = killLines(lines, range);
  const changed = killed.filter((l, i) => l !== lines[i]).length;
  if (changed === 0) {
    console.log('  ✗ ' + inj.name + ' :: 没有行被替换（定位空转）');
    allRed = false;
    continue;
  }
  fs.writeFileSync(SRC, killed.join('\n'));
  const r = runTest();
  const crash = !r.ok && isCrashRed(r.out);
  if (!r.ok && !crash) {
    console.log('  ✓ ' + inj.name + ' :: 断言红（守卫有效，替换 ' + changed + ' 行）');
  } else if (crash) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + r.out.split('\n').filter(l => /Error/.test(l))[0]);
    allRed = false;
  } else {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍全绿（守卫漏抓）');
    allRed = false;
  }
  // 立即还原（无论成败）
  fs.writeFileSync(SRC, lines.join('\n'));
}

// ── 2. 还原校验 ────────────────────────────────────────────────────
const afterMd5 = md5(SRC);
if (afterMd5 !== baseMd5) { console.error('还原后 md5 不一致！'); process.exit(1); }
const after = runTest();
if (!after.ok || !/结果: 12 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 12/12');
  process.exit(1);
}
console.log('还原: md5 一致，12/12 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
