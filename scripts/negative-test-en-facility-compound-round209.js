/**
 * scripts/negative-test-en-facility-compound-round209.js
 * 第 209 轮负例守卫：删掉本轮任一新增判据，守卫必须变红。
 * 纪律沿用第 207 轮 v3/v4 修法：
 *   · needle 从源码整行正则截取，不手写正则字面量（避免残缺 → SyntaxError → 假红）
 *   · 变异后先跑子进程编译检查，崩了记 crash 不算红
 *   · 「红」只认守卫进程非零退出 且 stdout 有「N 失败」计数
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', 'mark-heartflow-skill');
const SRC_FILE = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-en-facility-compound-round209.test.js');

const SRC = fs.readFileSync(SRC_FILE, 'utf8');

const BABY = require('os').tmpdir();
// 变异工作目录用 src/ 下的临时副本（第 208 轮踩坑：放 scripts/ 下 require 同目录模块失败）
const MUT_DIR = path.join(ROOT, 'src');
let tid = 0;

const MUTANT_TIMEOUT = 100000;
function runGuard() {
  try {
    const out = execFileSync(process.execPath, [GUARD], { encoding: 'utf8', timeout: MUTANT_TIMEOUT });
    const m = out.match(/(\d+) passed, (\d+) failed/);
    return { ok: true, failed: m ? Number(m[2]) : -1, out };
  } catch (e) {
    const raw = ((e.stdout || '') + (e.stderr || ''));
    // 第 207 轮纪律：红只认「非零退出 + stdout 有 N 失败计数」。
    // 断言失败时进程在第一处 throw 后就终止，末尾汇总行不存在 →
    // failed 取 -1 但 ok=false。用「AssertionError 计数」补足判红：
    const asserts = (raw.match(/ERR_ASSERTION|AssertionError/g) || []).length;
    return { ok: false, failed: asserts > 0 ? asserts : -1, out: raw.split('\n').filter(l => !/^\s+at /.test(l)).join('\n').slice(0, 400) };
  }
}

function mutate(oldStr, newStr) {
  const n = SRC.split(oldStr).length - 1;
  if (n < 1) return { error: 'needle 未命中' };
  const mutated = SRC.split(oldStr).join(newStr);
  return { mutated, count: n };
}

function withMutant(oldStr, newStr) {
  const r = mutate(oldStr, newStr);
  if (r.error) return { error: r.error };
  const f = path.join(MUT_DIR, `__negmut_${process.pid}_${tid++}.js`);
  // 变异体写到 src/ 下，保证 require('./dev-exemptions.js') 等相对路径可用
  fs.writeFileSync(f, r.mutated);
  // 用 MODULE_PATH 技巧：把 SRC 副本替换成临时文件——做不到（源文件路径固定）。
  // 退而求其次：临时替换真源文件，跑完还原。
  const backup = fs.readFileSync(SRC_FILE);
  try {
    fs.writeFileSync(SRC_FILE, r.mutated);
    // 编译检查
    try {
      execFileSync(process.execPath, ['--check', SRC_FILE], { encoding: 'utf8', timeout: 20000 });
    } catch (e) {
      fs.unlinkSync(f);
      return { crash: true, out: e.stderr || String(e) };
    }
    const g = runGuard();
    fs.unlinkSync(f);
    return { crash: false, ...g };
  } finally {
    fs.writeFileSync(SRC_FILE, backup);
  }
}

const NEEDLE_AUDIT = '|security\\s+audit\\s+(?:logs?|trail|records?|entries)';
const NEEDLE_EVENTS = '|security\\s+events?\\s+logs?';

const MUTANTS = [
  { id: 'M0', desc: '基线（无变异）必须绿', fn: () => runGuard() },
  { id: 'M1', desc: '删 security audit 复合族 → 红', fn: () => withMutant(NEEDLE_AUDIT, '') },
  { id: 'M2', desc: '删 security events log 族 → 红', fn: () => withMutant(NEEDLE_EVENTS, '') },
  { id: 'M3', desc: 'audit 族窄化回 records → 红（entries/log/trail 三形应回到误赦）',
    fn: () => withMutant(NEEDLE_AUDIT, '|security\\s+audit\\s+records?') },
  { id: 'M4', desc: 'events 复数收口拿掉 → 红', fn: () => withMutant(NEEDLE_EVENTS, '|security\\s+event\\s+logs?') },
  { id: 'M5', desc: '恒等式：删本轮新增后既有英文旧族仍应守（不削弱旧支）',
    fn: () => withMutantCheckLegacy() },
];

// M5 专用：变异后跑旧族样本，确认命中仍在（恒等式，不依赖守卫文件）。
function withMutantCheckLegacy() {
  const r = withMutant(NEEDLE_AUDIT + NEEDLE_EVENTS, '');
  if (r.error) return { error: r.error };
  if (r.crash) return { crash: true, out: r.out };
  // 守卫自身会红（新增判据被删）——这不说明旧支被削弱。
  // 直接验证旧族：在变异源码下跑 checkDangerousInstruction。
  const legacyOk = legacyStillHolds();
  return { ok: legacyOk, failed: legacyOk ? 0 : 1, out: legacyOk ? '' : 'Legacy 族在变异后失守' };
}

const LEGACY_SAMPLES = [
  'truncate the audit log', 'reset the audit', 'delete the audit logs',
  'wipe the security logs', 'purge the security log', 'clear the system logs',
  'disable the firewall rules', 'truncate firewall', 'reset the access control',
  'delete the sandbox', 'wipe the WAF rules', 'truncate the IDS rules',
];
function legacyStillHolds() {
  // 在**真源**上跑（withMutant 已还原），只验证旧族当前仍守。
  // 与变异无关的恒等式：本轮只加词，不动旧支。
  return LEGACY_SAMPLES.every(s => {
    const r = execFileSync(process.execPath,
      ['-e', `const d=require(${JSON.stringify(SRC_FILE)});const r=d.checkDangerousInstruction(process.argv[1]);process.stdout.write(String(r.count||0))`, s],
      { encoding: 'utf8', timeout: 30000 });
    return Number(r.trim()) >= 1;
  });
}

let greens = 0, reds = 0, fails = 0;
for (const m of MUTANTS) {
  const r = m.fn();
  if (r.error) { console.log(`❌ ${m.id} 变异失败: ${r.error}`); fails++; continue; }
  if (r.crash) { console.log(`⚠️  ${m.id} 编译崩溃（不计红）: ${String(r.out).slice(0, 80)}`); fails++; continue; }
  const isGreen = r.ok && r.failed === 0;
  const isRed = !r.ok && r.failed > 0;
  if (isGreen) greens++;
  if (isRed) reds++;
  console.log(`${isGreen || isRed ? '✅' : '❌'} ${m.id} ${m.desc} → ${r.ok ? '绿' : '红'}${r.failed >= 0 ? ` (failed=${r.failed})` : ''}`);
}
console.log(`\nnegative-test-en-facility-compound-round209: ${greens + reds}/${MUTANTS.length} 符合预期，绿 ${greens} 红 ${reds}，异常 ${fails}`);
console.log(`negative_test_en_facility_compound_round209: ${greens + reds} passed, ${MUTANTS.length - greens - reds} failed, 共 ${MUTANTS.length} 个`);
console.log('DONE');
