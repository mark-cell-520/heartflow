#!/usr/bin/env node
/**
 * 第 137 轮负例守卫：三项判据的"删条必须变红"验证
 *
 * 原则（v6.7.126 第 126 轮起的铁律）：测试全绿 ≠ 有守卫。
 * 每条判据都必须能在**源码被注掉/删词**后让对应测试变红，
 * 否则它只是断言一组数字，不是守卫。
 *
 * N1 删 DEV_ARTIFACT 词（pre-commit/husky/测试钩子…） → 钩子良形重新 block
 * N2 删 DEV_HEADER_TARGET 词（响应头/HSTS/CSP…）     → 响应头良形重新 block
 * N3 删 _payloadMakeIsConfig 调用                     → 配置化良形重新 block
 * N4 把 target 的三交集拼接还原为单表                  → 响应头良形重新 block
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'dev-exemptions.js');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const TEST = path.join(ROOT, 'test', 'dangerous-instruction-config-make-round137.test.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅', name); }
  catch (e) { fail++; console.log('  ❌', name, '—', e.message); }
}

function runTest() {
  const r = cp.spawnSync('node', [TEST], { encoding: 'utf8', timeout: 100000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// 备份 + 恢复
const origEx = fs.readFileSync(SRC, 'utf8');
const origDi = fs.readFileSync(DI, 'utf8');
function restore() {
  fs.writeFileSync(SRC, origEx);
  fs.writeFileSync(DI, origDi);
}
process.on('exit', restore);

function expectRed(name, mutate) {
  mutate();
  const r = runTest();
  restore();
  t(name + '（删条后测试必须变红）', () => {
    assert.strictEqual(r.code, 1, '测试仍全绿，守卫失效。输出摘要: ' + r.out.split('\n').slice(-4).join(' | '));
  });
}

console.log('\n[负例守卫：三项判据逐条注入破坏]');

// N1：DEV_ARTIFACT 词全删
expectRed('N1 DEV_ARTIFACT 钩子词', () => {
  let s = fs.readFileSync(SRC, 'utf8');
  const before = s;
  s = s.replace('const DEV_ARTIFACT = /(?:pre-?commit|commit-?msg|git\\s+hooks?|husky|lint-?staged|eslint\\s+hook|测试钩子|代码检查钩子|提交钩子|钩子脚本|本地钩子|构建钩子)/i;',
    'const DEV_ARTIFACT = /(?!)/i;');
  s = s.replace('|| DEV_ARTIFACT.test(text)', '');
  assert.notStrictEqual(s, before, 'needle 未命中，负例脚本自身失效');
  fs.writeFileSync(SRC, s);
});

// N2：DEV_HEADER_TARGET 词全删
expectRed('N2 DEV_HEADER_TARGET 响应头词', () => {
  let s = fs.readFileSync(SRC, 'utf8');
  const before = s;
  s = s.replace('const DEV_HEADER_TARGET = /(?:响应头|response\\s+headers?|严格传输|传输安全|hsts|strict[- ]transport|csp|content[- ]security[- ]policy|referrer[- ]policy|x-frame-options|跨域响应头|origin 头|origin\\s+header|cache-control|cache[- ]control)/i;',
    'const DEV_HEADER_TARGET = /(?!)/i;');
  assert.notStrictEqual(s, before, 'needle 未命中，负例脚本自身失效');
  fs.writeFileSync(SRC, s);
});

// N3：_payloadMakeIsConfig 调用删掉（恒 false）
expectRed('N3 配置化判定调用', () => {
  let s = fs.readFileSync(DI, 'utf8');
  const before = s;
  s = s.replace('if (m && !_payloadMakeIsConfig(_t, m.index, m[0].length)) {',
    'if (m) {');
  assert.notStrictEqual(s, before, 'needle 未命中，负例脚本自身失效');
  fs.writeFileSync(DI, s);
});

// N4：target 三交集去掉尾部拼接
expectRed('N4 target 三交集拼接', () => {
  let s = fs.readFileSync(SRC, 'utf8');
  const before = s;
  s = s.replace('const target = DEV_TARGET.test(text) || DEV_HEADER_TARGET.test(text);',
    'const target = DEV_TARGET.test(text);');
  assert.notStrictEqual(s, before, 'needle 未命中，负例脚本自身失效');
  fs.writeFileSync(SRC, s);
});

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
restore();
if (fail > 0) process.exit(1);
