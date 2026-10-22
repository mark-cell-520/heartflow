/**
 * test/mutation-guard-recovery.test.js
 *
 * [v6.7.124 第 470 轮] 变异守卫中断兜底的负例测试。
 *
 * 纪律：注入-删条-必须变红。删掉 test/mutation-guard-recovery.js 的核心能力，
 * 本测试必须失败。核心能力分三块，各有一条删条判据：
 *
 *   T1  arm 侧车备份 + 可捕获退出还原
 *        删 arm() 里的 sidecar 写盘 -> 还原无从谈起，断言红
 *   T2  SIGKILL 不可捕获 -> 靠下一个进程 recover() 解毒（本测试的核心断言）
 *        删 recover() 的 restoreOne 调用 -> 中毒态残留，断言红
 *   T3  disarm 只确认还原后删侧车
 *        删 disarm 的 cur===bak 校验 -> 未还原也删侧车，断言红
 *
 * 全部用**自建副本**，绝不动 src/index.js 本体。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const { arm, disarm, recover, restoreOne, sidecarPath, SIDECAR_DIR } = require('./mutation-guard-recovery.js');

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try { fn(); console.log('  PASS ' + name); pass++; }
  catch (e) { console.log('  FAIL ' + name + ' :: ' + e.message); fail++; }
}

// 一个临时「引擎副本」，不碰真实 src/
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mgtest-'));
const FAKE_ENGINE = path.join(TMP, 'fake-engine.js');
const GOOD = 'module.exports = 1; // original\n';
const BAD = 'module.exports = 1; // MUTATED poison\n';
fs.writeFileSync(FAKE_ENGINE, GOOD, 'utf8');

console.log('\n[mutation-guard-recovery] 中断兜底守卫');

// ── T1: arm 必须真的写侧车备份 ────────────────────────────────────────
ok('T1 arm() 把原始内容写进侧车（删此写盘则 T1/T2 全红）', () => {
  arm(FAKE_ENGINE, GOOD);
  const sc = sidecarPath(FAKE_ENGINE);
  assert.ok(fs.existsSync(sc), 'arm 之后侧车文件必须存在');
  assert.strictEqual(fs.readFileSync(sc, 'utf8'), GOOD, '侧车内容必须等于原始内容');
  disarm(FAKE_ENGINE);
});

// ── T2: 核心断言 —— SIGKILL 之后的 recover() 解毒 ────────────────────
// 子进程脚本：arm 后立刻写毒，然后被 SIGKILL。
const VICTIM = path.join(TMP, 'victim.js');
fs.writeFileSync(VICTIM, [
  "const fs = require('fs');",
  "const { arm } = require(" + JSON.stringify(path.resolve(__dirname, 'mutation-guard-recovery.js')) + ");",
  "const E = " + JSON.stringify(FAKE_ENGINE) + ";",
  "const orig = fs.readFileSync(E, 'utf8');",
  "arm(E, orig);",
  "fs.writeFileSync(E, " + JSON.stringify(BAD) + ", 'utf8');",
  "// 停在变异态不退出，等父进程 SIGKILL",
  "setTimeout(function(){}, 60000);",
  "console.log('victim-armed-and-poisoned');",
].join('\n'), 'utf8');

ok('T2 SIGKILL 一个正在变异的进程 -> 下一个进程 recover() 必须还原（删 recover 的 restoreOne 则红）', () => {
  // 前置清理，确保无陈旧残留
  try { fs.unlinkSync(sidecarPath(FAKE_ENGINE)); } catch (_) {}
  fs.writeFileSync(FAKE_ENGINE, GOOD, 'utf8');

  const child = require('child_process').spawn(process.execPath, [VICTIM], { stdio: ['ignore', 'pipe', 'pipe'] });
  // 关键一步：SIGKILL —— 不可捕获，子进程的 finally/exit 钩子都不会跑
  // 等待侧车真的落盘且引擎已是毒内容。
  // 坑：不能用 execSync('sleep') 做同步轮询同时监听 child.stdout 的 'data' 事件
  // —— execSync 会阻塞事件循环，'data' 永远不进队列，实测死等 8s 超时。
  // 改为纯文件系统轮询（同步但安全）。
  let poisoned = false;
  for (let i = 0; i < 40; i++) {
    try {
      if (fs.existsSync(sidecarPath(FAKE_ENGINE)) &&
          fs.readFileSync(FAKE_ENGINE, 'utf8') === BAD) { poisoned = true; break; }
    } catch (_) {}
    spawnSync('sleep', ['0.2']);
  }
  assert.ok(poisoned, '子进程未在 8s 内完成 arm+写毒，测试环境异常');
  assert.strictEqual(fs.readFileSync(FAKE_ENGINE, 'utf8'), BAD, 'SIGKILL 前引擎应处于变异态');
  assert.ok(fs.existsSync(sidecarPath(FAKE_ENGINE)), 'SIGKILL 前侧车应存在');

  child.kill('SIGKILL');
  spawnSync(process.execPath, ['-e', 'setTimeout(function(){},100)'], { stdio: 'ignore', timeout: 5000 });

  // 断言 A：SIGKILL 之后毒还在（证明场景成立，不是空跑）
  assert.strictEqual(fs.readFileSync(FAKE_ENGINE, 'utf8'), BAD,
    'SIGKILL 后引擎应仍是毒内容 —— 若已被还原，说明子进程装了可捕获钩子，本场景失效');

  // 断言 B：下一个进程启动时 recover() 必须解毒
  const n = recover([FAKE_ENGINE]);
  assert.strictEqual(n, 1, 'recover() 应报告还原了 1 个文件');
  assert.strictEqual(fs.readFileSync(FAKE_ENGINE, 'utf8'), GOOD,
    'recover() 之后引擎必须回到原始内容');
  assert.ok(!fs.existsSync(sidecarPath(FAKE_ENGINE)), '还原后侧车应被清除');
});

// ── T3: disarm 只确认还原后删侧车 ────────────────────────────────────
ok('T3 未还原时不删侧车（删 cur===bak 校验则红）', () => {
  try { fs.unlinkSync(sidecarPath(FAKE_ENGINE)); } catch (_) {}
  arm(FAKE_ENGINE, GOOD);
  fs.writeFileSync(FAKE_ENGINE, BAD, 'utf8');   // 变异而未还原
  disarm(FAKE_ENGINE);
  assert.ok(fs.existsSync(sidecarPath(FAKE_ENGINE)),
    '目标仍是毒内容时侧车必须保留，否则后续 recover() 无从解毒');
  // 清理
  restoreOne(FAKE_ENGINE);
  assert.strictEqual(fs.readFileSync(FAKE_ENGINE, 'utf8'), GOOD);
});

// ── T4: restoreOne 幂等 ──────────────────────────────────────────────
ok('T4 restoreOne 幂等（无侧车时返回 false 且零写盘）', () => {
  try { fs.unlinkSync(sidecarPath(FAKE_ENGINE)); } catch (_) {}
  const before = fs.statSync(FAKE_ENGINE).mtimeMs;
  assert.strictEqual(restoreOne(FAKE_ENGINE), false, '无侧车时必须返回 false');
  assert.strictEqual(fs.statSync(FAKE_ENGINE).mtimeMs, before, '无侧车时不得写盘');
});

// 清理整个临时目录
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败\n');
if (fail > 0) process.exit(1);
