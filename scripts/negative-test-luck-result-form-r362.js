// r362 负例守卫：玄学归因族两条结果形缺口（commit 12a05f13）
// 守卫对象（src/index.js）：
//   置假点 1：PC_REV_RES_ZH 获益结果表 → 摘掉本轮补的订单/来单/成单形
//   置假点 2：PSEUDO_CAUSAL_EN 第 15 支（获益事件完成形）→ 整支撑假为 (?!)
// 判据（在 detector 层生效）：置假后 probe-2 的 PC_HIT 必须下降（攻击命中减少），
//   且良性族 GATE_PASS 不得恶化（不能靠误伤换命中）。
// 附带 gate 层哨兵：probe-1 的 ATTACK/BENIGN 基线。
// 形状（451 纪律）：样本原文隔离在 scripts/round-362/probe-2-family-hits.js。
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const HIT_PROBE = path.join(ROOT, 'scripts/round-362/probe-2-family-hits.js');

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
  const res = { hit: null, hitTotal: null, pass: null, passTotal: null };
  for (const l of lines) {
    let m = l.match(/PC_HIT (\d+)\/(\d+)/);
    if (m) { res.hit = Number(m[1]); res.hitTotal = Number(m[2]); }
    m = l.match(/GATE_PASS (\d+)\/(\d+)/);
    if (m) { res.pass = Number(m[1]); res.passTotal = Number(m[2]); }
  }
  return res;
}

const NEUTER_POINTS = [
  {
    label: 'ZH: PC_REV_RES_ZH 摘掉本轮补的获益结果形（订单/来单/成单/客户下单）',
    kind: 'regex',
    from: '|订单[^。，,]{0,4}多|来单|成单|客户下单)',
    to: ')',
  },
  {
    label: 'EN: PSEUDO_CAUSAL_EN 获益事件完成形支整支置假',
    kind: 'regex',
    from: '\\b(?:came through|came in|landed|got through|pulled off|panned out|worked out)\\b',
    to: '(?!x)x',
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
console.log('基线（判据在）: PC_HIT ' + base.hit + '/' + base.hitTotal + '  GATE_PASS ' + base.pass + '/' + base.passTotal);
if (base.hit === null || base.pass === null) { console.log('BASE_FAIL：探针无输出'); process.exit(1); }
if (base.hit < 15) { console.log('BASE_FAIL：攻击命中基线低于 15/16'); process.exit(1); }
if (base.pass < 13) { console.log('BASE_FAIL：良性 pass 基线低于 13/14'); process.exit(1); }

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
    console.log('置假点 [' + p.label + '] => PC_HIT ' + n.hit + '/' + n.hitTotal + '  GATE_PASS ' + n.pass + '/' + n.passTotal + '  ' +
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
console.log('还原后: PC_HIT ' + restored.hit + '/' + restored.hitTotal + '  GATE_PASS ' + restored.pass + '/' + restored.passTotal);
if (restored.hit !== base.hit || restored.pass !== base.pass) { console.log('RESTORE_FAIL：还原后未回到基线'); allGreen = false; }

console.log('-'.repeat(60));
console.log(allGreen
  ? 'NEG_OK：2 个置假点全部变红，基线还原'
  : 'NEG_FAIL：有置假点未变红或基线未还原');
process.exit(allGreen ? 0 : 1);
