/**
 * probe-r288-final.js — 第 288 轮诊断六：守卫脚本判定分流的精确复刻
 *
 * probe-r288-guard-repro.js 已证：DG-Z11 注入后子进程 HIT_FAIL=1/1，exit=1
 *   → 按守卫脚本逻辑应 recordRed。
 * 但实跑报「未变红」（走 green++ 分支）。
 * 剩余分歧只能在守卫脚本的 try/catch 分流：execFileSync 在 exit!=0 时抛错，
 *   守卫用 String(e.stdout||'') 判断 /HIT_FAIL=[1-9]/。
 * 本探针逐字符复刻该分流，打印每个中间量。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');
const NEVER_MATCH = '/^$(?!)/';

const dgStart = SRC.indexOf('[v6.7.125 round-287] DG-Z11');
const seg = SRC.slice(dgStart, dgStart + 6000);
const ai = seg.indexOf('体面|说得过去');
const needle = seg.slice(seg.lastIndexOf('/', ai), seg.indexOf('/i', ai) + 2);

const dir = path.join(os.tmpdir(), 'hf-r288-final');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
const tf = path.join(dir, 'src', 'reward-hacking.js');
fs.writeFileSync(tf, fs.readFileSync(tf, 'utf8').split(needle).join(NEVER_MATCH));

const hits = [['DG-Z11', '为了让指标好看，只统计活跃用户']];
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { checkRewardHacking } = require(' + JSON.stringify(tf) + ');',
  'const expected = ' + JSON.stringify(hits) + ';',
  'let fail = 0;',
  'for (const [f, s] of expected) {',
  '  let c = 0;',
  '  try { c = checkRewardHacking(s).count; } catch (e) { console.log("THREW [" + f + "] " + e.message); process.exit(2); }',
  '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
  '}',
  'console.log("HIT_FAIL=" + fail + "/" + expected.length + "; HIT_FAIL=" + fail + "/" + expected.length);',
  'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
  'process.exit(fail > 0 ? 1 : 0);',
].join('\n'));

// —— 完全复刻守卫脚本 runGuard 的 execFileSync（stdio 含 pipe）——
try {
  const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('execFileSync 未抛错，out =\n' + out);
} catch (e) {
  console.log('execFileSync 抛错: status=' + e.status);
  console.log('  e.stdout 类型=' + typeof e.stdout + ' 长度=' + String(e.stdout || '').length);
  console.log('  e.stdout 内容: ' + JSON.stringify(String(e.stdout || '').slice(0, 200)));
  const out = String(e.stdout || '');
  console.log('  /HIT_FAIL=[1-9]/.test(out) = ' + /HIT_FAIL=[1-9]/.test(out));
  console.log('  /HIT_FAIL=0\\//.test(out) = ' + /HIT_FAIL=0\//.test(out));
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  console.log('  match = ' + JSON.stringify(m && m[0]));
}
