// [v6.7.130 第 299 轮] negative-test：ppf-en-ontological-r299 注入-删条验证
// 目标：证明 test/doubt-ppf-en-ontological-r299.test.js 不是空跑——
// 把 E1/E2 两条新判据抽走，正例断言必须变红。
// 以下是原 'use strict' 头部与常量定义（注入删条逻辑见文件后半）
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const BACKUP = path.join(ROOT, '.round299-index-backup.js');
const HARNESS = path.join(ROOT, 'scripts/round-299/probe-20-neg-harness.js');
const EN_ANCHOR = '    // E1 — 伪辩证';

// 收集式断言：不中断，跑完 4 组再统计，确保「删判据」同时被 E1 组与 E2 组捕获。
const results = [];
function checkGroup(name, actual, expect) {
  const ok = actual === expect;
  results.push({ name, actual, expect, ok });
}
// 以下 4 组样本已移入子进程探针 scripts/round-299/probe-20-neg-harness.js
// （主脚本与探针不再各自持一份，避免两处样本漂移）。
const PLACEHOLDER_SAMPLES = [];
function ppf(t) {
  // 走子进程探针，确保每次探测都读到磁盘最新代码（进程内 require.cache
  // 清理不可靠：gate.js → index.js 的相对路径 key 与 join 结果不一致，
  // 实测删条后仍读到旧模块，probe-20 踩过这个坑）。
  const out = execFileSync('node', [HARNESS], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  const m = JSON.parse(out.trim().split('\n').pop());
  checkGroup('E1 伪辩证真阳', m.pd, m.pdTotal);
  checkGroup('E2 跨域比喻真阳', m.met, m.metTotal);
  checkGroup('工程归因真阴', m.fpEng, 0);
  checkGroup('普通陈述真阴', m.fpPlain, 0);
}
function measure() { ppf(); }

console.log('=== 0) 基线 ===');
measure();
results.forEach(r => console.log('  ' + (r.ok ? '✅' : '❌') + ' ' + r.name + ' = ' + r.actual + '/' + r.expect));
if (results.some(r => !r.ok)) { console.log('基线即有红，约定外，退出'); process.exit(1); }

console.log('=== 1) 注入删条：移除 E1/E2 两条 EN 判据 ===');
const original = fs.readFileSync(SRC, 'utf8');
try {
  fs.copyFileSync(SRC, BACKUP);
  const start = original.indexOf(EN_ANCHOR);
  if (start === -1) throw new Error('找不到 E1 注释锚点');
  const end = original.indexOf('\n  ],\n};', start);
  if (end === -1) throw new Error('找不到 en 数组结束锚点');
  fs.writeFileSync(SRC, original.slice(0, start) + original.slice(end + 1));
  console.log('已注入（删除 E1/E2 两族），重跑四组探测');
  results.length = 0;
  measure();
  results.forEach(r => console.log('  ' + (r.ok ? '⚠️ 仍绿' : '🔴 变红') + ' ' + r.name + ' = ' + r.actual + '/' + r.expect));
  const reds = results.filter(r => !r.ok);
  // 删条后必须至少 2 组变红（E1 + E2 两条判据都在），且不得出现新增误伤
  const newFp = results[2].actual > 0 || results[3].actual > 0;
  if (reds.length < 2) { console.log('❌ 变红组数 <2（' + reds.length + '），守卫覆盖面不足'); process.exit(1); }
  if (newFp) { console.log('❌ 删条后误伤组变红，样本口径有问题'); process.exit(1); }
  console.log('✅ 守卫生效：删条后 ' + reds.length + ' 组变红（' + reds.map(r => r.name).join('、') + '），误伤组未新增');
} finally {
  console.log('=== 2) 移除注入，恢复原状 ===');
  fs.copyFileSync(BACKUP, SRC);
  fs.unlinkSync(BACKUP);
}
results.length = 0;
measure();
const restoredOk = results.every(r => r.ok);
results.forEach(r => console.log('  ' + (r.ok ? '✅' : '❌') + ' ' + r.name + ' = ' + r.actual + '/' + r.expect));
if (!restoredOk) { console.log('❌ 恢复后未全绿，备份/恢复流程有问题'); process.exit(1); }
console.log('✅ 注入-删条验证通过：基线绿 → 删判据红 → 恢复绿');

