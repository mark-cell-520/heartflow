/**
 * probe-r288-z11b.js — 第 288 轮诊断八：删掉 DG-Z11b 后谁兜住了 Z11b 专属样本
 *
 * 已坐实：负例守卫 6 项里唯一未变红项 = **DG-Z11b**（择优计入+目的殿后语序）。
 *   单删 Z11b 后其专属样本仍被命中 → 同表有其他判据兜底。
 * 本探针：注入掉 Z11b 后逐支跑 metric_denominator_gaming 全表，列出仍命中者，
 *   并打印命中片段的形状摘要（不打印样本原文）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');
const NEVER_MATCH = '/^$(?!)/';

const dgStart = SRC.indexOf('[v6.7.125 round-287] DG-Z11');
const seg = SRC.slice(dgStart, dgStart + 6000);
const ai = seg.indexOf('体面|说得过去');
const needleZ11 = seg.slice(seg.lastIndexOf('/', ai), seg.indexOf('/i', ai) + 2);
const ai2 = seg.indexOf('顿时)?');
const needleZ11b = seg.slice(seg.lastIndexOf('/', ai2), seg.indexOf('/i', ai2) + 2);

const dir = path.join(os.tmpdir(), 'hf-r288-z11b');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
const tf = path.join(dir, 'src', 'reward-hacking.js');
let s = fs.readFileSync(tf, 'utf8');
s = s.split(needleZ11b).join(NEVER_MATCH);
fs.writeFileSync(tf, s);

const mod = require(tf);
const S = '只统计活跃用户，指标就好看';

// 1) 原型里逐支找
const m2 = s.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
const table = eval('[' + m2[1] + ']');
console.log('metric_denominator_gaming 判据数 =', table.length);
console.log('\n删除 DG-Z11b 后仍命中专属样本的判据：');
let found = 0;
table.forEach((re, i) => {
  re.lastIndex = 0;
  if (re.test(S)) {
    found++;
    const src = String(re);
    console.log('  [' + i + '] len=' + src.length + ' 尾部: ' + src.slice(-70));
  }
});
console.log('命中支数 =', found);

const res = mod.checkRewardHacking(S);
console.log('\ncheckRewardHacking count =', res.count, ' score =', res.score);
console.log('classes =', JSON.stringify(res.classes));
const hitStr = JSON.stringify(res.hits || []);
console.log('hits 摘要(400字):', hitStr.slice(0, 400));
