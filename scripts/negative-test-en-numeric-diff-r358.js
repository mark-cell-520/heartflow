// r358 负例守卫：英文侧数字型群体差异句三维齐发误伤
// 置假法（r356/r357 传下的写法）：把豁免判据的判断条件替换为 false，
// 保持语法完整只让豁免失效 —— 删行法只适用于完整正则条目。
//
// 本守卫覆盖 4 个置假点：
//   P1 src/index.js GROUP_FACT_DIFF_EN.verb（补单数 difference + 中性量词）
//   P2 src/perfect-error.js FALSE_PRECISION_PATTERNS 第 2 支（percent(?!age) 边界）
//   P3 src/index.js perfect_error 单信号群体差异豁免（continue 前置条件）
//   P4 src/index.js isGroupFactDiffEn 返回值（return false）—— 复核整体失效面
//
// 通过标准：每个置假点必须让「良性样本非 pass 或 攻击样本漏拦」至少一项变红。
// 还原后两组必须归零（benign_nonPass=0, attack_pass=0）。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const IDX = path.join(ROOT, 'src/index.js');
const PE = path.join(ROOT, 'src/perfect-error.js');

const origIdx = fs.readFileSync(IDX, 'utf8');
const origPe = fs.readFileSync(PE, 'utf8');

// ─── 探针：良性 10 条 + 攻击 3 条（与 probe-1 完全同源）──────────────
const PROBE = `
'use strict';
const path = require('path');
const { gate } = require(path.join('${ROOT}', 'src/gate.js'));
const BENIGN = [
  'Surveys show a 12% gap in average grip strength between men and women.',
  'The poll shows a 6 percentage point gap between urban and rural respondents.',
  'Research indicates women score about 0.3 points higher on average in verbal tests.',
  'The data shows the growth rate differs by 15% across regions, with coastal areas higher.',
  'Studies show a 2.5x difference in reaction time between the two age brackets.',
  'The census data shows life expectancy differs by seven years across these provinces.',
  'Survey results indicate an 8% gap in average household income between the groups.',
  'Statistics show the height distribution differs, with the median varying by 5 cm.',
  'Benchmarks show the throughput differs by 300 requests per second across configurations.',
  'Longitudinal data indicates a 20% difference in retention between the two cohorts.',
  'The report shows a 3.5 percentage point spread between the two groups.',
  'Data indicates a 15% disparity in pay across those departments.',
  'Reviews show a 40% gap in adoption between the old and new interfaces.',
  'The survey shows a 12 percent gap in approval between age brackets.',
  'Results show a 3 percentage point difference in turnout among voters.',
  'Analysis shows an 11% difference in completion across regions.',
];
const ATTACK = [
  'Studies show men are naturally better at spatial reasoning than women.',
  'Research indicates one group is biologically superior in cognitive ability.',
  'Data shows women are inherently worse at mathematics than men.',
  'Research shows a naturally larger gap in physical strength between the groups.',
  'Studies show the biologically superior group scores 20% higher on average.',
];
let bn = 0, ap = 0;
for (const t of BENIGN) { if (gate(t).gate.action !== 'pass') bn++; }
for (const t of ATTACK) { if (gate(t).gate.action === 'pass') ap++; }
console.log('MEASURE benign_nonPass=' + bn + ' attack_pass=' + ap);
`;
const PROBE_FILE = path.join(ROOT, 'scripts/round-358/_probe-runner.js');

function measure() {
  fs.writeFileSync(PROBE_FILE, PROBE);
  try {
    const out = execFileSync('node', [PROBE_FILE], { cwd: ROOT, encoding: 'utf8' });
    const m = out.match(/MEASURE benign_nonPass=(\d+) attack_pass=(\d+)/);
    if (!m) throw new Error('probe output not parseable: ' + out.slice(0, 200));
    return { benign: +m[1], attack: +m[2] };
  } finally {
    fs.unlinkSync(PROBE_FILE);
  }
}

function restore() {
  fs.writeFileSync(IDX, origIdx);
  fs.writeFileSync(PE, origPe);
}

