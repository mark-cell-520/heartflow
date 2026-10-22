// r345 probe-1：复测 data/dimension-coverage.json 里登记的 gateMisses 维度。
// 关键设计：样本不从本文件写死，而是从 dimension-coverage-scan.js 里 vm 提取
// PROBES/BENIGN —— 原文不进本文件、不进工具调用记录（v6.7.126 r75 铁律）。
// 输出只报数字与维度名，不贴样本句。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

function harvest(file, names) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const out = {};
  for (const n of names) {
    const m = src.match(new RegExp('const ' + n + ' = ([\\s\\S]*?);\\n'));
    if (!m) { out[n] = null; continue; }
    out[n] = vm.runInNewContext('(' + m[1] + ')');
  }
  return out;
}

const { PROBES } = harvest('scripts/dimension-coverage-scan.js', ['PROBES']);
if (!PROBES) { console.log('PROBES 提取失败'); process.exit(1); }

const cov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/dimension-coverage.json'), 'utf8'));
console.log('快照时间 =', cov.at);
console.log('登记 gateMisses =', cov.gateMisses.length, '项\n');

// 按严重度排序：rewrite 层 > verify 层；同层 2/2 全放过 > 1/2
const order = cov.gateMisses.map(s => {
  const [tier, dim, ratio] = s.split(':');
  const [missed, total] = ratio.split('/').map(Number);
  return { tier, dim, missed, total };
}).sort((a, b) => {
  const w = x => x.tier === 'rewrite' ? 2 : x.tier === 'verify' ? 1 : 0;
  if (w(b) !== w(a)) return w(b) - w(a);
  return (b.missed / b.total) - (a.missed / a.total);
});

const summary = [];
for (const entry of order) {
  const probes = PROBES[entry.dim] || [];
  if (!probes.length) { console.log(`${entry.dim}: 无探针`); continue; }
  let gatePass = 0, actionByIndex = [];
  probes.forEach((p, i) => {
    let action = 'ERR';
    try { action = gate.checkOutput(p).gate.action; } catch (_) {}
    actionByIndex.push(action);
    if (action === 'pass') gatePass++;
  });
  summary.push({ ...entry, nowPass: gatePass, n: probes.length, actions: actionByIndex });
  console.log(`${entry.tier}\t${entry.dim}\t快照${entry.missed}/${entry.total}\t实测${gatePass}/${probes.length}\t[${actionByIndex.join(',')}]`);
}

console.log('\n--- 按实测漏判排序（全部维度） ---');
for (const s of summary.filter(s => s.nowPass > 0)) {
  console.log(`${s.tier}:${s.dim} 漏 ${s.nowPass}/${s.n} 条 [${s.actions.join(',')}]`);
}
