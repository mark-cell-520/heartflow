// r351 负例守卫：删掉 symbol 安全化行后，G 组守卫必须重新变红
// 守卫对象：src/index.js discriminate() 入口的 `if (typeof text === 'symbol') text = String(text);`
// 形状说明：非字符串输入 × 正则测试隐式转换 —— Symbol 是唯一崩点类型。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src/index.js');
const GUARD = path.join(ROOT, 'test/dangerous-instruction-en-listverb-round211.test.js');

const original = fs.readFileSync(SRC, 'utf8');
const NEEDLE = "  if (typeof text === 'symbol') text = String(text);\n";

function runGuard() {
  try {
    const out = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8' });
    return { line: out.trim().split('\n').pop(), threw: false };
  } catch (e) {
    // 守卫 test 在 exitCode 1 时仍会打印汇总行，stderr/stdout 都要收
    const text = ((e.stdout || '') + '\n' + (e.stderr || '')).trim().split('\n').filter(Boolean).pop() || 'NO_SUMMARY';
    return { line: text, threw: true };
  }
}

let deleted = false;
try {
  // 删除点 1：整行摘除（含 symbol 保护）
  fs.writeFileSync(SRC, original.replace(NEEDLE, ''));
  deleted = true;
} catch (e) {
  console.log('DELETE_FAIL(整行) ' + e.message);
}

let fail1 = -1, fail2 = -1;
if (deleted) {
  const r = runGuard();
  const m = /(\d+) 通过, (\d+) 失败/.exec(r.line);
  if (m) fail1 = parseInt(m[2], 10);
  const okR = fail1 >= 1;
  console.log('删除点1(整行symbol保护): ' + r.line + ' => ' + (okR ? 'RED_OK' : 'RED_NO_MISS'));
}

// 还原，再试删除点 2：只改成无效改写（typeof 误判，恒 false）
fs.writeFileSync(SRC, original);
let ok2 = false;
try {
  const mutated = original.replace(NEEDLE, "  if (typeof text === 'symbol' && false) text = String(text);\n");
  fs.writeFileSync(SRC, mutated);
  const r = runGuard();
  const m = /(\d+) 通过, (\d+) 失败/.exec(r.line);
  if (m) fail2 = parseInt(m[2], 10);
  ok2 = fail2 >= 1;
  console.log('删除点2(恒false改写): ' + r.line + ' => ' + (ok2 ? 'RED_OK' : 'RED_NO_MISS'));
} catch (e) {
  console.log('删除点2 抛错: ' + e.message);
}

// 还原后基线必须 78/0
fs.writeFileSync(SRC, original);
let baseOk = false;
{
  const r = runGuard();
  const m = /(\d+) 通过, (\d+) 失败/.exec(r.line);
  baseOk = !!m && parseInt(m[1], 10) === 78 && parseInt(m[2], 10) === 0;
  console.log('还原基线: ' + r.line + ' => ' + (baseOk ? 'PASS' : 'BASELINE_RED'));
}

const d1 = fail1 >= 1, d2 = fail2 >= 1;
console.log('r351 symbol 守卫: ' + ((d1 && d2 && baseOk) ? '2/2 删除点变红，基线还原绿' : '有删除点未变红或基线红'));
process.exit((d1 && d2 && baseOk) ? 0 : 1);