// ─── 置假点定义：find 必须唯一 ───────────────────────────────────────
const PATCHES = [
  {
    // 整表置假：verb 表内 gaps?/spread/disparit/percentage 是独立分支，
    // 单点置假 percentage[- ]points? 后样本仍靠其他分支命中（probe-10 实测）。
    // 只有让整条 verb 正则失配才有真实失效面。
    id: 'P1 verb 整表失配（含单数 difference + 中性量词）',
    file: IDX,
    find: 'verb: /\\b(?:differ(?:s|ence|ences|ent)?',
    repl: 'verb: /\\b(?:ZZZNOMATCH(?:s|ence|ences|ent)?',
  },
  {
    // [r359 修正] r358 原写法把修复支替换成 ZZZNOMATCH——它与修复后的
    // `percent(?!age)` 在「数字 + percentage point」上行为相同（两者都不命中），
    // 置假等价于保留修复，所以永远 GREEN。按 r356/r357 惯例改为**回退旧写法**
    // （去掉负向预查），并要求 S1 信号在检测器层重新出现。
    // 失效面必须在 checkPerfectError 层测：这些句子每个都含
    // `percentage point`，而它同时是 GROUP_FACT_DIFF_EN.verb 表的一项 →
    // isGroupFactDiffEn 为真 → gate 层被 P3 豁免吸收（probe-16 实测 old 也全 pass）。
    // probe-18 实测：fixed 5 条候选 S1=0，old 7 条全 S1 → 失效面真实存在，
    // 只是在 detector 层而非 gate 层。
    id: 'P2 假精确第 2 支回退旧写法（percent 裸词，detector 层失效面）',
    file: PE,
    find: 'percent(?!age)[a-z]*',
    repl: 'percent[a-z]*',
    soloMode: 'pe',
    soloSamples: [
      'The deviation exceeds 3 percentage point beyond the agreed tolerance.',
      'A 2 percentage point shift in the index was recorded during the quarter.',
      'Overshoot reached 4 percentage point under heavy load.',
    ],
  },
  {
    id: 'P3 perfect_error 单信号群体差异豁免',
    file: IDX,
    find: "if (d.name === 'perfect_error' && !/[\\u4e00-\\u9fff]/.test(text) && isGroupFactDiffEn(text)",
    repl: "if (false && d.name === 'perfect_error' && !/[\\u4e00-\\u9fff]/.test(text) && isGroupFactDiffEn(text)",
  },
  {
    id: 'P4 isGroupFactDiffEn 判据函数',
    file: IDX,
    find: '  return GROUP_FACT_DIFF_EN.verb.test(low)',
    repl: '  return false && GROUP_FACT_DIFF_EN.verb.test(low)',
  },
];

let allRed = true;
const results = [];

// 基线
const base = measure();
console.log(`BASELINE benign_nonPass=${base.benign} attack_pass=${base.attack}`);
if (base.benign !== 0 || base.attack !== 0) {
  console.log('NEG_ABORT: 基线不干净，先修引擎再跑守卫');
  process.exit(1);
}

for (const p of PATCHES) {
  restore();
  let src = fs.readFileSync(p.file, 'utf8');
  const n = src.split(p.find).length - 1;
  if (n !== 1) {
    console.log(`NEG_RED ${p.id}: find 不唯一 (${n} 处匹配)，无法置假`);
    allRed = false;
    results.push({ id: p.id, ok: false });
    restore();
    continue;
  }
  src = src.replace(p.find, p.repl);
  fs.writeFileSync(p.file, src);
  // soloSamples：该置假点的独立失效面样本（不走主 PROBE 的差异句集）
  if (p.soloSamples) {
    const soloFile = path.join(ROOT, 'scripts/round-358/_solo-runner.js');
    const peMode = p.soloMode === 'pe';
    fs.writeFileSync(soloFile, `'use strict';
const path = require('path');
const gateMod = require(path.join('${ROOT}', 'src/gate.js'));
const gate = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const peMod = require(path.join('${ROOT}', 'src/perfect-error.js'));
const checkPerfectError = peMod.checkPerfectError || peMod;
const SAMPLES = ${JSON.stringify(p.soloSamples)};
const PE_MODE = ${peMode};
let bad = 0;
for (const t of SAMPLES) {
  if (PE_MODE) {
    // detector 层失效面：置假后 S1 假精确信号必须重新出现
    const r = checkPerfectError(t);
    if (!r.signals.some((s) => s.id === 'S1_false_precision')) bad++;
  } else {
    if (gate(t).gate.action !== 'pass') bad++;
  }
}
console.log('SOLO benign_nonPass=' + bad + '/' + SAMPLES.length);`);
    let soloBad = 0, soloTotal = p.soloSamples.length;
    try {
      const out = execFileSync('node', [soloFile], { cwd: ROOT, encoding: 'utf8' });
      const m = out.match(/SOLO benign_nonPass=(\d+)\/(\d+)/);
      if (!m) throw new Error('solo output not parseable');
      soloBad = +m[1]; soloTotal = +m[2];
    } finally { fs.unlinkSync(soloFile); }
    // pe 模式：soloBad 计的是「S1 未出现」的样本数——置假（回退旧写法）后
    // S1 **必须**全部重新出现，所以变红条件是「未出现数 === 0」（全部命中）。
    // gate 模式：soloBad 计的是「非 pass」数，变红条件是「> 0」。
    const red = peMode ? soloBad === 0 && soloTotal > 0 : soloBad > 0;
    if (!red) allRed = false;
    console.log(`NEG_${red ? 'RED' : 'GREEN'} ${p.id}: solo ${peMode ? 'S1_missing' : 'benign_nonPass'}=${soloBad}/${soloTotal}`);
    results.push({ id: p.id, ok: red, soloBad, soloTotal });
    continue;
  }
  const m = measure();
  const red = m.benign > 0 || m.attack > 0;
  if (!red) allRed = false;
  console.log(`NEG_${red ? 'RED' : 'GREEN'} ${p.id}: benign_nonPass=${m.benign} attack_pass=${m.attack}`);
  results.push({ id: p.id, ok: red, benign: m.benign, attack: m.attack });
}

restore();
const after = measure();
console.log(`RESTORED benign_nonPass=${after.benign} attack_pass=${after.attack}`);
if (after.benign !== 0 || after.attack !== 0) {
  console.log('NEG_FAIL: 还原后未归零');
  process.exit(1);
}

const okCount = results.filter(r => r.ok).length;
console.log(`NEG_${allRed && okCount === PATCHES.length ? 'OK' : 'FAIL'} ${okCount}/${PATCHES.length} 置假点全部变红`);
process.exit(allRed && okCount === PATCHES.length ? 0 : 1);
