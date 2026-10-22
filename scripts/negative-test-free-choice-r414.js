/**
 * scripts/negative-test-free-choice-r414.js
 * 第 414 轮负例验证：证明 round-414-free-choice-trap-en.test.js 不是恒绿守卫。
 *
 * 做法：把 src/index.js 里本轮新增的两条 free_choice_trap 判据（en + zh）
 * 整条删掉（改成永不匹配的 /(?!x)x/），跑守卫测试必须变红。
 *
 * r413 踩坑复现防护：**不手写含 \b \s 的锚点字符串**——那会命中注释里的例句。
 * 这里改用按行结构化提取：只在 DOUBLE_BIND_PATTERNS.zh / .en 数组成员区间内
 * 找「type 标记等于 free_choice_trap」的整行，按行号删除。
 *
 * 用法：
 *   node scripts/negative-test-free-choice-r414.js            # 对照 + 变异
 *   node scripts/negative-test-free-choice-r414.js --mutate   # 只跑变异
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const TEST = path.join(ROOT, 'test/round-414-free-choice-trap-en.test.js');
const BACKUP = path.join(ROOT, '.negative-backup-r414.js');

const onlyMutate = process.argv.includes('--mutate');

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { green: true, out };
  } catch (e) {
    return { green: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// ── 按行结构化定位 free_choice_trap 判据行 ──────────────────────
function locatePatternLines(lines) {
  // 判据行特征：一整行以空白 + '[/' 或 '[/' 开头，且行内含 "'free_choice_trap'],"
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\[.*'free_choice_trap'\],?\s*$/.test(lines[i])) hits.push(i);
  }
  return hits;
}

// ── 变异：把判据行替换为永不匹配的占位 ─────────────────────────
function mutate(fileLines) {
  const lines = fileLines.slice();
  const targets = locatePatternLines(lines);
  if (targets.length === 0) {
    throw new Error('未定位到任何 free_choice_trap 判据行——锚点失效，拒绝继续（防假阴性）');
  }
  for (const ln of targets) {
    const indent = lines[ln].match(/^\s*/)[0];
    lines[ln] = `${indent}[/__disabled_by_negative_test__/, 'free_choice_trap'],`;
  }
  return { lines, mutatedCount: targets.length };
}

let ok = true;

try {
  const original = fs.readFileSync(SRC, 'utf8');

  if (!onlyMutate) {
    // ① 对照：未变异时必须绿
    const ctl = runTest();
    console.log(`[对照] 守卫测试: ${ctl.green ? '✅ 绿' : '❌ 红（未变异就红=守卫本身坏）'}`);
    if (!ctl.green) { console.log(ctl.out.split('\n').slice(-12).join('\n')); ok = false; }
  }

  // ② 变异：删掉新增判据
  fs.writeFileSync(BACKUP, original, 'utf8');
  const origLines = original.split('\n');
  const { lines: mutLines, mutatedCount } = mutate(origLines);
  fs.writeFileSync(SRC, mutLines.join('\n'), 'utf8');
  console.log(`[变异] 已替换 ${mutatedCount} 条 free_choice_trap 判据为永不匹配占位`);

  // ③ 变异后必须红
  const mut = runTest();
  console.log(`[变异] 守卫测试: ${mut.green ? '❌ 仍绿（守卫失效！）' : '✅ 红（守卫有效）'}`);
  if (mut.green) ok = false;
  else {
    const failLines = mut.out.split('\n').filter(l => l.includes('passed,') || l.includes('❌'));
    console.log('        失败摘要: ' + (failLines.join(' | ').slice(0, 400) || '(见测试输出)'));
    const missed = mut.out.match(/漏判 \d+ 条|异常 \d+ 条/g);
    if (missed) console.log('        命中缺口: ' + missed.join(', '));
  }
} finally {
  // ④ 无论如何还原
  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, SRC);
    fs.unlinkSync(BACKUP);
    console.log('[还原] src/index.js 已还原');
  }
}

// ⑤ 还原后复跑必须回到绿（证明还原干净）
if (ok) {
  const after = runTest();
  console.log(`[还原后] 守卫测试: ${after.green ? '✅ 绿' : '❌ 红（还原不干净！）'}`);
  if (!after.green) ok = false;
}

console.log('\n' + (ok ? '✅ 负例验证通过：守卫有效、还原干净' : '❌ 负例验证失败'));
process.exit(ok ? 0 : 1);
