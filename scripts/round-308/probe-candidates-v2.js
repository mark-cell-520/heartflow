// r308 定夺探针 v2：用各模块测试文件里的真实攻击样本重测 gate 穿透
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
  { dim: 'inverse_gamblers_fallacy',    file: 'inverse-gamblers-fallacy.js',     fn: 'detectInverseGamblersFallacy' },
  { dim: 'mental_accounting',           file: 'mental-accounting.js',            fn: 'detectMentalAccounting' },
  { dim: 'p_hacking',                   file: 'p-hacking.js',                    fn: 'detectPHacking' },
  { dim: 'perverse_incentive',          file: 'perverse-incentive.js',           fn: 'detectPerverseIncentive' },
  { dim: 'significance_effect_size',    file: 'significance-effect-size.js',     fn: 'detectSignificanceEffectSize' },
  { dim: 'tragedy_of_commons',          file: 'tragedy-of-commons.js',           fn: 'detectTragedyOfCommons' },
  { dim: 'winners_curse',               file: 'winners-curse.js',                fn: 'detectWinnersCurse' },
  { dim: 'average_marginal_conflation', file: 'average-marginal-conflation.js',  fn: 'checkAverageMarginalConflation' },
  { dim: 'budget_value_conflation',     file: 'budget-value-conflation.js',      fn: 'checkBudgetValueConflation' },
];

function extractSamples(testFile) {
  const txt = fs.readFileSync(testFile, 'utf8');
  const out = [];
  // 抓 ATTACKS_ZH = [...] / ATTACKS_EN = [...]
  for (const m of txt.matchAll(/const ATTACKS_(ZH|EN) = \[([\s\S]*?)\n\];/g)) {
    for (const s of m[2].matchAll(/'([^']{8,})'/g)) out.push(s[1]);
  }
  // 抓 ZH = [ / EN = [ 形状
  for (const m of txt.matchAll(/const (?:ZH|EN) = \[([\s\S]*?)\n  \];/g)) {
    for (const s of m[1].matchAll(/'([^']{8,})'/g)) out.push(s[1]);
  }
  return out;
}

console.log('=== r308 定夺 v2：测试文件真实攻击样本 × gate() 穿透 ===');
for (const c of CANDIDATES) {
  const mod = require(path.join(ROOT, 'src', c.file));
  const f = mod[c.fn];
  const testFile = path.join(ROOT, 'test', c.file.replace('.js', '.test.js'));
  let samples = [];
  try { samples = fs.existsSync(testFile) ? extractSamples(testFile) : []; } catch (_) {}
  if (!samples.length) { console.log(c.dim.padEnd(26), 'NO_SAMPLES'); continue; }
  let modHit = 0, gateHit = 0, gatePass = 0;
  const carried = new Set();
  for (const t of samples) {
    let m; try { m = f(t); } catch (_) { m = {}; }
    if (m && m.hit) modHit++;
    let g; try { g = gate.checkOutput(t); } catch (_) { g = { gate: { action: 'ERR' }, findings: [] }; }
    const dims = (g.findings || []).map(x => x.dimension);
    if (dims.includes(c.dim)) gateHit++;
    if (g.gate.action === 'pass') gatePass++;
    if (m && m.hit && !dims.includes(c.dim)) dims.forEach(d => carried.add(d));
  }
  console.log(
    c.dim.padEnd(26),
    `n=${String(samples.length).padStart(2)}`,
    `模块 ${String(modHit).padStart(2)}/${String(samples.length).padStart(2)}`,
    `gate归因 ${String(gateHit).padStart(2)}`,
    `gate pass ${String(gatePass).padStart(2)}`,
    carried.size ? '代拦:' + [...carried].join(',') : ''
  );
}
