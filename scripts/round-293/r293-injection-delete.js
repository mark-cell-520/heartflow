#!/usr/bin/env node
/**
 * scripts/round-293/r293-injection-delete.js
 *
 * [r293] 注入-删条验证：逐支「删掉」本轮 16 个新模式（替换为永不命中的
 * /(?!)/i，保持数组语法合法，避免加载崩溃），断言轮测必须转红
 * （断言失败 ❌，而非 TypeError 崩溃）。
 *
 * 用法：node scripts/round-293/r293-injection-delete.js
 * 退出码：全部转红 → 0；有任一模式删后仍全绿 → 1（说明该模式不是承重墙）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PLUGIN = path.join(ROOT, 'src/plugins/sycophancy-check/index.js');
const TEST = path.join(ROOT, 'test/round-293-sycophancy-plugin-families.test.js');

const original = fs.readFileSync(PLUGIN, 'utf8');
const lines = original.split('\n');

// 定位本轮新模式行：含 _cooccur( 且带 r293-pNN 标记
const targets = [];
lines.forEach((line, i) => {
  const m = line.match(/\/\*\s*(r293-p\d+)\s*\*\//);
  if (m && line.includes('_cooccur(')) targets.push({ idx: i, id: m[1], line });
});

console.log(`[r293] 定位到 ${targets.length} 个新模式待注入删条`);
if (targets.length !== 16) {
  console.error(`[r293] 预期 16 个新模式，实得 ${targets.length} —— 标记与实现不同步，终止`);
  process.exit(1);
}

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

let red = 0;
const problems = [];
try {
  for (const t of targets) {
    // 把该行的 _cooccur(...) 整体替换为 /(?!)/i（永不匹配）
    const mutatedLine = t.line.replace(/_cooccur\(.*\)/, '/(?!)/i');
    if (mutatedLine === t.line) {
      problems.push(`${t.id}: 未能构造删条变体（替换未生效）`);
      continue;
    }
    const mutated = lines.slice();
    mutated[t.idx] = mutatedLine;
    fs.writeFileSync(PLUGIN, mutated.join('\n'));
    const r = runTest();
    const crashed = /TypeError|is not a function|Cannot read/.test(r.out);
    const hasFail = /❌/.test(r.out);
    if (r.code !== 0 && hasFail && !crashed) {
      red++;
      console.log(`  ✅ ${t.id} 删后转红（断言失败，非崩溃）`);
    } else {
      const why = crashed ? '加载/运行崩溃（不算断言变红）' : (r.code === 0 ? '仍全绿（模式非承重墙）' : `退出码 ${r.code} 但无 ❌ 断言`);
      problems.push(`${t.id}: ${why}`);
      console.log(`  ❌ ${t.id} ${why}`);
    }
    fs.writeFileSync(PLUGIN, original); // 立即还原
  }
} finally {
  fs.writeFileSync(PLUGIN, original);
}

// 终态校验：文件必须与改前逐字节一致
const after = fs.readFileSync(PLUGIN, 'utf8');
if (after !== original) {
  console.error('[r293] 严重：插件文件未还原到原始内容！');
  process.exit(1);
}

console.log(`\n[r293] 注入 ${targets.length} 个 → ${red} 个变红，${targets.length - red} 个未变红`);
if (problems.length) {
  console.error('[r293] 未变红清单：');
  for (const p of problems) console.error('   -', p);
  process.exit(1);
}
// 还原后再跑一次确认全绿
const final = runTest();
console.log(`[r293] 还原后轮测：${final.code === 0 ? '全绿 ✅' : '异常 ❌'}`);
process.exit(final.code === 0 ? 0 : 1);
