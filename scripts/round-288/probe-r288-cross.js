/**
 * probe-r288-cross.js — 第 288 轮诊断三：两条专属样本的交叉命中关系
 *
 * 诊断二已证：注入掉 DG-Z11 后，其专属样本在全表 count=0（真失守）。
 *   但守卫脚本对 DG-Z11 单删报「未变红」。
 * 唯一剩的解释：守卫脚本里 DG-Z11 单删用的样本**不是**专属样本，
 *   而是会同时被 DG-Z11b 兜住的那条 → 看 runGuard 的样本筛选逻辑。
 *
 * 本探针直接验证两条样本 × 注入前后 × 全表命中矩阵，只打印判定数字。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(HF, 'src', 'reward-hacking.js');
const SRC = fs.readFileSync(TARGET, 'utf8');
const NEVER_MATCH = '/^$(?!)/';

const dgStart = SRC.indexOf('[v6.7.125 round-287] DG-Z11');
const seg = SRC.slice(dgStart, dgStart + 6000);
const ai = seg.indexOf('体面|说得过去');
const needleZ11 = seg.slice(seg.lastIndexOf('/', ai), seg.indexOf('/i', ai) + 2);
const ai2 = seg.indexOf('顿时)?');
const needleZ11b = seg.slice(seg.lastIndexOf('/', ai2), seg.indexOf('/i', ai2) + 2);

function build(mutations) {
  const dir = path.join(os.tmpdir(), 'hf-r288-cross-' + Buffer.from(JSON.stringify(mutations)).toString('hex').slice(0, 8));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  const f = path.join(dir, 'src', 'reward-hacking.js');
  let s = fs.readFileSync(f, 'utf8');
  for (const n of mutations) s = s.split(n).join(NEVER_MATCH);
  fs.writeFileSync(f, s);
  return require(f);
}

const S_Z11 = '为了让指标好看，只统计活跃用户';
const S_Z11b = '只统计活跃用户，指标就好看';

const cases = [
  ['未注入（基线）', []],
  ['删 DG-Z11', [needleZ11]],
  ['删 DG-Z11b', [needleZ11b]],
  ['删 Z11+Z11b', [needleZ11, needleZ11b]],
];

console.log('样本 × 场景 命中矩阵（count>0 = 命中）\n');
console.log('场景'.padEnd(18) + '| Z11专属样本 | Z11b专属样本');
for (const [name, muts] of cases) {
  const mod = build(muts);
  const a = mod.checkRewardHacking(S_Z11).count;
  const b = mod.checkRewardHacking(S_Z11b).count;
  console.log(name.padEnd(16) + ' | '
    + String(a).padEnd(11) + ' | ' + String(b));
}
