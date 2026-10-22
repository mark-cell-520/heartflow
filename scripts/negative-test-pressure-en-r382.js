// scripts/negative-test-pressure-en-r382.js
// r382 负例还原点：验证「注入-删条-必须变红」。
// 方法：原地备份 src/multi-turn-tactics.js → 注入删除/置空 → 在仓库根跑守卫
// 测试（不复制目录，避免 VERSION 等根文件缺失造成假红）→ git checkout 还原。
// 用法：node scripts/negative-test-pressure-en-r382.js
// 纪律：只打印 PASS/FAIL 与计数，不贴样本原文；样本全部驻留在 test/ 内。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_REL = 'src/multi-turn-tactics.js';
const SRC = path.join(ROOT, SRC_REL);
const TEST = 'test/pressure-family-en-r382.test.js';

function runGuard() {
  try {
    execFileSync(process.execPath, [TEST], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
    });
    return false; // 绿
  } catch (e) {
    return true; // 红
  }
}

function restore() {
  execFileSync('git', ['checkout', '--', SRC_REL], { cwd: ROOT, encoding: 'utf8' });
}

function blockOf(src, key) {
  const start = src.indexOf(`name: '${key}'`);
  if (start < 0) throw new Error('anchor not found: ' + key);
  const rest = src.slice(start);
  const nextName = rest.slice(10).search(/\{\s*name: '/);
  const end = nextName < 0 ? rest.length : 10 + nextName;
  return { start, end, block: src.slice(start, start + end) };
}

// 删英文支：删掉 re 里所有以源码文本 |\b 开头的英文支（含前导 |，
// 避免孤立 | 变恒真空分支，r381 教训）。用字符串切分而非嵌套正则，
// 因为源码文本里英文支的起点是稳定字面量 |\b（探针 probe-6 实测确认）。
function stripEnBranches(src, key) {
  const { start, end, block } = blockOf(src, key);
  const m = block.match(/re: \/\(\?:[\s\S]*?\/i/);
  if (!m) return null;
  let re = m[0];
  const before = re.length;
  // 从右往左逐个删除 |\b... 支（到下一个 | 或行尾为止）
  for (let i = 0; i < 80; i++) {
    const idx = re.indexOf('|\\b');
    if (idx < 0) break;
    let j = idx + 1;
    while (j < re.length && re[j] !== '|') j++;
    re = re.slice(0, idx) + re.slice(j);
  }
  if (re.length === before) return null;
  const mutated = block.replace(m[0], re);
  return src.slice(0, start) + mutated + src.slice(end);
}

// 置空 ladder：re 改成恒不匹配（比删支更猛）
function nullifyLadderRe(src, key) {
  const { start, end, block } = blockOf(src, key);
  const m = block.match(/re: \/\(\?:[\s\S]*?\/i/);
  if (!m) return null;
  const mutated = block.replace(m[0], 're: /(?!x)x/i');
  return src.slice(0, start) + mutated + src.slice(end);
}

// 删整个 ladder 条目（最大力度还原）
function dropLadder(src, key) {
  const { start, end } = blockOf(src, key);
  return src.slice(0, start) + src.slice(end);
}

const ORIGINAL = fs.readFileSync(SRC, 'utf8');
const results = [];
function report(key, expectRed, red, note) {
  const ok = note ? false : red === expectRed;
  results.push({ key, ok });
  console.log(JSON.stringify({ key, expect: expectRed ? 'RED' : 'GREEN', got: red ? 'RED' : 'GREEN', ok, note }));
}

try {
  // 1) 基线：未改动的 src 必须绿（证明守卫不是恒红）
  report('baseline', false, runGuard());

  // 2) 删英文支 × 3（每支一个还原点）
  const MUTATORS = [
    { key: 'authority_claim-strip', fn: stripEnBranches },
    { key: 'peer_pressure-strip', fn: stripEnBranches },
    { key: 'responsibility_shift-strip', fn: stripEnBranches },
    // 3) 置空 ladder × 2
    { key: 'authority_claim-null', fn: nullifyLadderRe },
    { key: 'peer_pressure-null', fn: nullifyLadderRe },
    // 4) 删整层 × 1
    { key: 'responsibility_shift-drop', fn: dropLadder },
  ];
  for (const mu of MUTATORS) {
    const target = mu.key.replace(/-(strip|null|drop)$/, '');
    const mutated = mu.fn(ORIGINAL, target);
    if (!mutated || mutated === ORIGINAL) {
      report(mu.key, true, null, '还原点未命中（anchor 需更新）');
      continue;
    }
    fs.writeFileSync(SRC, mutated);
    const red = runGuard();
    restore();
    report(mu.key, true, red);
  }
} finally {
  restore();
  // 最终校验：还原后必须与 git HEAD 完全一致（无残留改动）
  let clean = true;
  try {
    const diff = execFileSync('git', ['diff', '--stat', '--', SRC_REL], { cwd: ROOT, encoding: 'utf8' });
    clean = diff.trim().length === 0;
  } catch (e) {
    clean = false;
  }
  console.log(JSON.stringify({ restoredClean: clean }));
}

const passed = results.filter((r) => r.ok).length;
const total = results.length;
console.log(JSON.stringify({ total, passed, failed: total - passed }));
if (passed !== total) {
  console.error('NEGATIVE TEST FAILED');
  process.exit(1);
}
console.log('NEGATIVE TEST ALL GREEN');
