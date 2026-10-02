/**
 * r378/r379 负例守卫：验证 test/round-378-dimension-coverage-midstate.test.js 真的在守门
 *
 * 方法论沿用 rounds/negative-test-absolute-claim-en.js：逐个把本轮改动还原，
 * 断言对应测试必须变红。**守卫不被触发就不是守卫。**
 *
 * 契约演进（守卫锚点随之两次变更，改源码前先读这里）：
 *   r378 v1：mte 登记进 dimensions/summary → 三处还原点（删登记/断透传/删 recognized）
 *   r378 v2 → r379 定稿：dimensions 方案被 revert（键数 57→58 打破文档契约），
 *     改为顶层 dimensionRaw 记账 + 扫描器兜底读 + summary 中间态文案。
 *     本轮守卫四还原点：
 *     ① 删 src/index.js 的 dimensionRaw 记账      → 「可从 discriminate() 读到」必须红
 *     ② 删 src/pipeline.js 的 dimensionRaw 透传   → 「checkOutput 路径」必须红
 *     ③ 删 src/index.js 的 summary 中间态文案      → 「中间态有 summary 文案」必须红
 *     ④ 还原扫描器（旁路 dimensionRaw 兜底）       → 「扫描器兜底不空转」必须红
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(ROOT, 'src/index.js');
const PIPE = path.join(ROOT, 'src/pipeline.js');
const SCAN = path.join(ROOT, 'scripts', 'dimension-coverage-scan.js');
const TEST = 'test/round-378-dimension-coverage-midstate.test.js';
const SCANRUN = path.join(ROOT, 'scripts', 'dimension-coverage-scan.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 前提：未改动的树上，r378 测试必须全绿 ──
// 测试文件是 mount 风格（module.exports = function({test})），必须走 _mount.js
const MOUNT = path.join(ROOT, 'test/_mount.js');
function runTest() {
  const r = spawnSync('node', [MOUNT, TEST], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

t('基线：r378 测试在未改动树上全绿', () => {
  const r = runTest();
  assert.strictEqual(r.status, 0, '基线就不是绿的，先定位：\n' + r.out.slice(-800));
  // 防死代码：确认它真的在跑（有测试用例行输出）
  assert.ok(/中间态/.test(r.out) && /✓/.test(r.out), '测试无用例行输出——可能根本没执行');
});

function restore(file, orig, tag) {
  fs.writeFileSync(file, orig);
  // 还原后必须恢复绿（防守卫把自己的树留坏）
  const r = runTest();
  if (r.status !== 0) {
    console.log(`  ⚠️ 还原 ${tag} 后测试仍红：\n` + r.out.slice(-500));
  }
  return r;
}

// ── 还原点 ①：删 index.js 的 dimensionRaw 记账 ──
t('删 src/index.js dimensionRaw 记账 → 测试必须红灯', () => {
  const orig = fs.readFileSync(IDX, 'utf8');
  try {
    const anchor = '    dimensionRaw: _multiturn';
    assert.ok(orig.includes(anchor), '找不到 dimensionRaw 记账锚点（源码变了？需更新本守卫）');
    // 只把字段值换成 null：保留字段存在性，破坏的是「count>0 可读」这条契约
    fs.writeFileSync(IDX, orig.replace(anchor, '    dimensionRaw: null && _multiturn'));
    const r = runTest();
    assert.strictEqual(r.status, 1, '删了记账测试仍绿——守卫是死代码');
    assert.ok(/dimensionRaw/.test(r.out), '报红但没点名 dimensionRaw');
  } finally { restore(IDX, orig, 'index.js'); }
});

// ── 还原点 ②：删 pipeline 的 dimensionRaw 透传 ──
t('删 src/pipeline.js dimensionRaw 透传 → 测试必须红灯', () => {
  const orig = fs.readFileSync(PIPE, 'utf8');
  try {
    const anchor = '  if (discResult.dimensionRaw) data.discriminate.dimensionRaw = discResult.dimensionRaw;\n';
    assert.ok(orig.includes(anchor), '找不到透传锚点（源码变了？需更新本守卫）');
    fs.writeFileSync(PIPE, orig.replace(anchor, ''));
    const r = runTest();
    assert.strictEqual(r.status, 1, '删了透传测试仍绿——守卫是死代码');
    assert.ok(/checkOutput 路径/.test(r.out), '报红但没点名是 checkOutput 路径');
  } finally { restore(PIPE, orig, 'pipeline.js'); }
});

// ── 还原点 ③：删 summary 中间态文案 ──
t('删 src/index.js summary 中间态文案 → 测试必须红灯', () => {
  const orig = fs.readFileSync(IDX, 'utf8');
  try {
    const anchor = "        ? _multiturn.count + ' 处多轮累积(未达闸门阈值)' : '',";
    assert.ok(orig.includes(anchor), '找不到 summary 文案锚点（源码变了？需更新本守卫）');
    fs.writeFileSync(IDX, orig.replace(anchor, ''));
    const r = runTest();
    assert.strictEqual(r.status, 1, '删了文案测试仍绿——守卫是死代码');
    assert.ok(/summary/.test(r.out), '报红但没点名是 summary');
  } finally { restore(IDX, orig, 'index.js summary'); }
});

// ── 还原点 ④：扫描器旁路 dimensionRaw 兜底 → held 退化 blind ──
t('旁路扫描器 dimensionRaw 兜底 → blind/held 判读必须失效', () => {
  const orig = fs.readFileSync(SCANRUN, 'utf8');
  try {
    // 还原成改动前形态：把 dimensionRaw 兜底置空，扫描器回到只读 dimensions
    // （57 键无 mte 键）→ recognized=0 → kind=blind，held 档空转。
    const patched = orig.replace(
      "      const dimRaw = r.dimensionRaw\n        || (r.data && r.data.discriminate && r.data.discriminate.dimensionRaw)\n        || null;",
      '      const dimRaw = null;');
    if (patched === orig) throw new Error('dimensionRaw 兜底锚点未命中（源码变了？需更新本守卫）');
    fs.writeFileSync(SCANRUN, patched);
    const r = spawnSync('node', [SCANRUN], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    assert.strictEqual(r.status, 0, '扫描器本身跑不过：\n' + ((r.stdout || '') + (r.stderr || '')).slice(-400));
    const out = r.stdout || '';
    // 兜底失效的表现：输出说「引擎侧也未识别（真盲区）」
    assert.ok(/引擎侧也未识别/.test(out), '旁路了兜底仍报「已识别」——recognized 从别处拿到计数？');
    // 并且数据文件 blind 非空、held 空
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/dimension-coverage.json'), 'utf8'));
    assert.ok(j.blind && j.blind.length > 0, 'blind 为空——中间态判读没被还原');
    assert.ok(!j.held || j.held.length === 0, 'held 非空——中间态仍在报');
  } finally {
    fs.writeFileSync(SCANRUN, orig);
    spawnSync('node', [SCANRUN], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
