#!/usr/bin/env node
/**
 * round-353 probe-2：被放过探针 vs 已命中探针的形状指纹差异
 *
 * 纪律：原文不进上下文（451 铁律）。本脚本对每个维度输出
 * 「已命中条」与「被放过条」的形状哑变量差，不输出任何探针原文。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts/dimension-coverage-scan.js'), 'utf8');
const PROBES = {};
const pm = scanSrc.match(/const PROBES = \{([\s\S]*?)\n\};/);
if (pm) {
  const lineRe = /^\s*([a-z_]+):\s*\[(.*)\],?$/gm;
  let lm;
  while ((lm = lineRe.exec(pm[1])) !== null) {
    PROBES[lm[1]] = (lm[2].match(/'[^']*'/g) || []).map(s => s.slice(1, -1));
  }
}

const DIMS = ['emotional_manipulation', 'multi_turn_escalation', 'presupposition',
  'pseudo_profundity', 'reasoning_coherence', 'stereotype', 'pseudo_causal', 'tone_policing'];

// 形状哑变量
function shape(s) {
  return {
    len: s.length,
    q: /[？?]/.test(s),
    causal: /(因为|所以|由于|既然|因此|于是|导致)|\b(because|so|therefore|since|thus)\b/i.test(s),
    cond: /(如果|要是|若|一旦|只要|倘若)|\b(if|once|as long as)\b/i.test(s),
    person2: /你/.test(s),
    person3: /(他|她|他们|那些)|\b(they|them|those)\b/i.test(s),
    group: /(女|男|年轻|老人|东北|河南|上海|90后|00后|文科|理科|女人)/i.test(s),
    neg: /(不|没|别|无法)|\b(no|not|never)\b/i.test(s),
    time: /(现在|先|之后|慢慢|以后| subsequently)|然后/i.test(s),
    comma: /[，,]/.test(s),
  };
}
const KEYS = ['len', 'q', 'causal', 'cond', 'person2', 'person3', 'group', 'neg', 'time', 'comma'];

const out = {};
for (const dim of DIMS) {
  const probes = PROBES[dim] || [];
  const detail = [];
  probes.forEach((p, i) => {
    let action;
    try { action = gate.checkOutput(p).gate.action; } catch (e) { action = 'CRASH'; }
    detail.push({ idx: i, action, shape: shape(p) });
  });
  const pass = detail.filter(d => d.action === 'pass');
  const hit = detail.filter(d => d.action !== 'pass');
  out[dim] = { detail, passCount: pass.length, hitCount: hit.length };
  console.log('── ' + dim + '  命中 ' + hit.length + ' / 放过 ' + pass.length);
  for (const d of detail) {
    const marks = KEYS.map(k => (d.shape[k] === true || (k === 'len' && d.shape[k] > 14)) ? k : '').filter(Boolean).join(',');
    console.log('   #' + d.idx + ' ' + d.action.padEnd(7) + ' len=' + String(d.shape.len).padStart(2) + '  [' + marks + ']');
  }
  // 差异：放过条有而命中条没有的形状标记
  if (pass.length && hit.length) {
    const diffs = {};
    for (const k of KEYS) {
      if (k === 'len') continue;
      const pv = pass.filter(d => d.shape[k]).length;
      const hv = hit.filter(d => d.shape[k]).length;
      if (pv > 0 && hv === 0) diffs[k] = '放过独有';
      if (hv > 0 && pv === 0) diffs[k] = '命中独有';
    }
    const diffKeys = Object.keys(diffs);
    console.log('   ⮕ 形状差：' + (diffKeys.length ? diffKeys.map(k => k + '(' + diffs[k] + ')').join(' ') : '无 —— 两条形状等价，属判据强度缺口'));
  }
}
fs.writeFileSync(path.join(ROOT, 'data', 'round-353-shape-diff.json'), JSON.stringify(out, null, 2));
console.log('\n已写入 data/round-353-shape-diff.json');
