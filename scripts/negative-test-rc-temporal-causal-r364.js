// r364 负例守卫：rc 时间相关性≠因果前提族第三臂（commit 19a40227）
// 守卫对象（src/index.js，rcBrokenFinal 的第三臂 rcTemporalCausal）：
//   置假点 1：整臂置假（TEMPORAL_CORRELATION 表整体失效）→ 全族漏判重现
//   置假点 2：摘掉因果归属动词表里的「可见/说明」类归因形（改变/唯一原因）
//             → 该形状攻击漏判重现
// 判据：在 detector 层生效——置假后 RC_HIT 必须下降（攻击命中减少），
//   且良性 GATE_PASS 不得下降（不能靠误伤换命中）。
// 附带 gate 层哨兵：GATE_NONPASS。
// 形状（451 纪律）：样本原文隔离在 scripts/round-364/probe-5-guard.js。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const HIT_PROBE = path.join(ROOT, 'scripts/round-364/probe-5-guard.js');

function runProbe() {
  try {
    const out = execFileSync('node', [HIT_PROBE], { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (e) {
    const t = ((e.stdout || '') + '\n' + (e.stderr || '')).toString();
    return t.trim().split('\n').filter(Boolean);
  }
}

function readNumbers(lines) {
  const res = { hit: null, hitTotal: null, nonpass: null, pass: null, passTotal: null };
  for (const l of lines) {
    let m = l.match(/RC_HIT (\d+)\/(\d+)/);
    if (m) { res.hit = Number(m[1]); res.hitTotal = Number(m[2]); }
    m = l.match(/GATE_NONPASS (\d+)\/(\d+)/);
    if (m) { res.nonpass = Number(m[1]); }
    m = l.match(/GATE_PASS (\d+)\/(\d+)/);
    if (m) { res.pass = Number(m[1]); res.passTotal = Number(m[2]); }
  }
  return res;
}

const NEUTER_POINTS = [
  {
    label: '整臂置假：TEMPORAL_CORRELATION 时间相关性表整体失效',
    from: 'const TEMPORAL_CORRELATION = /每次|每当|每逢|自此|此后|以来|之后|同期|与此同时|同时(?!推进|进行)/;',
    to: 'const TEMPORAL_CORRELATION = /(?!x)x/;',
  },
  {
    label: '摘归因动词：CAUSAL_VERB 去掉改变/唯一原因形状',
    from: '决定|招来|引来|带来|改变|唯一原因|归因|源于|全部|招雨|招来',
    to: '决定|招来|引来|带来|归因|源于|全部',
  },
];

function neuter(src, p) {
  if (!src.includes(p.from)) return null;
  const n = src.split(p.from).length - 1;
  if (n !== 1) return null;
  return src.replace(p.from, p.to);
}

const original = fs.readFileSync(SRC, 'utf8');
const missing = NEUTER_POINTS.filter(p => neuter(original, p) === null);
if (missing.length) {
  console.log('NEEDLE_NOT_FOUND: ' + missing.map(m => m.label).join('; '));
  process.exit(2);
}

let allGreen = true;

// ── 基线：判据在场 ──
const base = readNumbers(runProbe());
console.log('基线（判据在）: RC_HIT ' + base.hit + '/' + base.hitTotal + '  GATE_NONPASS ' + base.nonpass + '  GATE_PASS ' + base.pass + '/' + base.passTotal);
if (base.hit === null || base.pass === null) { console.log('BASE_FAIL：探针无输出'); process.exit(1); }
if (base.hit < 6) { console.log('BASE_FAIL：RC 命中基线低于 6/6'); process.exit(1); }
if (base.pass < 11) { console.log('BASE_FAIL：良性 pass 基线低于 11/12'); process.exit(1); }

// ── 逐置假点 ──
for (const p of NEUTER_POINTS) {
  let ok = false;
  try {
    const mutated = neuter(original, p);
    if (!mutated) { console.log('置假点 [' + p.label + '] 锚点未匹配'); allGreen = false; continue; }
    execFileSync('node', ['--check', SRC], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(SRC, mutated);
    const n = readNumbers(runProbe());
    // 变红判据：攻击命中必须下降（缺口重现），良性 pass 不得下降
    const hitDropped = n.hit !== null && n.hit < base.hit;
    const passHold = n.pass !== null && n.pass >= base.pass;
    const isRed = hitDropped && passHold;
    console.log('置假点 [' + p.label + '] => RC_HIT ' + n.hit + '/' + n.hitTotal + '  GATE_NONPASS ' + n.nonpass + '  GATE_PASS ' + n.pass + '/' + n.passTotal + '  ' +
      (isRed ? 'RED_OK（缺口重现：命中下降且误伤未增）' : 'RED_NO_MISS（守卫失效）'));
    ok = isRed;
  } catch (e) {
    console.log('置假点 [' + p.label + '] 执行异常: ' + String(e.message).slice(0, 80));
    ok = false;
  } finally {
    fs.writeFileSync(SRC, original);
  }
  if (!ok) allGreen = false;
}

fs.writeFileSync(SRC, original);
const restored = readNumbers(runProbe());
console.log('还原后: RC_HIT ' + restored.hit + '/' + restored.hitTotal + '  GATE_NONPASS ' + restored.nonpass + '  GATE_PASS ' + restored.pass + '/' + restored.passTotal);
if (restored.hit !== base.hit || restored.pass !== base.pass) { console.log('RESTORE_FAIL：还原后未回到基线'); allGreen = false; }

console.log('-'.repeat(60));
console.log(allGreen
  ? 'NEG_OK：2 个置假点全部变红，基线还原'
  : 'NEG_FAIL：有置假点未变红或基线未还原');
process.exit(allGreen ? 0 : 1);
