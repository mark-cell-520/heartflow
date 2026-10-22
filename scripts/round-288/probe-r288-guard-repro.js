/**
 * probe-r288-guard-repro.js — 第 288 轮诊断五：复刻守卫脚本路径，最小复现 DG-Z11
 *
 * 目的：negative-test-rh-zh-round287.js 报 DG-Z11 单删「未变红」，
 *   但 probe-r288-who.js（同注入、独立进程）证明注入后该支专属样本 count=0（真失守）。
 *   两者矛盾 → 复刻守卫脚本的 makeCopy + extractRegex + runGuard 三步，
 *   打印每一步的中间量，找出分歧点。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(HF, 'src', 'reward-hacking.js');
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(TARGET, 'utf8');

const BLOCKS = [
  { tag: 'TG', start: SRC.indexOf('[v6.7.125 round-287] TG-Z4'), len: 6000 },
  { tag: 'DG', start: SRC.indexOf('[v6.7.125 round-287] DG-Z11'), len: 6000 },
];

function extractRegex(anchor, blockTag) {
  const blk = BLOCKS.find(b => b.tag === blockTag);
  const seg = SRC.slice(blk.start, blk.start + blk.len);
  const i = seg.indexOf(anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  return seg.slice(start, end + 2);
}

const anchor = '体面|说得过去';
const needle = extractRegex(anchor, 'DG');
console.log('[1] needle.length =', needle.length);

const dir = path.join(os.tmpdir(), 'hf-r288-repro');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });

const target = path.join(dir, 'src', 'reward-hacking.js');
const before = fs.readFileSync(target, 'utf8');
const after = before.split(needle).join(NEVER_MATCH);
console.log('[2] 注入是否改变源码 =', after !== before);
console.log('[3] 副本中 needle 残留次数 =', after.split(needle).length - 1);
fs.writeFileSync(target, after);

// 关键：本进程 require 副本 vs 子进程 require 副本，分别测
const hits = [['DG-Z11', '为了让指标好看，只统计活跃用户']];
const inProc = require(target);
console.log('[4] 本进程 require 副本 count =', inProc.checkRewardHacking(hits[0][1]).count);

const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { checkRewardHacking } = require(' + JSON.stringify(target) + ');',
  'let fail = 0;',
  'for (const [f, s] of ' + JSON.stringify(hits) + ') {',
  '  const c = checkRewardHacking(s).count;',
  '  console.log("PROBE " + f + " count=" + c);',
  '  if (c === 0) fail++;',
  '}',
  'console.log("HIT_FAIL=" + fail + "/" + ' + JSON.stringify(hits) + '.length);',
  'process.exit(fail > 0 ? 1 : 0);',
].join('\n'));

try {
  const out = execFileSync(process.execPath, [probe], { encoding: 'utf8' });
  console.log('[5] 子进程 stdout:\n' + out.trim());
} catch (e) {
  console.log('[5] 子进程 exit=' + e.status + ' stdout:\n' + String(e.stdout || '').trim());
}

// 对照：本进程 require **原始** HF 的 reward-hacking.js
const orig = require(TARGET);
console.log('[6] 本进程 require 原始仓库 count =', orig.checkRewardHacking(hits[0][1]).count);
