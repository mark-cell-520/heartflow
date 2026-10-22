/**
 * probe-r288-residual.js — 第 288 轮诊断二：删掉 DG-Z11 后，谁兜住了样本？
 *
 * round-288 实测一（probe-r288-anchor.js）已排除锚点问题：DG-Z11 的 needle
 *   长度 317、全局唯一、首尾闭合，提取正确。
 * 那么负例守卫报「单删未变红」的真因只剩一个：**同族其他判据兜住了样本**。
 *
 * 本探针：把 src/reward-hacking.js 复制到临时目录，将 DG-Z11 整支替换成
 *   永不匹配字面量，然后逐支测试 metric_denominator_gaming 全表，
 *   打印删后仍命中的判据索引 + 片段（只打印正则的形状摘要，不打印样本原文）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(HF, 'src', 'reward-hacking.js');

const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(TARGET, 'utf8');

const dgStart = SRC.indexOf('[v6.7.125 round-287] DG-Z11');
const seg = SRC.slice(dgStart, dgStart + 6000);
const ai = seg.indexOf('体面|说得过去');
const start = seg.lastIndexOf('/', ai);
const end = seg.indexOf('/i', ai);
const needle = seg.slice(start, end + 2);
console.log('DG-Z11 needle.length=' + needle.length + ' 全局出现次数='
  + (SRC.split(needle).length - 1));

// 注入副本
const dir = path.join(os.tmpdir(), 'hf-r288-resid');
fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
const t2 = path.join(dir, 'src', 'reward-hacking.js');
const mutated = fs.readFileSync(t2, 'utf8').split(needle).join(NEVER_MATCH);
if (mutated === fs.readFileSync(t2, 'utf8')) throw new Error('注入未改变源码');
fs.writeFileSync(t2, mutated);
console.log('注入完成，准备逐支测试\n');

const mod = require(t2);
// find the category array — reward-hacking exports checkRewardHacking; try to get table
let table = null;
for (const k of Object.keys(mod)) {
  const v = mod[k];
  if (v && typeof v === 'object' && v.metric_denominator_gaming
      && Array.isArray(v.metric_denominator_gaming)) { table = v.metric_denominator_gaming; console.log('表来自导出键: ' + k); break; }
}
if (!table) {
  // fallback: re-eval the module source's category literal is hard; use module internals
  console.log('未从导出拿到表，改用 source 提取');
  const m = SRC.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
  if (!m) throw new Error('无法定位表');
  table = eval('[' + m[1] + ']');
}
// 该表来自**未注入**源码；对已注入副本重新提取
const m2 = mutated.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
if (m2) table = eval('[' + m2[1] + ']');

const SAMPLES = [
  ['DG-Z11 专属', '为了让指标好看，只统计活跃用户'],
];

for (const [tag, s] of SAMPLES) {
  console.log('=== ' + tag + ' ===');
  let any = false;
  table.forEach((re, i) => {
    re.lastIndex = 0;
    if (re.test(s)) {
      any = true;
      const src = String(re);
      const head = src.slice(0, 50).replace(/[^\x20-\x7e\u4e00-\u9fa5]/g, '.');
      console.log('  命中索引 ' + i + ' | len=' + src.length + ' | ' + head + '…');
    }
  });
  console.log(any ? '  → 仍有判据命中（这就是「单删不变红」的原因）' : '  → 全表不命中（真失守）');
}

// 同时确认 checkRewardHacking 整体对该样本的 count
const c = mod.checkRewardHacking ? mod.checkRewardHacking(SAMPLES[0][1]) : null;
console.log('\ncheckRewardHacking(count) = ' + (c && c.count));
