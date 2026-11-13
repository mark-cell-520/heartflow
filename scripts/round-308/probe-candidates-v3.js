// r308 定夺 v3：按维度逐一验证「模块层全命中 + gate 层 pass 穿透」，并做疑难良性误伤压力测试
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const CANDIDATES = [
  { dim: 'anchoring_effect',            file: 'anchoring-effect.js',            fn: 'detectAnchoringEffect' },
  { dim: 'disposition_effect',          file: 'disposition-effect.js',           fn: 'detectDispositionEffect' },
  { dim: 'effort_justification',        file: 'effort-justification.js',         fn: 'detectEffortJustification' },
  { dim: 'endowment_effect',            file: 'endowment-effect.js',             fn: 'detectEndowmentEffect' },
  { dim: 'illusion_of_control',         file: 'illusion-of-control.js',          fn: 'detectIllusionOfControl' },
  { dim: 'mental_accounting',           file: 'mental-accounting.js',            fn: 'detectMentalAccounting' },
  { dim: 'p_hacking',                   file: 'p-hacking.js',                    fn: 'detectPHacking' },
  { dim: 'perverse_incentive',          file: 'perverse-incentive.js',           fn: 'detectPerverseIncentive' },
  { dim: 'tragedy_of_commons',          file: 'tragedy-of-commons.js',           fn: 'detectTragedyOfCommons' },
  { dim: 'winners_curse',               file: 'winners-curse.js',                fn: 'detectWinnersCurse' },
];

// 手工提取各测试文件的攻击数组（字符串字面量），限制在第一个 check 块内
function extractAttacks(testFile) {
  const txt = fs.readFileSync(testFile, 'utf8');
  const out = [];
  for (const m of txt.matchAll(/const ATTACKS_(ZH|EN) = \[([\s\S]*?)\n\];/g)) {
    for (const s of m[2].matchAll(/'([^']{8,})'/g)) out.push(s[1]);
  }
  if (out.length) return out;
  // ZH = [ / EN = [ 形状
  for (const m of txt.matchAll(/const (?:ZH|EN) = \[([\s\S]*?)\n  \];/g)) {
    for (const s of m[1].matchAll(/'([^']{8,})'/g)) out.push(s[1]);
  }
  return out;
}

const summary = [];
for (const c of CANDIDATES) {
  const mod = require(path.join(ROOT, 'src', c.file));
  const f = mod[c.fn];
  const testFile = path.join(ROOT, 'test', c.file.replace('.js', '.test.js'));
  const samples = extractAttacks(testFile);
  let modHit = 0, gateHit = 0, gatePass = 0, modHitButGatePass = 0;
  const carried = new Set();
  for (const t of samples) {
    let m; try { m = f(t); } catch (_) { m = {}; }
    const mHit = !!(m && m.hit);
    if (mHit) modHit++;
    let g; try { g = gate.checkOutput(t); } catch (_) { g = { gate: { action: 'ERR' }, findings: [] }; }
    const dims = (g.findings || []).map(x => x.dimension);
    if (dims.includes(c.dim)) gateHit++;
    if (g.gate.action === 'pass') gatePass++;
    if (mHit && g.gate.action === 'pass') modHitButGatePass++;
    if (mHit && !dims.includes(c.dim)) dims.forEach(d => carried.add(d));
  }
  summary.push({ ...c, n: samples.length, modHit, gateHit, gatePass, modHitButGatePass, carried: [...carried] });
}
console.log('=== r308 定夺 v3：真实攻击样本 gate 穿透 ===');
for (const r of summary) {
  console.log(
    r.dim.padEnd(22),
    `n=${String(r.n).padStart(2)}`,
    `模块命中 ${String(r.modHit).padStart(2)}/${String(r.n).padStart(2)}`,
    `gate归因 ${String(r.gateHit).padStart(2)}`,
    `gate真穿透 ${String(r.modHitButGatePass).padStart(2)}`,
    r.carried.length ? '代拦:' + r.carried.join(',') : ''
  );
}
