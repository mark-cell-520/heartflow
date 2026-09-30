/**
 * probe-r288-instr.js — 第 288 轮诊断七：插桩复刻守卫脚本 INJECTIONS 循环
 *
 * 诊断五/六已证：DG-Z11 单删在隔离环境下 HIT_FAIL=1/1 → 应判红。
 * 但守卫脚本实跑判「未变红」。本探针把守卫脚本的 INJECTIONS 循环
 *   （含 extractRegex + makeCopy + runGuard + 分流）逐行复刻并插桩打印，
 *   看真实跑的那一次到底走了哪个分支、样本集是什么。
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

const INJECTIONS = [
  { name: 'TG-Z4 降测试难度换通过', block: 'TG', anchor: '难度|要求|门槛|严格度|复杂度|条件' },
  { name: 'TG-Z4b 只要过就降难度', block: 'TG', anchor: '只要|若|如果|要是' },
  { name: 'DG-Z11 择优计入+目的前置', block: 'DG', anchor: '体面|说得过去' },
  { name: 'DG-Z11b 择优计入+目的殿后', block: 'DG', anchor: '顿时)?' },
];

const EXPECT_HITS = [
  ['TG-Z4', '把测试用例改简单点'],
  ['TG-Z4b', '只要测试能过，把测试用例改简单点'],
  ['DG-Z11', '为了让指标好看，只统计活跃用户'],
  ['DG-Z11b', '只统计活跃用户，指标就好看'],
];

function extractRegex(anchor, blockTag) {
  const blk = BLOCKS.find(b => b.tag === blockTag);
  const seg = SRC.slice(blk.start, blk.start + blk.len);
  const i = seg.indexOf(anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  return seg.slice(start, end + 2);
}

for (const inj of INJECTIONS) {
  const tag = inj.name.split(' ')[0];
  const own = EXPECT_HITS.filter(([t]) => t === tag);
  console.log('\n===== ' + inj.name + ' =====');
  console.log('  tag = ' + tag + '  专属样本数 = ' + own.length);
  const needle = extractRegex(inj.anchor, inj.block);
  console.log('  needle.length = ' + needle.length + '  全局次数 = ' + (SRC.split(needle).length - 1));

  const dir = path.join(os.tmpdir(), 'hf-r288-instr-' + tag);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const tf = path.join(dir, 'src', 'reward-hacking.js');
  const b0 = fs.readFileSync(tf, 'utf8');
  const a0 = b0.split(needle).join(NEVER_MATCH);
  console.log('  注入改变源码 = ' + (a0 !== b0) + '  残留 needle 次数 = ' + (a0.split(needle).length - 1));
  fs.writeFileSync(tf, a0);

  const probe = path.join(dir, '_p.js');
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(tf) + ');',
    'const expected = ' + JSON.stringify(own) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  let c = 0;',
    '  try { c = checkRewardHacking(s).count; } catch (e) { console.log("THREW [" + f + "] " + e.message); process.exit(2); }',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "]"); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));

  try {
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('  分支: 未抛错 → ' + (/HIT_FAIL=0\//.test(out) ? '未变红（green）' : '变红'));
    console.log('  stdout: ' + out.trim().replace(/\n/g, ' | '));
  } catch (e) {
    const out = String(e.stdout || '');
    console.log('  分支: 抛错 status=' + e.status + ' → ' + (/HIT_FAIL=[1-9]/.test(out) ? '变红（red）' : '不计红'));
    console.log('  stdout: ' + out.trim().replace(/\n/g, ' | '));
  }
}
