/**
 * r608/r609 守卫测试：forgettingEngine dispatch 接线
 *
 * 覆盖：接线面 / 辨别力 / 删块注入负例 / 稳健性（r608 修掉的 getField 缺陷不得回归）
 * 纪律：样本只以形状描述，不贴攻击话术原文；本测试不含任何攻击样本。
 *
 * 背景（r608 实测，非简报描述）：
 *   ForgettingEngine 实例在 src/core/heartflow.js L1602 一直在构造，但从未进 _modules。
 *   r608 双向核对：_modules 无 'forgettingEngine' 键（147 键里 0 命中）、
 *   ALLOWED_ROUTES 0 条命中、dispatch('forgettingEngine.*') 全抛 route not allowed。
 *   → 「记忆遗忘曲线引擎（checkForget 应否遗忘 / 引用计数保护 / detectOscillation
 *      三型震荡 / ebbinghausRetention 保留率）」此前 pipeline 完全不可达。
 *   r608 接线在 src/core/heartflow.js L3088；同轮修 memory/forgetting.js 的
 *   isReferenceProtected 调用未定义 getField（ReferenceError）——该 bug 接线前不可达。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + ' :: ' + e.message); }
}

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}
function allows(h) { return Array.from(h.constructor.ALLOWED_ROUTES || []); }

console.log('\n=== 第一组：接线面 ===');
const hf = freshHF();
t('A1 ALLOWED_ROUTES 命中 16 条', () => {
  const r = allows(hf).filter(x => x.startsWith('forgettingEngine.'));
  assert.strictEqual(r.length, 16, '期望 16 条, 实得 ' + r.length);
});
t('A2 _modules 有 forgettingEngine 键', () => {
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'forgettingEngine'));
});
t('A3 实例同一性（_modules 值就是引擎构造的实例）', () => {
  assert.strictEqual(hf._modules['forgettingEngine'], hf.forgettingEngine);
});
t('A4 routes() 不含 _ 前缀私有方法', () => {
  for (const x of allows(hf).filter(x => x.startsWith('forgettingEngine.'))) {
    assert.ok(!/\._[a-zA-Z]/.test(x), '泄露私有方法路由: ' + x);
  }
});
t('A5 路由全集等于预期 16 个公开方法', () => {
  const r = allows(hf).filter(x => x.startsWith('forgettingEngine.')).sort();
  const expect = [
    'forgettingEngine.abstract',
    'forgettingEngine.checkForget',
    'forgettingEngine.compress',
    'forgettingEngine.compressBatch',
    'forgettingEngine.consolidate',
    'forgettingEngine.consolidateBatch',
    'forgettingEngine.detectOscillation',
    'forgettingEngine.ebbinghausRetention',
    'forgettingEngine.getConfig',
    'forgettingEngine.getForgettingProbability',
    'forgettingEngine.getLevel',
    'forgettingEngine.getStats',
    'forgettingEngine.healthCheck',
    'forgettingEngine.reset',
    'forgettingEngine.retrieve',
    'forgettingEngine.updateConfig',
  ].sort();
  assert.deepStrictEqual(r, expect);
});
t('A6 模块键总数较接线前 +1（148）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 148, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 路由总数（1206）', () => {
  assert.strictEqual(allows(hf).length, 1206, 'routes=' + allows(hf).length);
});

console.log('\n=== 第二组：辨别力（dispatch 逐条真调） ===');

// checkForget 三种构造：
//   new — timestamp=Date.now()，保留率 ≈1 → precision 1.00 ≥ 阈值 0.3 → 不应遗忘
//   old — timestamp=Date.now()-90 天，S=86400000 → retention=e^(-90) ≈ 0 → 应遗忘
//   CORE — layer='CORE' → isReferenceProtected 强制保护
//   refCount — referenceCount=3 ≥ 保护阈值 3 → 强制保护
t('B1 checkForget 对新旧记忆给出不同的 shouldForget', () => {
  // 注意：FORGETTING_LEVELS 最低档 ARCHIVE precision=0.60，而 defaultThreshold=0.3
  // —— 0.60 > 0.3，所以**任何有效记忆都不会因默认阈值被遗忘**（遗忘判定由阈值驱动）。
  // 因此用自定义 threshold=0.97 构造可辨别的对比：RECENT precision=1.0 不遗忘、
  // SHORT_TERM precision=0.95 应遗忘。
  const fresh = hf.dispatch('forgettingEngine.checkForget', { id: 'b1-new', content: 'new entry', timestamp: Date.now() }, 0.97);
  const dayOld = hf.dispatch('forgettingEngine.checkForget', { id: 'b1-day', content: 'day entry', timestamp: Date.now() - 86400000 }, 0.97);
  for (const r of [fresh, dayOld]) for (const k of ['shouldForget', 'level', 'precision']) assert.ok(k in r, '缺字段 ' + k);
  assert.strictEqual(fresh.shouldForget, false, '新记忆不应遗忘, precision=' + fresh.precision);
  assert.strictEqual(dayOld.shouldForget, true, '1 天前记忆应遗忘, precision=' + dayOld.precision);
  assert.ok(dayOld.precision < fresh.precision, 'day=' + dayOld.precision + ' fresh=' + fresh.precision);
});
t('B2 checkForget 对 CORE 层强制保护（不遗忘）', () => {
  const r = hf.dispatch('forgettingEngine.checkForget', { id: 'b2-core', content: 'core entry', timestamp: Date.now() - 90 * 86400000, layer: 'CORE' });
  assert.strictEqual(r.shouldForget, false, 'CORE 层必须保护');
  assert.strictEqual(r.protected, true, '应标 protected');
  assert.strictEqual(r.reason, 'reference_count_or_core');
});
t('B3 checkForget 对 referenceCount>=3 强制保护', () => {
  // referenceCountProtectionThreshold 默认 3：refCount=3 保护、refCount=2 不保护。
  // 保护路径 shouldForget 恒 false（与精度无关），所以这里断言保护形态而非遗忘与否。
  const protectedHigh = hf.dispatch('forgettingEngine.checkForget', { id: 'b3-hi', content: 'entry', timestamp: Date.now() - 86400000, referenceCount: 3 });
  const unprotectedLow = hf.dispatch('forgettingEngine.checkForget', { id: 'b3-lo', content: 'entry', timestamp: Date.now() - 86400000, referenceCount: 2 }, 0.97);
  assert.strictEqual(protectedHigh.protected, true, 'referenceCount=3 应标保护');
  assert.strictEqual(protectedHigh.reason, 'reference_count_or_core');
  assert.strictEqual(protectedHigh.shouldForget, false, '受保护记忆不应遗忘');
  assert.strictEqual(protectedHigh.precision, 1, '受保护记忆 precision 报 1');
  assert.strictEqual(unprotectedLow.protected, undefined, 'referenceCount=2 不应标记保护');
  assert.strictEqual(unprotectedLow.shouldForget, true, '同参数、threshold=0.97 下 referenceCount=2 应遗忘, precision=' + unprotectedLow.precision);
});
t('B4 自定义 threshold 生效（阈值 0.97：新记忆不遗忘 / 1 天前遗忘）', () => {
  // threshold=0.97：新记忆 precision=1.0 不遗忘；1 天前 precision=0.95 < 0.97 应遗忘
  const fresh = hf.dispatch('forgettingEngine.checkForget', { id: 'b4-new', content: 'entry', timestamp: Date.now() }, 0.97);
  const day = hf.dispatch('forgettingEngine.checkForget', { id: 'b4-day', content: 'entry', timestamp: Date.now() - 86400000 }, 0.97);
  assert.strictEqual(fresh.shouldForget, false);
  assert.strictEqual(day.shouldForget, true, 'threshold=0.97 下 1 天前应遗忘, precision=' + day.precision);
});
t('B5 detectOscillation 空历史返回未震荡', () => {
  // 用全新实例：hf 是贯穿共享实例，B1-B4 已写入 checkForget 访问历史，
  // 直接用它测「空历史」会被共享状态污染。
  const empty = freshHF();
  const r = empty.dispatch('forgettingEngine.detectOscillation');
  assert.strictEqual(r.oscillating, false);
  assert.strictEqual(r.type, 'none');
  assert.strictEqual(r.rate, 0);
});
t('B6 detectOscillation 触发 repeated_consolidation 震荡型', () => {
  // 同样用全新实例，且只触发 consolidate（不掺 compress/checkForget），
  // 否则 detectOscillation 的分支顺序（rapid_access > repeated_consolidation
  // > frequent_thrashing）会让 rapid_access 先命中、测不出目标分支。
  // 另外 consolidate 之间必须留出**非零**间隔：detectOscillation L512 的判据是
  // avgGap < 1000 && avgGap > 0 —— 同一毫秒内的 3 次 consolidate 间隔为 0，
  // 反而不命中该分支（打印出来确认过 gap=0 不触发）。这里各等 30ms。
  const hf6 = freshHF();
  for (const id of ['x1', 'x2', 'x3']) {
    hf6.dispatch('forgettingEngine.consolidate', [{ id, content: 'alpha beta gamma delta' }]);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30);
  }
  const r = hf6.dispatch('forgettingEngine.detectOscillation');
  assert.strictEqual(r.oscillating, true, '应检测到震荡');
  assert.strictEqual(r.type, 'repeated_consolidation', '实得 type=' + r.type);
});
t('B7 detectOscillation 触发 frequent_thrashing 震荡型', () => {
  const hf7 = freshHF();
  // thrashThreshold = ceil(10 * 0.7) = 7；同一 memoryId + compress 型重复 7 次
  for (let i = 0; i < 7; i++) hf7.dispatch('forgettingEngine.compress', { id: 'thrash-1', content: 'entry' });
  const r = hf7.dispatch('forgettingEngine.detectOscillation');
  assert.strictEqual(r.oscillating, true, '应检测到震荡');
  assert.strictEqual(r.type, 'frequent_thrashing', '实得 type=' + r.type);
});
t('B8 ebbinghausRetention 随年龄单调衰减且落在 0..1', () => {
  const r0 = hf.dispatch('forgettingEngine.ebbinghausRetention', 0);
  const r1 = hf.dispatch('forgettingEngine.ebbinghausRetention', 86400000);
  const r7 = hf.dispatch('forgettingEngine.ebbinghausRetention', 7 * 86400000);
  for (const v of [r0, r1, r7]) assert.ok(v >= 0 && v <= 1, '越界: ' + v);
  assert.strictEqual(r0, 1, 'age 0 保留率应为 1, 实得 ' + r0);
  assert.ok(r1 < r0 && r7 < r1, '应单调衰减: ' + r0 + ' ' + r1 + ' ' + r7);
  assert.ok(Math.abs(r1 - Math.exp(-1)) < 1e-9, 'S=1day 时 age=1day 应为 e^-1, 实得 ' + r1);
});
t('B9 ebbinghausRetention 间隔效应：高频访问保留率更高', () => {
  const noAccess = hf.dispatch('forgettingEngine.ebbinghausRetention', 86400000, 1);
  const manyAccess = hf.dispatch('forgettingEngine.ebbinghausRetention', 86400000, 10);
  assert.ok(manyAccess > noAccess, 'manyAccess=' + manyAccess + ' noAccess=' + noAccess);
});
t('B10 getForgettingProbability = 1 - retention', () => {
  const ret = hf.dispatch('forgettingEngine.ebbinghausRetention', 3 * 86400000);
  const prob = hf.dispatch('forgettingEngine.getForgettingProbability', 3 * 86400000);
  assert.ok(Math.abs(ret + prob - 1) < 1e-12, 'ret=' + ret + ' prob=' + prob);
});
t('B11 compress 对新旧内容给出不同精度标签', () => {
  const now = hf.dispatch('forgettingEngine.compress', { id: 'b11-now', content: 'alpha beta gamma delta epsilon zeta', timestamp: Date.now() });
  const old = hf.dispatch('forgettingEngine.compress', { id: 'b11-old', content: 'alpha beta gamma delta epsilon zeta', timestamp: Date.now() - 40 * 86400000 });
  assert.ok(now.compressed && old.compressed, 'compressed 缺失');
  assert.strictEqual(now.compressed.forgettingLevel, 'vivid', '新记忆应 vivid, 实得 ' + now.compressed.forgettingLevel);
  assert.notStrictEqual(old.compressed.forgettingLevel, 'vivid', '旧记忆不应 vivid, 实得 ' + old.compressed.forgettingLevel);
  assert.ok(old.compressed.precision < now.compressed.precision, 'old=' + old.compressed.precision + ' now=' + now.compressed.precision);
});
t('B12 compressBatch 输出批量结果统计', () => {
  const r = hf.dispatch('forgettingEngine.compressBatch', [
    { id: 'c1', content: 'alpha beta' }, { id: 'c2', content: 'gamma delta' }, null,
  ]);
  assert.strictEqual(r.totalSuccess, 2, 'totalSuccess=' + r.totalSuccess);
  assert.strictEqual(r.totalFailed, 1, 'totalFailed=' + r.totalFailed);
  assert.strictEqual(r.results.length, 2);
});
t('B13 consolidate 合并多条并给出主题摘要', () => {
  const r = hf.dispatch('forgettingEngine.consolidate', [
    { id: 'm1', content: 'memory memory trace pattern' },
    { id: 'm2', content: 'memory trace pattern analysis' },
  ]);
  assert.ok(r && typeof r === 'object');
  assert.strictEqual(r.compression, 25);
  assert.ok(r.preserved.memoryCount >= 1, 'memoryCount=' + r.preserved.memoryCount);
});
t('B14 retrieve 给出重建置信度与降级提示', () => {
  const old = hf.dispatch('forgettingEngine.retrieve', { id: 'b14', content: 'entry', timestamp: Date.now() - 40 * 86400000 });
  assert.ok(old.result, 'result 缺失');
  assert.ok(typeof old.result.reconstructionConfidence === 'number');
  assert.ok(old.result.retrievalNote === null || typeof old.result.retrievalNote === 'string');
});
t('B15 getLevel / abstract 公开可用', () => {
  const lv = hf.dispatch('forgettingEngine.getLevel', Date.now() - 40 * 86400000);
  for (const k of ['maxAge', 'compression', 'precision', 'label']) assert.ok(k in lv, '缺 ' + k);
  const ab = hf.dispatch('forgettingEngine.abstract', 'alpha beta gamma', 10);
  assert.strictEqual(typeof ab, 'string');
});
t('B16 getStats / healthCheck 可见状态并随操作增长', () => {
  const before = hf.dispatch('forgettingEngine.getStats');
  hf.dispatch('forgettingEngine.compress', { id: 'b16', content: 'entry' });
  const after = hf.dispatch('forgettingEngine.getStats');
  assert.ok(after.totalCompressions > before.totalCompressions, 'totalCompressions 未增长');
  const h = hf.dispatch('forgettingEngine.healthCheck');
  for (const k of ['status', 'state', 'errorCount', 'oscillationDetected']) assert.ok(k in h, '缺 ' + k);
});
t('B17 getConfig / updateConfig 读改写闭环', () => {
  const c0 = hf.dispatch('forgettingEngine.getConfig');
  assert.ok('defaultThreshold' in c0 && 'referenceCountProtectionThreshold' in c0);
  const c1 = hf.dispatch('forgettingEngine.updateConfig', { defaultThreshold: 0.5 });
  assert.ok(Math.abs(c1.defaultThreshold - 0.5) < 1e-9, '默认阈值未写入');
});

console.log('\n=== 第三组：删块注入负例（删注册行后必须变红） ===');
const original = fs.readFileSync(HF_PATH, 'utf8');
const { execFileSync } = require('child_process');
const NEG = path.join(ROOT, 'scripts', 'round-608-negative-probe.js');
// 负例探针在**全新子进程**里加载心虫（父进程 require.cache 已污染，
// 同进程改写源文件后 ALLOWED_ROUTES 是模块级缓存，注销不掉）。
function runNegProbe() {
  const out = execFileSync(process.execPath, [NEG], { encoding: 'utf8', cwd: ROOT, timeout: 100000 });
  return JSON.parse(out.trim().split('\n').pop());
}
const REGISTER_LINE = "if (this.forgettingEngine && !this._modules['forgettingEngine']) {";
t('C0 前置：注册行在源文件中唯一', () => {
  const n = original.split(REGISTER_LINE).length - 1;
  assert.strictEqual(n, 1, '注册行出现 ' + n + ' 次');
});
(function () {
  let mutated = null;
  t('C1 删注册行后 dispatch 必须重新抛 route not allowed', () => {
    mutated = original.replace(
      /if \(this\.forgettingEngine && !this\._modules\['forgettingEngine'\]\) \{\s*\n\s*this\._modules\['forgettingEngine'\] = this\.forgettingEngine;\s*\n\s*\}/,
      '// [negative-test] 注册行已删除'
    );
    assert.notStrictEqual(mutated, original, '删除替换未生效');
    fs.writeFileSync(HF_PATH, mutated);
    let res;
    try { res = runNegProbe(); } finally { fs.writeFileSync(HF_PATH, original); }
    assert.strictEqual(res.ok, true, '负例探针自身失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 0, '删除后仍有 ' + res.routes + ' 条路由');
    assert.strictEqual(res.modulesKey, false, '_modules 仍有键');
    assert.strictEqual(res.dispatchThrewNotAllowed, true, '删除后 dispatch 未抛 route not allowed');
  });
  t('C2 恢复源文件后路由归位且模块计数回落', () => {
    const res = runNegProbe();
    assert.strictEqual(res.ok, true, '恢复后探针失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 16, '恢复后路由数 ' + res.routes);
    assert.strictEqual(res.modulesKey, true, '恢复后 _modules 无键');
    assert.strictEqual(res.modulesKeyCount, 148, '恢复后模块数 ' + res.modulesKeyCount);
  });
})();

console.log('\n=== 第四组：稳健性（r608 修掉的 getField 缺陷不得回归） ===');
const hf4 = freshHF();
t('D1 源文件中 getField helper 存在（引用计数保护路径）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/memory/forgetting.js'), 'utf8');
  assert.ok(/\nfunction getField\(/.test(src), 'getField 定义缺失');
});
t('D2 checkForget 对有效记忆零内部故障（不再抛 ReferenceError）', () => {
  const cases = [
    { id: 'd2-1', content: 'entry' },
    { id: 'd2-2', content: 'entry', layer: 'LEARNED' },
    { id: 'd2-3', content: 'entry', layer: 'CORE' },
    { id: 'd2-4', content: 'entry', layer: 'core' },
  ];
  for (const c of cases) {
    const r = hf4.dispatch('forgettingEngine.checkForget', c);
    assert.ok(r && typeof r === 'object', '返回非对象');
    assert.ok(!/is not defined|is not a function|Cannot read properties/.test(String(r.error || '')), '内部故障: ' + r.error);
  }
});
t('D3 getField 语义：点号路径 / 非对象回落 / undefined 回落', () => {
  // layer 走点号路径可达；referenceCount 缺省回落 0；非对象入参回落 fallback
  const nested = hf4.dispatch('forgettingEngine.checkForget', { id: 'd3-a', content: 'entry', meta: { referenceCount: 5 } });
  // meta.referenceCount 不走顶层 referenceCount → 不保护（顶层缺省 0）
  assert.strictEqual(nested.shouldForget, false, '新记忆 timestamp 缺省=now, 不应遗忘');
  const nullish = hf4.dispatch('forgettingEngine.checkForget', { id: 'd3-b', content: 'entry', referenceCount: undefined });
  assert.strictEqual(typeof nullish.shouldForget, 'boolean');
  const wrongType = hf4.dispatch('forgettingEngine.checkForget', 'not-an-object');
  assert.strictEqual(wrongType.shouldForget, true, '无效入参应走 error 分支');
  assert.ok(/Memory/.test(String(wrongType.error)), 'error=' + wrongType.error);
});
t('D4 16 条路由逐条 dispatch 零内部故障（含默认空实参）', () => {
  const rs = allows(hf4).filter(x => x.startsWith('forgettingEngine.'));
  assert.strictEqual(rs.length, 16);
  for (const r of rs) {
    try {
      const out = hf4.dispatch(r);
      assert.notStrictEqual(out, undefined, r + ' 返回 undefined');
    } catch (e) {
      const m = String(e && e.message);
      assert.ok(
        !/is not a function|is not defined|Cannot read properties of (null|undefined)/.test(m),
        r + ' 内部故障: ' + m
      );
      assert.ok(m.length > 0, r + ' 抛出空错误');
    }
  }
});
t('D5 compress 空实参 / 错误类型返回结构化 error 而非抛', () => {
  const e1 = hf4.dispatch('forgettingEngine.compress');
  assert.ok(e1 && e1.error, '应返回 error');
  const e2 = hf4.dispatch('forgettingEngine.compress', { content: 'no id' });
  assert.ok(e2.error, '缺 id 应返回 error');
  const e3 = hf4.dispatch('forgettingEngine.compressBatch', 'not-array');
  assert.strictEqual(e3.totalFailed, 1, 'totalFailed=' + e3.totalFailed);
  const e4 = hf4.dispatch('forgettingEngine.consolidate', 'not-array');
  assert.strictEqual(e4, null, 'consolidate 非数组应返回 null');
});
t('D6 reset 后历史清零且 detectOscillation 回到未震荡', () => {
  for (let i = 0; i < 7; i++) hf4.dispatch('forgettingEngine.compress', { id: 'd6', content: 'entry' });
  const hot = hf4.dispatch('forgettingEngine.detectOscillation');
  assert.strictEqual(hot.oscillating, true);
  hf4.dispatch('forgettingEngine.reset');
  const cold = hf4.dispatch('forgettingEngine.detectOscillation');
  assert.strictEqual(cold.oscillating, false, 'reset 后应未震荡');
  assert.strictEqual(cold.type, 'none');
});
t('D7 重复 start() 不会重复注册（幂等）', () => {
  hf4.start();
  hf4.start();
  const r = allows(hf4).filter(x => x.startsWith('forgettingEngine.'));
  assert.strictEqual(r.length, 16, '重复 start 后路由数应为 16，实得 ' + r.length);
  assert.strictEqual(Object.keys(hf4._modules).length, 148, '重复 start 后模块数 ' + Object.keys(hf4._modules).length);
});

console.log('\n=== 结果 ===');
console.log('通过 ' + passed + ' / 失败 ' + failed);
if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); }
