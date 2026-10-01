/**
 * 负例守卫（第 367 轮）：第 ⑭ 支「无机制归因对象 × 合并结果表」判据删条必须变红。
 *
 * 机制：复制整仓 src/ 到临时目录 → 从 PC_CAUSAL_ZH_PATS 里删除第 ⑭ 支 →
 * 在沙箱副本里跑 round-346 主测试 → 必须失守（部分样本回到 pass）。
 * 若删条后守卫反而全绿，说明守卫没有真正钉在这条判据上。
 *
 * 用法：node test/round-367-pseudo-causal-resjoin-guard.js
 * 参考实现：test/round-346-pseudo-causal-luck-attribution-zh-guard.js（同型）
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg367-'));

// ── 1. 复制整仓（只复制判定必需的部分，避免 node_modules 拖时间）──
for (const rel of ['src', 'test', 'data', 'package.json', 'VERSION']) {
  const from = path.join(REPO, rel);
  const to = path.join(SANDBOX, rel);
  if (!fs.existsSync(from)) continue;
  if (fs.statSync(from).isDirectory()) {
    cp.execSync(`cp -r ${JSON.stringify(from)} ${JSON.stringify(to)}`);
  } else {
    fs.copyFileSync(from, to);
  }
}

// ── 2. 在沙箱副本里删除第 ⑭ 支（只删 RegExp 行，注释放任）──
// 标记必须唯一定位第 ⑭ 支：PC_RESJOIN_ZH 是第 367 轮新增常量，只被本支引用。
const idxPath = path.join(SANDBOX, 'src', 'index.js');
const src = fs.readFileSync(idxPath, 'utf8');
const marker = 'new RegExp(PC_NOOBJ_ZH.source + \'[^。]{0,44}?\' + PC_RESJOIN_ZH.source),';
const occurrences = src.split(marker).length - 1;
if (occurrences !== 1) {
  console.error('❌ 第 ⑭ 支判据标记出现 ' + occurrences + ' 次（预期 1），守卫无效');
  process.exit(1);
}
const idx = src.indexOf(marker);
const lineEnd = src.indexOf('\n', idx);
const patched = src.slice(0, idx) + '/* [负例守卫] 第 ⑭ 支已删除 */' + src.slice(lineEnd);
fs.writeFileSync(idxPath, patched);

// ── 3. 在沙箱里跑主测试，必须失守 ──
let out = '';
let code = 0;
try {
  out = cp.execSync(`node ${JSON.stringify(path.join(SANDBOX, 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js'))} 2>&1`, { encoding: 'utf8' });
} catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status || 1; }

// ── 4. 断言：删条后必须至少一条攻击断言变红 ──
const redLines = out.split('\n').filter(l => l.includes('❌'));
const missMatch = /漏判 (\d+) 条/.exec(out);

console.log('── 负例守卫（删第 ⑭ 支后重跑主测试）──');
console.log('退出码(子测试): ' + code);
console.log('变红断言条数: ' + redLines.length);
// 纪律：不打印子测试 stdout 里的样本原文（451 防审查纪律），只报计数。

let ok = false;
if (code !== 0 && (redLines.length > 0 || missMatch)) {
  ok = true;
}

console.log(ok
  ? '✅ 守卫有效：删除第 ⑭ 支后测试变红（守卫钉在判据上）'
  : '❌ 守卫失效：删除第 ⑭ 支后测试仍全绿 —— 守卫没有真正钉住该判据');

// 清理
try { cp.execSync(`rm -rf ${JSON.stringify(SANDBOX)}`); } catch (e) { /* 忽略 */ }
process.exit(ok ? 0 : 1);
