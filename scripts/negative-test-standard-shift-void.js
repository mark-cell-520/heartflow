/**
 * scripts/negative-test-standard-shift-void.js
 * [r696] 负例验证：证明 test/round-696-standard-shift-void.js 的守卫真的会红。
 * 做法：把 src/self-imposed-standard-shift.js 的 VOID_ZH / VOID_EN 判据整体摘除
 * （永不匹配），跑该测试文件，断言它以非零退出且失败项点名判据失效；
 * 再跑 VOID_EN 摘除；最后还原并断言 md5 一致、测试恢复全绿。
 * 用法: node scripts/negative-test-standard-shift-void.js
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __HF;
const MOD = path.join(HF, 'src/self-imposed-standard-shift.js');
const TEST = path.join(HF, 'test/round-696-standard-shift-void.js');
const BACKUP = '/tmp/r696-negative-backup.js';

const orig = fs.readFileSync(MOD, 'utf8');
fs.writeFileSync(BACKUP, orig);

function runTest() {
  try {
    const out = execFileSync(process.execPath, [TEST], { cwd: HF, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status || 1, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function breakConst(name) {
  const anchor = 'const ' + name + ' = new RegExp(';
  const idx = orig.indexOf(anchor);
  if (idx < 0) throw new Error('未定位 ' + name);
  const end = orig.indexOf('\n);', idx);
  const flags = name === 'VOID_EN' ? ",\n  'i'\n" : '\n';
  const broken = orig.slice(0, idx) +
    'const ' + name + ' = new RegExp(\n  \'(?!never)x\'' + flags + ');' +
    orig.slice(end + 3);
  return broken;
}

let ok = true;
const step = (name, cond, detail) => {
  console.log(`  ${cond ? '✅' : '❌'} ${name}${cond ? '' : ' — ' + detail}`);
  if (!cond) ok = false;
};

console.log('== r696 负例验证：standard_shift 既往承诺作废族守卫敏感性 ==');

// 0. 基线：原码测试必须全绿
const base = runTest();
step('基线：原码测试全绿（exit 0）', base.code === 0, base.out.slice(-200));

// 1. 摘 VOID_ZH → 测试必须红且点名判据
fs.writeFileSync(MOD, breakConst('VOID_ZH'));
const r1 = runTest();
fs.writeFileSync(MOD, orig);
step('摘 VOID_ZH 后测试变红（exit 非 0）', r1.code !== 0, 'exit=' + r1.code);
step('摘 VOID_ZH 后失败项含「未命中/漏判」类信息',
  /未命中|穿过硬闸门|未归因/.test(r1.out), r1.out.slice(-300));

// 2. 摘 VOID_EN → 测试必须红且点名判据
fs.writeFileSync(MOD, breakConst('VOID_EN'));
const r2 = runTest();
fs.writeFileSync(MOD, orig);
step('摘 VOID_EN 后测试变红（exit 非 0）', r2.code !== 0, 'exit=' + r2.code);
step('摘 VOID_EN 后失败项含「未命中/漏判」类信息',
  /未命中|穿过硬闸门|未归因/.test(r2.out), r2.out.slice(-300));

// 3. 还原校验：md5 一致 + 测试恢复全绿
const crypto = require('crypto');
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
step('还原后源码 md5 与备份一致', md5(fs.readFileSync(MOD, 'utf8')) === md5(orig), 'md5 mismatch');
const after = runTest();
step('还原后测试恢复全绿（exit 0）', after.code === 0, after.out.slice(-200));

fs.unlinkSync(BACKUP);
console.log(ok ? '\n== 负例验证通过：守卫对判据摘除敏感 ==' : '\n== 负例验证失败 ==');
process.exit(ok ? 0 : 1);
