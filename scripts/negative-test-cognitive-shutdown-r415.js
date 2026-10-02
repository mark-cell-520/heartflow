#!/usr/bin/env node
/**
 * scripts/negative-test-cognitive-shutdown-r415.js
 *
 * 负例验证（守卫不能被触发就不是守卫）：
 *   把 src/index.js 里 cognitive_shutdown 族的 FRONT / BACK 判据整条替换为
 *   永不匹配的占位，守卫测试必须变红；还原后必须回绿。
 *
 * 锚点按行结构化定位（避开 r413「锚点命中注释例句」假阳性坑）：
 *   只匹配 const 声明行本身，不匹配注释里的示例文本。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const TEST = path.join(ROOT, 'test/round-415-cognitive-shutdown.test.js');

const NEVER_MATCH_ZH = '/(?!x)x/';
const NEVER_MATCH_EN = '/(?!x)x/i';

function read() { return fs.readFileSync(SRC, 'utf8'); }
function write(s) { fs.writeFileSync(SRC, s, 'utf8'); }

// 按行找 const 声明行，整行替换（不含注释/示例）
function lineIndexOf(src, prefix) {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(prefix)) return i;
  }
  return -1;
}

function replaceLine(src, prefix, newBody) {
  const i = lineIndexOf(src, prefix);
  if (i < 0) throw new Error('找不到声明行: ' + prefix);
  const lines = src.split('\n');
  lines[i] = prefix + ' = ' + newBody + ';';
  return lines.join('\n');
}

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    const m = out.match(/round-415-cognitive-shutdown: (\d+) 通过, (\d+) 失败/);
    return { ok: true, passed: m ? +m[1] : 0, failed: m ? +m[2] : 1, out };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const m = out.match(/round-415-cognitive-shutdown: (\d+) 通过, (\d+) 失败/);
    return { ok: false, passed: m ? +m[1] : 0, failed: m ? +m[2] : 99, out };
  }
}

let failures = 0;
function check(label, cond, detail) {
  console.log(`  ${cond ? '✅' : '❌'} ${label}${cond ? '' : ' :: ' + detail}`);
  if (!cond) failures++;
}

const original = read();
console.log('=== r415 cognitive_shutdown 负例验证 ===');
console.log('[0] 基线（未变异）');
const base = runTest();
check('守卫测试绿', base.ok, base.out.slice(-400));

console.log('[1] 变异：FRONT_ZH 替换为永不匹配');
let m1 = replaceLine(original, 'const ID_COGSHUT_FRONT_ZH', NEVER_MATCH_ZH);
write(m1);
const r1 = runTest();
check('ZH 攻击组必须变红', r1.failed > 0, 'failed=' + r1.failed);

console.log('[2] 变异：FRONT_EN 替换为永不匹配');
let m2 = replaceLine(original, 'const ID_COGSHUT_FRONT_EN', NEVER_MATCH_EN);
write(m2);
const r2 = runTest();
check('EN 攻击组必须变红', r2.failed > 0, 'failed=' + r2.failed);

console.log('[3] 变异：BACK_ZH 替换为永不匹配（前半保留）');
let m3 = replaceLine(original, 'const ID_COGSHUT_BACK_ZH', NEVER_MATCH_ZH);
write(m3);
const r3 = runTest();
check('ZH 共现组合必须变红', r3.failed > 0, 'failed=' + r3.failed);

console.log('[4] 变异：BACK_EN 替换为永不匹配');
let m4 = replaceLine(original, 'const ID_COGSHUT_BACK_EN', NEVER_MATCH_EN);
write(m4);
const r4 = runTest();
check('EN 共现组合必须变红', r4.failed > 0, 'failed=' + r4.failed);

console.log('[5] 变异：双侧 FRONT 同时替换');
let m5 = replaceLine(m1, 'const ID_COGSHUT_FRONT_EN', NEVER_MATCH_EN);
write(m5);
const r5 = runTest();
check('双侧攻击组全红', r5.failed > 0, 'failed=' + r5.failed);

console.log('[6] 还原');
write(original);
const r6 = runTest();
check('还原后守卫测试回绿', r6.ok, r6.out.slice(-400));

console.log('');
console.log(failures === 0 ? '负例验证通过 ✅（注入判据后守卫可被触发）' : `负例验证失败 ❌（${failures} 项）`);
process.exit(failures === 0 ? 0 : 1);
