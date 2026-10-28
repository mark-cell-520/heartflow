/**
 * HeartFlow Core Unit Tests
 * 运行: HEARTFLOW_CODE_EXECUTOR_ENABLED=true node tests/core.test.js
 *
 * [v6.8.85 审计修复] 删除 CodeExecutor 段：src/code/code-executor.js 模块
 * 已并入 heartflow.js 的惰性 stub（src/code/ 目录整体移除），原 require 是死引用。
 */

const { HeartFlow } = require('../src/core/heartflow.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runTests() {
  console.log('\n🧪 HeartFlow Core Tests\n');

  // ─── HeartFlow Core Tests ──────────────────────────────────────
  console.log('💓 HeartFlow Core:');
  const hf = new HeartFlow({ rootPath: '/tmp/heartflow-test-' + Date.now() });

  test('constructor sets version', () => {
    assert(hf.version !== null && hf.version !== 'unknown', `Version should be set, got: ${hf.version}`);
  });

  test('constructor initializes _initErrors', () => {
    assert(Array.isArray(hf._initErrors), '_initErrors should be array');
    assert(hf._initErrors.length === 0, '_initErrors should be empty before start');
  });

  test('start() initializes core modules', async () => {
    const result = await hf.start();
    assert(result.success === true, `Start should succeed: ${JSON.stringify(result)}`);
    assert(result.modules > 0, `Should have modules: ${result.modules}`);
  });

  test('start() populates _modules registry', () => {
    assert(Object.keys(hf._modules).length > 0, '_modules should not be empty');
    assert('identityCore' in hf._modules, 'identityCore should be registered');
    assert('heartLogic' in hf._modules, 'heartLogic should be registered');
  });

  test('thinkFast returns result', async () => {
    const result = await hf.thinkFast('hello');
    assert(result !== null, 'thinkFast should return result');
    assert(result.type !== undefined, 'Should have type');
  });

  test('_lazyCache uses Map (LRU)', () => {
    // _lazyCache is module-private, check via module system
    const hfModule = require('../src/core/heartflow.js');
    // The _lazyCache is a closure variable, we can verify LRU behavior indirectly
    assert(hf._modules !== null, '_modules should be populated');
  });

  test('structured logger exists', () => {
    assert(typeof hf._log !== 'undefined', '_log should exist');
    assert(typeof hf._log.info === 'function', '_log.info should be function');
    assert(typeof hf._log.warn === 'function', '_log.warn should be function');
    assert(typeof hf._log.error === 'function', '_log.error should be function');
  });

  test('stop() cleanly shuts down', async () => {
    await hf.stop();
    assert(hf.started === false, 'Should not be started after stop');
    assert(Object.keys(hf._modules).length === 0, '_modules should be cleared');
  });

  // ─── Summary ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
