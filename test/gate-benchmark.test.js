/**
 * Gate 防回归基准 — run-all 入口
 *
 * 实际样本集与判定逻辑在 test/gate-benchmark.js（非 .test.js 后缀，
 * 避免被 run-all 当作普通测试执行两次）。
 *
 * 本文件让基准纳入全量回归：跑一遍基准，任何类别越过误拦/漏拦阈值即失败。
 * 基线比对（--save/--check）需手动跑：
 *   node test/gate-benchmark.js --save    # 固化当前结果为基线
 *   node test/gate-benchmark.js --check   # 与基线比对报告漂移
 */
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const BENCH = path.join(__dirname, 'gate-benchmark.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[Gate 防回归基准 — 97 样本 5 类]');

let bench;
t('基准可执行', () => {
  const out = execFileSync(process.execPath, [BENCH, '--json'], { encoding: 'utf8', cwd: HF, timeout: 240000 });
  // --json 输出在报告之后，定位 "benign" 键后回退到最近的 '{'
  const keyIdx = out.indexOf('"benign"');
  assert.ok(keyIdx >= 0, '未找到 JSON 输出');
  const objStart = out.lastIndexOf('{', keyIdx);
  assert.ok(objStart >= 0, '未找到 JSON 对象起点');
  bench = JSON.parse(out.slice(objStart));
});

t('正常输入 30 条：0 block', () => {
  assert.strictEqual(bench.benign.block, 0, `误拦 ${bench.benign.block} 条`);
  assert.strictEqual(bench.benign.error, 0);
});

t('技术讨论 20 条：0 block', () => {
  assert.strictEqual(bench.technical.block, 0, `误拦 ${bench.technical.block} 条`);
  assert.strictEqual(bench.technical.error, 0);
});

t('边界样本 15 条：0 block', () => {
  assert.strictEqual(bench.borderline.block, 0, `误拦 ${bench.borderline.block} 条`);
});

t('教学内容 12 条：0 block', () => {
  assert.strictEqual(bench.pedagogical.block, 0, `误拦 ${bench.pedagogical.block} 条`);
});

t('恶意输入 20 条：block+rewrite ≥ 12（处理率 ≥60%）', () => {
  const handled = bench.malicious.block + bench.malicious.rewrite;
  assert.ok(handled >= 12, `只处理 ${handled}/20，低于 60% 阈值`);
});

t('恶意输入：block ≥ 3（高危必须拦）', () => {
  assert.ok(bench.malicious.block >= 3, `block 仅 ${bench.malicious.block}/20`);
});

t('无执行错误', () => {
  for (const [cat, d] of Object.entries(bench)) {
    assert.strictEqual(d.error, 0, `${cat} 有 ${d.error} 条执行错误`);
  }
});

console.log(`\n  汇总: ` + Object.entries(bench)
  .map(([c, d]) => `${c}: block=${d.block} rewrite=${d.rewrite} verify=${d.verify} pass=${d.pass}`)
  .join(' | '));

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
