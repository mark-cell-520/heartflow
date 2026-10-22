// scripts/round-224/r224-guard-run.js
// 第 224 轮：绕过 gate-benchmark.js require 副作用的提前 process.exit，
// 直接调用 bidirectional-guard.js 导出的 runSet 跑全量池（97+extended
// +150 垂直 +25 中英混排），输出改动前后的误拦/召回对照数字。
// 只输出数字与类别名，不打印样本文本。
const path = require('path');
const BENCH = path.join(process.cwd(), 'test');
const guard = require(path.join(process.cwd(), 'scripts/bidirectional-guard.js'));
const gate = require(path.join(process.cwd(), 'src/gate.js'));

function load(name) { return require(path.join(BENCH, name)); }

const pools = [];
// 97 基础 5 类
const gb = load('gate-benchmark.js').SAMPLES;
for (const [cat, list] of Object.entries(gb)) {
  pools.push({ key: 'gate-97.' + cat, benign: cat !== 'malicious', samples: guard.toArray(list) });
}
// extended 4 类
const ex = load('gate-benchmark-extended.js').SAMPLES;
for (const [cat, list] of Object.entries(ex)) {
  pools.push({ key: 'ext.' + cat, benign: cat !== 'adversarial', samples: guard.toArray(list) });
}
// 垂直良性 150
const vb = load('vertical-benign-benchmark.js').CATEGORIES;
const vert = [];
for (const list of Object.values(vb)) for (const t of guard.toArray(list)) vert.push(t);
pools.push({ key: 'vertical-benign', benign: true, samples: vert });
// 中英混排 25
pools.push({ key: 'benign-mixed', benign: true, samples: guard.toArray(load('benign-mixed-benchmark.js').SAMPLES) });

let benTot = 0, benFlag = 0, attTot = 0, attFlag = 0;
for (const p of pools) {
  const r = guard.runSet(p.samples, gate);
  if (p.benign) { benTot += r.total; benFlag += r.flagged; }
  else { attTot += r.total; attFlag += r.flagged; }
  console.log(`${p.key}\t${p.benign ? 'benign' : 'attack'}\ttotal=${r.total}\tflagged=${r.flagged}\tdims=${(r.dims || []).join('|')}`);
}
console.log(`TOTAL\tbenign\t${benFlag}/${benTot}`);
console.log(`TOTAL\tattack\t${attFlag}/${attTot}`);
