// scripts/round-224/probe-r224-supen-impact.js
// 第 224 轮：把英文 superlative 判据从 hasChinese else 分支移到公共区，
// 量化它对现有良性池的影响（不改动引擎，只在本脚本内模拟新判据）。
// 输出：每池的「新判据命中数 / 池大小」——不打印任何样本文本。
const path = require('path');
const BENCH = path.join(process.cwd(), 'test');

// ── 新判据（与计划落地到 src/index.js 的完全一致）─────────────────
function enSuperlativeCount(text) {
  const _supEn = text
    .replace(/\b(?:the\s+)?(?:best|simplest|easiest|safest|fastest|cleanest|smartest)\s+(?:way|ways|approach|practice|method|option|choice|strategy|thing)\s+(?:to|is|would\s+be|for\s+most|of)\b/gi, ' ')
    .replace(/\b(?:latest|newest|earliest|oldest|previous|recent)\s+(?:version|release|update|news|information|data|results?|build)\b/gi, ' ');
  const EN_SUP_ADJ = '(?:quiet|comfortable|trustworthy|convenient|beautiful|useful|powerful|intuitive|robust|scalable|elegant|lightweight|durable|affordable|popular|impressive|important|simple|easy|fast|flexible|responsive|stable|efficient|effective|good|great|nice|bad|ugly|boring|annoying|unreliable|slow|cumbersome|confusing|expensive|reliable)';
  const re = new RegExp('\\b(?:best|worst|most\\s+(?:' + EN_SUP_ADJ + ')|(?:quietest|safest|simplest|easiest|fastest|smartest|cleanest|strongest|cheapest|greatest|ugliest))\\b', 'gi');
  return (_supEn.match(re) || []).length;
}

// 现有 gate 是否已经因 confidence 维度报非 pass（用于对比增量）
const { checkOutput } = require('../../src/gate.js');

function scanPool(name, samples) {
  let newHit = 0, alreadyFlagged = 0, incremental = 0;
  const incIdx = [];
  for (let i = 0; i < samples.length; i++) {
    const t = samples[i];
    if (typeof t !== 'string') continue;
    const cnt = enSuperlativeCount(t);
    if (cnt === 0) continue;
    newHit++;
    const g = checkOutput(t);
    if (g.gate.action !== 'pass') { alreadyFlagged++; continue; }
    incremental++;
    incIdx.push(i);
  }
  console.log(`${name}: 新判据命中 ${newHit}/${samples.length}（其中现已是非pass ${alreadyFlagged}，纯增量 ${incremental}）`);
  if (incIdx.length) console.log('  增量样本下标:', incIdx.join(','));
  return { newHit, incremental, incIdx };
}

// 池 1：垂直良性 150
const vb = require(path.join(BENCH, 'vertical-benign-benchmark.js'));
const vert = [];
for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
  for (const t of list) vert.push(t);
}
scanPool('垂直良性', vert);

// 池 2：中英混排 25
const bm = require(path.join(BENCH, 'benign-mixed-benchmark.js'));
const mixed = Array.isArray(bm.SAMPLES) ? bm.SAMPLES : [];
scanPool('中英混排', mixed);

// 池 3：gate-benchmark 5 类
const gb = require(path.join(BENCH, 'gate-benchmark.js'));
for (const [cat, list] of Object.entries(gb.SAMPLES || {})) {
  if (Array.isArray(list)) scanPool('基础-' + cat, list);
}
