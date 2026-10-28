#!/usr/bin/env node
/**
 * r422 负例测试 — 证明新增的 gate.js 入口校验真能抓住「维度文件漏入库」
 *
 * 背景：此前 verify.js 14 项全测 heartflow.js 入口，裁剪发布时删掉维度文件
 * 后 verify 仍报 12/14 全绿，而 gate.checkOutput 一调就 MODULE_NOT_FOUND。
 * r422 补了两项 gate.js 校验。本测试证明它们不是装饰：
 *   在副本里删一个维度文件 → verify 必须变红，且红在 gate.js 那一项
 *
 * 约束：在副本里做，不碰原仓库（原仓库是 cron 每 45 分钟在改的工作区）。
 */
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const SRC = __HF;
// [v6.8.85 审计修复] 工作目录平台自适应：原硬编码 /root/.hermes/cache/scratch/verify-negtest
// 在 Windows 副本必挂（/root 不存在且 cp -r 目标不可写）。
const WORK = path.join(os.tmpdir(), 'verify-negtest');

let pass = 0, fail = 0;
const T = (n, ok, d) => { console.log(`  ${ok ? '✅' : '❌'} ${n}${ok || !d ? '' : ': ' + d}`); if (ok) pass++; else fail++; };

console.log('=== r422 gate.js 入口校验负例测试 ===\n');

// 1. 建副本
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
execSync(`cp -r ${SRC}/. ${WORK}/`, { maxBuffer: 64 * 1024 * 1024 });
fs.rmSync(path.join(WORK, '.git'), { recursive: true, force: true });
console.log('副本就绪\n');

function verify() {
  const r = spawnSync(process.execPath, ['bin/verify.js'], { cwd: WORK, encoding: 'utf8', timeout: 240000 });
  const out = (r.stdout || '') + (r.stderr || '');
  return { status: r.status, out, passed: +((out.match(/(\d+) passed/) || [])[1] || 0), failed: +((out.match(/(\d+) failed/) || [])[1] || 0) };
}

// 2. 基线：副本应该全绿
const base = verify();
console.log(`【1】基线（未破坏）`);
T(`副本 ${base.passed} passed / ${base.failed} failed`, base.failed === 0, base.out.split('\n').filter(l => l.includes('❌')).slice(0, 2).join(' | '));

// 3. 负例：删一个维度文件（模拟"新建维度文件漏入库"）
const victim = path.join(WORK, 'src/appeal-tradition.js');
T(' victim 文件存在', fs.existsSync(victim));
fs.unlinkSync(victim);
console.log(`\n【2】删掉 src/appeal-tradition.js 后`);
const neg = verify();
T('verify 变红（failed > 0）', neg.failed > 0, `passed=${neg.passed} failed=${neg.failed}`);
T('红在 gate.js 那一项', /❌ gate\.js 入口/.test(neg.out),
  neg.out.split('\n').filter(l => l.includes('❌')).slice(0, 3).join(' | '));

// 4. 对照：证明旧的 14 项抓不到（只看 heartflow.js 那几条是否仍绿）
const oldLines = neg.out.split('\n').filter(l => /✅ (src\/core\/heartflow\.js 存在|heartflow\.js 模块可加载|引擎启动|think\(\) 可用)/.test(l));
console.log(`\n【3】对照：heartflow.js 路径的检查仍报绿（证明盲区真实存在过）`);
T('heartflow.js 相关检查仍 ✅', oldLines.length >= 3, oldLines.join(' | '));

// 5. 恢复后应回绿
fs.copyFileSync(path.join(SRC, 'src/appeal-tradition.js'), victim);
console.log(`\n【4】恢复后`);
const back = verify();
T('verify 回绿', back.failed === 0, `passed=${back.passed} failed=${back.failed}`);

fs.rmSync(WORK, { recursive: true, force: true });
console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
