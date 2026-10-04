'use strict';
// r434 子进程统计器：读 stdin 的 { dir, mode, samples }，输出 { total }
//  dir   : src 目录（含 index.js / gate.js）
//  mode  : 'baseline' 读 gate.js；'mutant' 读 round-434-mutant-gate.js
const fs = require('fs');
const path = require('path');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const dir = input.dir;
const gateFile = input.mode === 'mutant' ? 'round-434-mutant-gate.js' : 'gate.js';
const gate = require(path.resolve(dir, gateFile));
const main = gate.gate || gate.check;
let total = 0;
for (const s of input.samples) {
  let r;
  try { r = main(s); } catch (e) { continue; }
  const em = (r.findings || []).find(f => f.dimension === 'emotional_manipulation');
  if (em) total++;
}
process.stdout.write(JSON.stringify({ total }) + '\n');
