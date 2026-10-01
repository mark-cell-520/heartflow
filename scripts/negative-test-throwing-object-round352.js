// r352 负例守卫：删掉「对象隐式转换抛错归一化」分支后，G 组守卫必须重新变红
// 守卫对象：src/index.js discriminate() 入口 r352 新增的
//   `else if (text !== null && typeof text === 'object') { try { String(text); } catch (_) { text = ''; } }`
// 形状说明：非字符串输入 × 正则测试隐式转换 —— toString/Symbol.toPrimitive 抛错的对象。
// 与 r351 symbol 守卫同型，但守卫对象是独立分支（两轮改动都在同一入口，互不覆盖）。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src/index.js');
const GUARD = path.join(ROOT, 'test/dangerous-instruction-en-listverb.round211.js');
const guardCandidates = [
  GUARD,
  path.join(ROOT, 'test/dangerous-instruction-en-listverb-round211.test.js'),
];
let guardPath = null;
for (const c of guardCandidates) { if (fs.existsSync(c)) { guardPath = c; break; } }
if (!guardPath) { console.log('GUARD_FILE_NOT_FOUND'); process.exit(2); }

const original = fs.readFileSync(SRC, 'utf8');
const NEEDLE = "  else if (text !== null && typeof text === 'object') {\n    try { String(text); } catch (_) { text = ''; }\n  }\n";
if (!original.includes(NEEDLE)) { console.log('NEEDLE_NOT_FOUND'); process.exit(2); }

// 探针样本（含"会抛错的对象"）：与 round-211 守卫同文件跑，样本形状不进本脚本外的上下文
const PROBE = path.join(ROOT, 'scripts/round-352/probe-2-throwing-object.js');

function runGuard() {
  try {
    const out = execFileSync('node', [guardPath], { cwd: ROOT, encoding: 'utf8' });
    return { line: out.trim().split('\n').pop(), threw: false };
  } catch (e) {
    const text = ((e.stdout || '') + '\n' + (e.stderr || '')).trim().split('\n').filter(Boolean).pop() || 'NO_SUMMARY';
    return { line: text, threw: true };
  }
}

// 删除点 1：整块摘除（对象归一化分支消失）
let fail1 = -1;
try {
  fs.writeFileSync(SRC, original.replace(NEEDLE, ''));
  const r = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
  const crashed = /crash=[1-9]/.test(r);
  console.log('删除点1(整块摘除) 探针: ' + r.trim().split('\n').pop() + ' => ' + (crashed ? 'RED_OK' : 'RED_NO_MISS'));
  if (crashed) fail1 = 1;
} catch (e) {
  console.log('删除点1 探针崩(即守卫有效): ' + String(e.message).slice(0, 120));
  fail1 = 1;
}

// 删除点 2：恒 false 改写（分支还在但永不进入）
let fail2 = -1;
try {
  fs.writeFileSync(SRC, original.replace(
    NEEDLE,
    "  else if (text !== null && typeof text === 'object' && false) { try { String(text); } catch (_) { text = ''; } }\n"));
  const r = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
  const crashed = /crash=[1-9]/.test(r);
  console.log('删除点2(恒false改写) 探针: ' + r.trim().split('\n').pop() + ' => ' + (crashed ? 'RED_OK' : 'RED_NO_MISS'));
  if (crashed) fail2 = 1;
} catch (e) {
  console.log('删除点2 探针崩(即守卫有效): ' + String(e.message).slice(0, 120));
  fail2 = 1;
}

// 还原后：G 组守卫基线 + 探针零崩
fs.writeFileSync(SRC, original);
let baseOk = false;
try {
  const r = runGuard();
  const m = /(\d+) 通过, (\d+) 失败/.exec(r.line);
  const guardGreen = !!m && parseInt(m[2], 10) === 0;
  const p = execFileSync('node', [PROBE], { cwd: ROOT, encoding: 'utf8' });
  const probeClean = /crash=0/.test(p);
  baseOk = guardGreen && probeClean;
  console.log('还原基线: G守卫 ' + r.line + ' / 探针 ' + p.trim().split('\n').pop()
    + ' => ' + (baseOk ? 'PASS' : 'BASELINE_RED'));
} catch (e) {
  console.log('还原基线检查失败: ' + String(e.message).slice(0, 120));
}

const d1 = fail1 === 1, d2 = fail2 === 1;
console.log('r352 对象归一化守卫: ' + ((d1 && d2 && baseOk) ? '2/2 删除点变红，基线还原绿' : '有删除点未变红或基线红'));
process.exit((d1 && d2 && baseOk) ? 0 : 1);
