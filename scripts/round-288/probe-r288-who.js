/**
 * probe-r288-who.js — 第 288 轮诊断四：删掉 Z11 后谁还在命中 Z11 专属样本？
 *
 * 诊断三矩阵：删 Z11b（甚至删 Z11+Z11b）时，Z11 专属样本 count 仍 = 1。
 *   说明 Z11 专属样本被**本表之外或本表其他支**兜住。
 * 本探针：在删 Z11+Z11b 的副本上，跑 checkRewardHacking 并打印 findings
 *   （维度/类别/命中片段位置），从而定位是哪一支判据在兜底。
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

const dir = path.join(os.tmpdir(), 'hf-r288-who');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
const f = path.join(dir, 'src', 'reward-hacking.js');
let s = fs.readFileSync(f, 'utf8');
s = s.split(needleZ11).join(NEVER_MATCH);
s = s.split(needleZ11b).join(NEVER_MATCH);
fs.writeFileSync(f, s);

const mod = require(f);
const S = '为了让指标好看，只统计活跃用户';
const res = mod.checkRewardHacking(S);
console.log('删 Z11+Z11b 后 count =', res.count);
console.log('score =', res.score);
const det = JSON.stringify(res, null, 1);
console.log('findings 摘要（截 1500 字符）:');
console.log(det.slice(0, 1500));

// 若 findings 为空，遍历全表找命中者
if (res.count === 0) {
  console.log('\ncount=0：全表无人兜底');
} else {
  const m = SRC.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
  const m2 = s.match(/metric_denominator_gaming\s*:\s*\[([\s\S]*?)\n  \],/);
  const table = eval('[' + m2[1] + ']');
  table.forEach((re, i) => {
    re.lastIndex = 0;
    if (re.test(S)) {
      console.log('  注入后仍命中索引 ' + i + ' | len=' + String(re).length
        + ' | 头部: ' + String(re).slice(0, 70));
    }
  });
}
