// [r373 negative-test] behavior 接线守卫的负例验证。
// 参照 scripts/negative-test-absolute-claim-en.js 的注入-删条-必须变红模式：
// 把 src/core/heartflow.js 里 r373 修的两处接线标识符逐个改回未声明形式，
// 守卫测试必须**变红**（assert 失败），不能是加载崩溃。
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src', 'core', 'heartflow.js');
const GUARD = 'round-373-behavior-layer-wiring.test.js';

// 每个注入：把 r373 的接线 mark 改回原始的未声明形式
const INJECTIONS = [
  {
    name: '删 behaviorTracker 局部声明（_behaviorTracker → behaviorTracker）',
    mark: 'const { behaviorTracker: _behaviorTracker } = require',
    mutate: s => s.replace('const { behaviorTracker: _behaviorTracker } = require', 'const { behaviorTracker: behaviorTracker } = require'),
  },
  {
    name: '删 patternDetector 局部声明（_patternDetector → patternDetector，全仓 0 声明）',
    mark: 'const _patternDetector = new (_PatternDetector().PatternDetector)();',
    mutate: s => s.replace('const _patternDetector = new (_PatternDetector().PatternDetector)();', 'const patternDetector = new (_PatternDetector().PatternDetector)();'),
  },
  {
    name: '删 require 参数路径（behavior-tracker.js 路径打错）',
    mark: "require('../behavior-tracker.js')",
    mutate: s => s.split('require(\'../behavior-tracker.js\')').join('require(\'../behavior-tracker-typo.js\')'),
  },
];

const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

function runGuard(root) {
  try {
    const out = execFileSync('node', [path.join(root, 'test', GUARD)], { encoding: 'utf8', timeout: 60000 });
    return { failed: /失败, [1-9]/.test(out) || /FAILED/.test(out), out };
  } catch (e) {
    // 非零退出码 = 守卫失败（变红）
    return { failed: true, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function buildSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg-373-'));
  // 只拷 src/、test/ 两个必需目录（守卫只 require 这两个）
  fs.cpSync(path.join(HF, 'src'), path.join(root, 'src'), { recursive: true });
  fs.cpSync(path.join(HF, 'test'), path.join(root, 'test'), { recursive: true });
  return root;
}

let allRed = true;
for (const inj of INJECTIONS) {
  if (!SRC_TEXT.includes(inj.mark)) {
    console.log(`注入未生效（mark 不在源码里）: ${inj.name} → 判未变红（假阴性）`);
    allRed = false;
    continue;
  }
  const root = buildSandbox();
  const f = path.join(root, 'src', 'core', 'heartflow.js');
  const mutated = inj.mutate(fs.readFileSync(f, 'utf8'));
  if (mutated === fs.readFileSync(f, 'utf8')) {
    console.log(`注入未改变源码: ${inj.name} → 判未变红`);
    allRed = false;
    fs.rmSync(root, { recursive: true, force: true });
    continue;
  }
  fs.writeFileSync(f, mutated);
  const r = runGuard(root);
  console.log(`${r.failed ? '✅ 变红' : '❌ 未变红'} : ${inj.name}`);
  if (!r.failed) allRed = false;
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(allRed ? '\n全部注入均变红 — 守卫有效' : '\n存在未变红注入 — 守卫有假阴性');
process.exitCode = allRed ? 0 : 1;
