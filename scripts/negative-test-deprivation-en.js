'use strict';
/**
 * scripts/negative-test-deprivation-en.js
 *
 * [r684] deprivation_coercion（第 125 维）英文侧 P5 通路负例验证脚本。
 * 逐一把本轮新增的九个正则分支置空（永不被匹配的正则），确认
 * test/round-684-deprivation-en.js 全部变红；基线（无注入）必须
 * exit 0。每次注入前从内存原文重写，注入后立即还原，结束做 md5
 * 校验。
 *
 * 注入目标（src/deprivation-coercion.js，按行内 marker 定位，不靠行号）：
 *   1. (a) no + 需求 + for you
 *   2. (b) grounded × no + 需求（语序1：grounded 在前）
 *   3. (b) grounded × no + 需求（语序2：no+需求 在前）
 *   4. (c) deserve 否认
 *   5. (d) 第一人称断供宣告
 *   6. (f) 庇护所剥夺 × until-you（语序1：剥夺在前）
 *   7. (f) 庇护所剥夺 × until-you（语序2：until-you 在前）
 *   8. (e) UTIL_OFF_EN 关停设施宣告腿
 *   9. (e) SUFFER_EN 对方受苦后果腿
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src', 'deprivation-coercion.js');
const TEST = path.join(HF, 'test', 'round-684-deprivation-en.js');

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const ORIGINAL = fs.readFileSync(SRC, 'utf8');
const ORIGINAL_MD5 = md5(ORIGINAL);

function runTest() {
  try {
    execFileSync(process.execPath, [TEST], { cwd: HF, stdio: 'pipe' });
    return { exit: 0 };
  } catch (e) {
    return { exit: e.status, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}

// marker 为文件内字面内容（String.raw 源码里的单层反斜杠形式）
const INJECTIONS = [
  { name: '(a) no+需求+for you 置空', marker: 'for\\s+you\\b`' },
  { name: '(b) grounded×no+需求 语序1 置空', marker: 'grounded\\b[^.]{0,40}\\bno' },
  { name: '(b) grounded×no+需求 语序2 置空', marker: 'water)\\b[^.]{0,40}\\bgrounded' },
  { name: '(c) deserve 否认置空', marker: 'deserve\\s+to\\s+(?:eat|sleep|drink|rest)' },
  { name: '(d) 第一人称断供宣告置空', marker: 'not\\s+paying\\s+for|no\\s+longer\\s+paying\\s+for' },
  { name: '(f) 庇护所×until-you 语序1 置空', marker: 'car)\\b[^.]{0,30}\\buntil' },
  { name: '(f) 庇护所×until-you 语序2 置空', marker: 'until\\s+(?:you|he|she|they)\\b[^.]{0,30}\\b(?:stay|sleep)' },
  { name: '(e) UTIL_OFF_EN 关停宣告腿置空', marker: 'turning|shutting|switching' },
  { name: '(e) SUFFER_EN 受苦后果腿置空', marker: 'freeze|be\\s+cold|go\\s+cold|suffer' },
];

function locateLine(src, marker) {
  const lines = src.split('\n');
  const idx = lines.findIndex(l => l.includes('String.raw`') && l.includes(marker));
  return { lines, idx };
}

// ─── 基线：无注入必须 exit 0 ───────────────────────────────────────────
const base = runTest();
console.log('基线（无注入）: exit=' + base.exit + (base.exit === 0 ? ' ✅' : ' ❌ 基线就红，脚本不成立'));
if (base.exit !== 0) { console.log(base.out || ''); process.exit(1); }

// ─── 逐项注入 ─────────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTIONS) {
  const { lines, idx } = locateLine(ORIGINAL, inj.marker);
  if (idx < 0) {
    console.log('❌ ' + inj.name + ' :: 定位失败（marker 未命中或命中行不含 String.raw）');
    allRed = false;
    continue;
  }
  const origLine = lines[idx];
  const mutated = origLine.replace(/String\.raw`[^`]*`/, 'String.raw`(?!x)x`');
  if (mutated === origLine) {
    console.log('❌ ' + inj.name + ' :: 第 ' + (idx + 1) + ' 行替换未生效');
    allRed = false;
    continue;
  }
  const mutatedLines = lines.slice();
  mutatedLines[idx] = mutated;
  fs.writeFileSync(SRC, mutatedLines.join('\n'));
  const r = runTest();
  fs.writeFileSync(SRC, ORIGINAL); // 立即还原
  const ok = r.exit !== 0;
  if (!ok) allRed = false;
  const firstFail = ok ? ((r.out || '').split('\n').find(l => l.includes('MISS:') || l.includes('::')) || '').slice(0, 90) : '';
  console.log((ok ? '✅' : '❌') + ' ' + inj.name + ' :: exit=' + r.exit + (ok ? '（测试变红）' : '（测试仍绿——负例失效）') + (firstFail ? ' | ' + firstFail.trim() : ''));
}

// ─── md5 校验还原一致 ─────────────────────────────────────────────────
const finalMd5 = md5(fs.readFileSync(SRC, 'utf8'));
const restored = finalMd5 === ORIGINAL_MD5;
console.log((restored ? '✅' : '❌') + ' 还原校验: md5 ' + (restored ? '一致' : '不一致！'));
if (!restored) allRed = false;

console.log(allRed ? '=== 负例验证通过：9/9 注入全部变红，基线绿，还原一致 ===' : '=== 负例验证失败 ===');
process.exit(allRed ? 0 : 1);
