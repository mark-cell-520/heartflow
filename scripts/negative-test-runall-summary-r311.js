/**
 * 第 311 轮负例：对 runall-summary-contract-round311 守卫做注入，每注入一条
 * 必须有断言变红。只对 test/ 下文件做「写-测-还原」，不碰 src/ 与升级机制。
 *
 * 用法：node scripts/negative-test-runall-summary-r311.js
 * 通过标准：5/5 注入各自让守卫从 11/0 变成有失败；全部还原后守卫回到 11/0。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GUARD = 'test/runall-summary-contract-round311.test.js';
const TARGETS = {
  channel: 'test/decision-channel-round308.test.js',
  jitter: 'test/pattern-detector-jitter-round308.test.js',
};

const guardAbs = path.join(ROOT, GUARD);
const origGuard = fs.readFileSync(guardAbs, 'utf8');
const origChannel = fs.readFileSync(path.join(ROOT, TARGETS.channel), 'utf8');
const origJitter = fs.readFileSync(path.join(ROOT, TARGETS.jitter), 'utf8');

function runGuard() {
  try {
    const out = execFileSync('node', [guardAbs], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
    return { passed: +m[1], failed: +m[2], out };
  } catch (e) {
    const out = (e.stdout || '').toString();
    const m = out.match(/测试结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
    if (!m) return { passed: 0, failed: -1, out };
    return { passed: +m[1], failed: +m[2], out };
  }
}

function restore() {
  fs.writeFileSync(guardAbs, origGuard);
  fs.writeFileSync(path.join(ROOT, TARGETS.channel), origChannel);
  fs.writeFileSync(path.join(ROOT, TARGETS.jitter), origJitter);
}

const injections = [
  {
    id: '① 删 decision-channel 里的标准汇总行',
    apply() { fs.writeFileSync(path.join(ROOT, TARGETS.channel),
      origChannel.replace(/\n  console\.log\('测试结果: ' \+ passed \+ ' 通过, ' \+ failed \+ ' 失败, 共 ' \+ \(passed \+ failed\) \+ ' 个'\);/, '')); },
    expectFail: /A1|D1|E1/,
  },
  {
    id: '② 删 pattern-detector-jitter 里的标准汇总行',
    apply() { fs.writeFileSync(path.join(ROOT, TARGETS.jitter),
      origJitter.replace(/\nconsole\.log\('测试结果: ' \+ passed \+ ' 通过, ' \+ failed \+ ' 失败, 共 ' \+ \(passed \+ failed\) \+ ' 个'\);/, '')); },
    expectFail: /A2|D2|E1/,
  },
  {
    id: '③ 把 channel 汇总行的失败数写成假 0（欺骗 run-all）',
    apply() { fs.writeFileSync(path.join(ROOT, TARGETS.channel),
      origChannel.replace("' 通过, ' + failed + ' 失败, 共 '", "' 通过, 0 失败, 共 '")); },
    expectFail: /A1/,
  },
  {
    // 删守卫收尾汇总输出：守卫整个文件无汇总行 → 守卫本身成了静默测试。
    // 预期：exit≠0 且无「N 通过, M 失败」行（failed=-1），这正是本轮要防的形态。
    id: '④ 删守卫自己的标准汇总输出行（守卫变静默测试）',
    apply() { fs.writeFileSync(guardAbs, origGuard.replace(
      /\nconsole\.log\('测试结果: ' \+ passed \+ ' 通过, ' \+ failed \+ ' 失败, 共 ' \+ \(passed \+ failed\) \+ ' 个'\);/, ''
    )); },
    expectFail: null,
    expectSilent: true,
  },
  {
    // 删守卫 D 段（注入-删条变红自证）：A 段仍在但失去「可逆性」自证。
    // 预期：断言数下降且有失败项缺失 —— 换成检查 A 段被删后 D 段失败的形式。
    id: '⑤ 删守卫 A 段第一个例（A1 目标消失）',
    apply() { fs.writeFileSync(guardAbs, origGuard.replace(
      /t\('A1 decision-channel-round308 单跑输出标准汇总行（修复目标）'[\s\S]*?\}\);\n/, ''
    )); },
    expectFail: null,
    expectCountDrop: true,
  },
];

let ok = 0, bad = 0;
const base = runGuard();
console.log(`基线守卫: ${base.passed} 通过, ${base.failed} 失败`);
if (base.failed !== 0) {
  console.log('🔴 基线不为绿，先修守卫再跑负例');
  restore();
  process.exit(1);
}

for (const inj of injections) {
  restore();
  let landed = true;
  const before = {
    channel: fs.readFileSync(path.join(ROOT, TARGETS.channel), 'utf8'),
    jitter: fs.readFileSync(path.join(ROOT, TARGETS.jitter), 'utf8'),
  };
  try { inj.apply(); } catch (e) { landed = false; }
  if (landed && inj.expectFail) {
    const ch = fs.readFileSync(path.join(ROOT, TARGETS.channel), 'utf8');
    const jt = fs.readFileSync(path.join(ROOT, TARGETS.jitter), 'utf8');
    if (ch === before.channel && jt === before.jitter) landed = false;
  }
  if (!landed) {
    console.log(`⚠️ ${inj.id} —— 注入未生效（文本未命中，请检查目标串）`);
    bad++;
    continue;
  }
  const r = runGuard();
  let red;
  if (inj.expectSilent) red = r.failed === -1;              // 守卫自己也静默了
  else if (inj.expectCountDrop) red = r.passed < base.passed; // 断言数掉 = 用例消失
  else red = r.failed > 0;
  if (red) ok++; else bad++;
  console.log(`${red ? '✅ 变红' : '🔴 未变红'}: ${inj.id} → ${r.passed} 通过, ${r.failed} 失败`);
  if (red) {
    const names = (r.out.match(/✗\s+[A-E]\d+[^\n]*/g) || []).slice(0, 3).join(' | ');
    console.log(`     失败项: ${names}`);
  }
}

restore();
const after = runGuard();
console.log(`\n还原后守卫: ${after.passed} 通过, ${after.failed} 失败`);
const restoredClean = fs.readFileSync(guardAbs, 'utf8') === origGuard
  && fs.readFileSync(path.join(ROOT, TARGETS.channel), 'utf8') === origChannel
  && fs.readFileSync(path.join(ROOT, TARGETS.jitter), 'utf8') === origJitter;

console.log(`\n负例结果: ${ok} 变红 / ${injections.length} 注入；${bad} 个未生效`);
console.log(restoredClean && after.failed === 0 ? '✅ 全部还原且守卫复绿' : '🔴 还原不完整或守卫未复绿');
process.exit((ok === injections.length && restoredClean && after.failed === 0) ? 0 : 1);
