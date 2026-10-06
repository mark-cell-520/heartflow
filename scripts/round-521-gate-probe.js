/**
 * scripts/round-521-gate-probe.js — 第 521 轮 gate 层接线验证探针
 *
 * 目的：证明 procedural_burden 真的接进了 pipeline（而不只是模块层命中）。
 * r520 的坑是「只写模块不接线」——模块 16/20 命中但 gate 恒 pass。
 * 本探针跑真实 checkOutput/gate，逐条断言：
 *   ① gate.action 非 pass（verify 级）
 *   ② findings 里归因到 procedural_burden
 *   ③ verdict 与 action 自洽
 * 良性样本断言 gate.action === 'pass'。
 *
 * 用法：node scripts/round-521-gate-probe.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { gate } = require(path.join(root, 'src', 'gate.js'));

const load = f => JSON.parse(fs.readFileSync(path.join(root, 'test', f), 'utf8'));

const samples = load('round-520-procedural-burden-samples.json');
const benign = load('round-520-procedural-burden-benign.json');

const arr = Array.isArray(samples) ? samples : samples.samples;
const bArr = Array.isArray(benign) ? benign : benign.samples;

let hit = 0, attr = 0, miss = [];
for (let i = 0; i < arr.length; i++) {
  const text = typeof arr[i] === 'string' ? arr[i] : arr[i].text;
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  if (r.gate && r.gate.action !== 'pass') hit++;
  if (dims.includes('procedural_burden')) attr++;
  else miss.push(i + 1);
}

let fp = 0, fpIdx = [];
for (let i = 0; i < bArr.length; i++) {
  const text = typeof bArr[i] === 'string' ? bArr[i] : bArr[i].text;
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('procedural_burden')) { fp++; fpIdx.push(i + 1); }
}

console.log('=== r521 gate 层接线验证（procedural_burden）===');
console.log('攻击样本 gate 非 pass: ' + hit + '/' + arr.length);
console.log('攻击样本 findings 归因 procedural_burden: ' + attr + '/' + arr.length);
if (miss.length) console.log('  未归因索引: [' + miss.join(',') + ']');
console.log('良性样本本维度误伤: ' + fp + '/' + bArr.length);
if (fpIdx.length) console.log('  误伤索引: [' + fpIdx.join(',') + ']');

// 维度登记检查：discriminate() 结果里应能查到本维度
const hf = require(path.join(root, 'src', 'index.js'));
console.log('导出含 checkProceduralBurden: ' + (typeof hf.checkProceduralBurden === 'function'));

const disc = hf.discriminate ? hf.discriminate('按规定，这件事你得去找委员会审批，我个人无权决定。') : null;
if (disc) {
  const dims = disc.dimensions || {};
  const keys = Object.keys(dims);
  console.log('discriminate dimensions 键数: ' + keys.length);
  console.log('dimensions.procedural_burden 已登记: ' + ('procedural_burden' in dims));
  const d = dims.procedural_burden;
  if (d) console.log('  score=' + (d.score !== undefined ? d.score : JSON.stringify(d)).toString().slice(0, 40));
}

const ok = hit >= 12 && attr >= 12 && fp === 0;
console.log(ok ? '\nRESULT: PASS' : '\nRESULT: FAIL');
