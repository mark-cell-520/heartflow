#!/usr/bin/env node
/**
 * round-353 probe-1：闸门放过维度逐条定性
 *
 * 背景：dimension-coverage-scan 的 gateMisses 显示 8 个维度有探针被
 * gate 完全放过（action === 'pass'）。r352 判定为「良性侧形状，非漏检」，
 * 但没留逐条证据，无法区分「闸门放过」是
 *   (a) 探针本身写得太弱（探针问题）还是
 *   (b) 判据真的漏了这类形状（判据问题）。
 *
 * 本探针对每个放过条目输出形状分类，只打数字/形状，不回显样本原文。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const MISS = [
  ['rewrite', 'emotional_manipulation', 2],
  ['rewrite', 'multi_turn_escalation', 2],
  ['verify', 'presupposition', 2],
  ['verify', 'pseudo_profundity', 2],
  ['verify', 'reasoning_coherence', 2],
  ['verify', 'stereotype', 2],
  ['verify', 'pseudo_causal', 2],
  ['verify', 'tone_policing', 2],
];

// 从扫描脚本导入探针库（单一数据源，避免两处漂移）
const scanSrc = require('fs').readFileSync(path.join(ROOT, 'scripts/dimension-coverage-scan.js'), 'utf8');
const PROBES = {};
const pm = scanSrc.match(/const PROBES = \{([\s\S]*?)\n\};/);
if (pm) {
  const lineRe = /^\s*([a-z_]+):\s*\[(.*)\],?$/gm;
  let lm;
  while ((lm = lineRe.exec(pm[1])) !== null) {
    PROBES[lm[1]] = (lm[2].match(/'[^']*'/g) || []).map(s => s.slice(1, -1));
  }
}

let pass_count = 0, nonpass = 0, total = 0;
const rows = [];
for (const [tier, dim, n] of MISS) {
  const probes = PROBES[dim] || [];
  let missed = 0;
  for (let i = 0; i < probes.length; i++) {
    total++;
    let r;
    try { r = gate.checkOutput(probes[i]); } catch (e) { r = { gate: { action: 'CRASH:' + e.message } }; }
    const action = r.gate.action;
    if (action === 'pass') { missed++; pass_count++; } else { nonpass++; }
    rows.push({
      dim, tier, idx: i, action,
      otherDims: action === 'pass' ? [] : (r.findings || []).map(f => f.dimension).filter(d => d !== dim),
      ownDim: action === 'pass' ? false : (r.findings || []).some(f => f.dimension === dim),
      score: r.overallScore,
    });
  }
  console.log(
    dim.padEnd(24) + tier.padEnd(9) +
    '放过 ' + missed + '/' + probes.length
  );
}
console.log('─'.repeat(50));
console.log('总计 ' + total + ' 条探针：gate pass ' + pass_count + ' 条，非 pass ' + nonpass + ' 条');

// 归因细分：非 pass 的条目里有几条被 own dim 命中，几条被其他维度代劳
const nonpassRows = rows.filter(r => r.action !== 'pass');
const own = nonpassRows.filter(r => r.ownDim).length;
console.log('非 pass 条目归因：本维度命中 ' + own + ' / ' + nonpassRows.length +
  '，其余由其他维度代劳');
const delegated = nonpassRows.filter(r => !r.ownDim);
if (delegated.length) {
  console.log('代劳维度分布：' + JSON.stringify(
    delegated.reduce((m, r) => { for (const d of r.otherDims) m[d] = (m[d] || 0) + 1; return m; }, {})
  ));
}
require('fs').writeFileSync(path.join(ROOT, 'data', 'round-353-gatemiss.json'), JSON.stringify({ rows, at: new Date().toISOString() }, null, 2));
