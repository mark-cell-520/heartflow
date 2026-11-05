/**
 * negative-test-negation-guard-r217.js — 负例验证（r217 / v6.8.145）
 *
 * 验证 `test/round-217-negation-guard.test.js` 真的在守门：
 * 把本轮否定守卫的注入点逐条打死，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 沿用 negative-test-absolute-claim-en.js 的注入纪律（r713/r718 反复踩过的坑）：
 *   ① 注入必须真的改变源码（对照副本 mutate: s => s 会被判「注入未生效」）。
 *   ② 注入产物必须是合法 JS（不能变成语法错误——崩溃 ≠ 变红）。
 *   ③ needle 是**源码里逐字出现**的字符串（含 \\ 单层反斜杠的源码字面量），
 *      不手写正则、不猜转义层数。
 *   ④ 只改守卫本身，不改被测断言。
 *
 * 四个注入点（守卫 + 三个接线点，覆盖「实现但没接线」的假接线模式）：
 *   A. dev-exemptions.isNegatedBypassHit 恒 false —— 守卫本体死
 *   B. dev-exemptions.isNegatedCrisisWaiverSpan 恒 false —— 危机跨度守卫死
 *   C. dangerous-instruction 接线点替换为 false —— di 不接守卫
 *   D. reward-hacking 接线点替换为 false —— rh 不接守卫
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '', '..'); // 仓库根
const TEST_REL = 'test/round-217-negation-guard.test.js';

// 每个注入：file + needle（源码逐字） + replace（合法 JS，语义=守卫失效）
const INJECTIONS = [
  {
    name: 'A: isNegatedBypassHit 恒 false（守卫本体死）',
    file: 'src/dev-exemptions.js',
    needle: 'function isNegatedBypassHit(text, start, len) {',
    replace: 'function isNegatedBypassHit(text, start, len) { return false;',
  },
  {
    name: 'B: isNegatedCrisisWaiverSpan 恒 false（危机跨度守卫死）',
    file: 'src/dev-exemptions.js',
    needle: 'function isNegatedCrisisWaiverSpan(text, start, len) {',
    replace: 'function isNegatedCrisisWaiverSpan(text, start, len) { return false;',
  },
  {
    name: 'C: dangerous-instruction 不接守卫（接线点死）',
    file: 'src/dangerous-instruction.js',
    needle: '&& !isNegatedBypassHit(_t, m.index, m[0].length)) {',
    replace: '&& !false) {',
  },
  {
    name: 'D: reward-hacking 不接守卫（接线点死）',
    file: 'src/reward-hacking.js',
    needle: 'if (pm && _devExempt.isNegatedBypassHit(text, pm.index, pm[0].length)) continue;',
    replace: 'if (pm && false) continue;',
  },
];

// 一次性工作区：复制 src/ + test/ + VERSION + 运行目录依赖
function makeWorkspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg217-'));
  for (const d of ['src', 'test', 'scripts', 'bin', 'data', 'formulas']) {
    const from = path.join(HF, d);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(tmp, d), { recursive: true });
  }
  for (const f of ['VERSION', 'package.json', 'SKILL.md']) {
    const from = path.join(HF, f);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(tmp, f));
  }
  return tmp;
}

function runTest(cwd) {
  try {
    const out = execFileSync(process.execPath, [path.join('test', 'round-217-negation-guard.test.js')],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
    return { red: false, out: String(out) };
  } catch (e) {
    // 退出码非 0：区分「断言失败（真变红）」与「加载崩溃（假阴性）」
    const out = String(e.stdout || '') + String(e.stderr || '');
    const crashed = /Cannot find module|SyntaxError|is not a function|ReferenceError|ENOENT/.test(out);
    return { red: !crashed, crashed, out };
  }
}

let ok = 0, bad = 0;
const ws = makeWorkspace();
try {
  // 对照：未注入必须全绿
  const base = runTest(ws);
  if (base.red) { console.log(`FAIL 对照副本未注入即红（基线异常）:\n${base.out.slice(0, 600)}`); bad++; }
  else { console.log('  ok 对照副本未注入全绿（基线成立）'); ok++; }

  for (const inj of INJECTIONS) {
    const abs = path.join(ws, inj.file);
    const orig = fs.readFileSync(abs, 'utf8');
    if (!orig.includes(inj.needle)) {
      console.log(`FAIL ${inj.name}: needle 未在源码中找到（注入未生效，判红无效）`);
      bad++;
      continue;
    }
    fs.writeFileSync(abs, orig.replace(inj.needle, inj.replace));
    const r = runTest(ws);
    fs.writeFileSync(abs, orig); // 还原，供下一个注入
    if (r.crashed) {
      console.log(`FAIL ${inj.name}: 副本崩溃而非断言失败（崩溃≠变红）\n${r.out.slice(0, 400)}`);
      bad++;
    } else if (r.red) {
      const m = r.out.match(/FAIL ([^\n:]+)/);
      console.log(`  ok ${inj.name} → 守卫变红（${m ? m[1].trim() : '断言失败'}）`);
      ok++;
    } else {
      console.log(`FAIL ${inj.name}: 注入后守卫仍全绿（测试没守住这条规则）`);
      bad++;
    }
  }
} finally {
  fs.rmSync(ws, { recursive: true, force: true });
}

console.log(`\n# 负例验证汇总: ${ok} passed, ${bad} failed`);
if (bad > 0) process.exit(1);
