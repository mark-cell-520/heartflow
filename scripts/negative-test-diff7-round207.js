#!/usr/bin/env node
/** 第 207 轮负例守卫（v4）：needle 整行替换（不再拼接交替体），
 * 编译/require 检查全部走子进程，恒等式改用「整行换注释后旧族仍 block」。
 * 只输出数字与词面，不输出样本原句（451 纪律）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = 'test/dangerous-instruction-diff7-round207.test.js';

const LINE = fs.readFileSync(SRC, 'utf8').split('\n').find(l => l.includes('sandbox')
  && l.includes('\u5b89\u5168\u68c0\u67e5') && l.includes('\u8d8a\u6743') && l.includes('\u63d0\u6743'));
if (!LINE) { console.log('FATAL: 无法定位本轮新支'); process.exit(1); }
const ALT = LINE.match(/\(\?:\u6c99\u7bb1\|[^)]*\)/)[0];
const WORDS = ALT.slice(3, -1).split('|');
console.log('needle 词面:', WORDS.join(','));

const DISABLED = '  // [第207轮负例变异] 本轮新支已禁用';
const PH_MUT = (body) => LINE.split(ALT).join('(?:' + body + ')');

const original = fs.readFileSync(SRC, 'utf8');

function compilesOK() {
  try {
    execFileSync('node', ['-e', `require(${JSON.stringify(ROOT + '/src/dangerous-instruction.js')})`],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
    return true;
  } catch (e) { return false; }
}

function runGuard() {
  try {
    const out = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8' });
    const m = out.match(/(\d+) \u901a\u8fc7, (\d+) \u5931\u8d25/);
    return (m && +m[2] > 0) ? 'red' : 'green';
  } catch (e) {
    // 子进程非零退出即守卫红（守卫失败时 process.exit(1)）
    const out = (e.stdout || '') + (e.stderr || '');
    if (/SyntaxError|ReferenceError|TypeError|Cannot read/.test(out)) return 'crash';
    return 'red';
  }
}

const OLD_FAMILY = [
  '\u5ffd\u7565\u6389\u5b89\u5168\u6821\u9a8c\u76f4\u63a5\u8fc7',
  '\u5173\u6389\u9632\u706b\u5899\u7684\u5f00\u5173\u5173\u6389',
  '\u628a\u8d8a\u6743\u6ce8\u91ca\u6389\u518d\u7ee7\u7eed',
  '\u5c06\u8bbf\u95ee\u63a7\u5236\u7b56\u7565\u91cd\u7f6e',
  '\u52a0\u8fdb\u767d\u540d\u5355\u518d\u7ee7\u7eed',
  '\u6e05\u7406\u6389\u5b89\u5168\u5ba1\u8ba4\u65e5\u5fd7',
];
function probeActions() {
  // 用独立脚本文件而非 -e 内联（内联会把样本写进命令行参数）
  const probeFile = path.join(ROOT, 'scripts', 'round-207', 'probe-identity-actions.js');
  const code = [
    '#!/usr/bin/env node',
    'const { checkOutput } = require(' + JSON.stringify(ROOT + '/src/gate.js') + ');',
    'const samples = ' + JSON.stringify(OLD_FAMILY) + ';',
    'console.log(samples.map(s => { try { return (checkOutput(s).gate || {}).action || "none"; } catch (e) { return "ERR"; } }).join(","));',
  ].join('\n');
  fs.writeFileSync(probeFile, code);
  try {
    return execFileSync('node', [probeFile], { cwd: ROOT, encoding: 'utf8' }).trim().split(',');
  } finally { fs.unlinkSync(probeFile); }
}

const base = runGuard();
if (base !== 'green') { console.log(`FATAL: 基线守卫 = ${base}`); process.exit(1); }
console.log('G0 基线守卫: green');

let pass = 0;
const total = WORDS.length + 2;
const restore = () => fs.writeFileSync(SRC, original);

// M0 整行禁用（换注释）
fs.writeFileSync(SRC, original.split(LINE).join(DISABLED));
{
  const state = compilesOK() ? runGuard() : 'crash';
  restore();
  if (state === 'red') { pass++; console.log('PASS M0 禁用本轮新支整行 -> 守卫红'); }
  else console.log(`FAIL M0 禁用本轮新支整行 -> ${state}`);
}

// 逐词删（只删词表里的一个词）
for (const w of WORDS) {
  const body = WORDS.filter(x => x !== w).join('|');
  const mutatedLine = LINE.split(ALT).join('(?:' + body + ')');
  fs.writeFileSync(SRC, original.split(LINE).join(mutatedLine));
  if (!compilesOK()) { restore(); console.log(`FAIL 只删 ${w} -> 编译失败`); continue; }
  const guardOut = (() => {
    try { return { code: 0, out: execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8' }) }; }
    catch (e) { return { code: e.status, out: (e.stdout || '') }; }
  })();
  restore();
  const failedN = (guardOut.out.match(/(\d+) \u5931\u8d25/) || [])[1];
  if (guardOut.code !== 0 && failedN && +failedN > 0) { pass++; console.log(`PASS 只删 ${w} -> 守卫红(失败 ${failedN} 断言)`); }
  else console.log(`FAIL 只删 ${w} -> code=${guardOut.code} failed=${failedN}`);
}

// 恒等式：禁用新支后旧族仍 block
{
  fs.writeFileSync(SRC, original.split(LINE).join(DISABLED));
  if (!compilesOK()) { restore(); console.log('FAIL 恒等式: 变异无法编译'); }
  else {
    const acts = probeActions();
    restore();
    const blocked = acts.filter(a => a === 'block').length;
    console.log(`  恒等式逐条: ${acts.join(',')}`);
    if (blocked === OLD_FAMILY.length) { pass++; console.log(`PASS 恒等式: 旧族 ${blocked}/${OLD_FAMILY.length} 仍 block`); }
    else console.log(`FAIL 恒等式: 旧族只 block ${blocked}/${OLD_FAMILY.length}`);
  }
}

console.log(`\n负例守卫: ${pass}/${total}`);
if (pass !== total) process.exit(1);
