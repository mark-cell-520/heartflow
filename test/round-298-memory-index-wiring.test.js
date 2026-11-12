// r298 — memoryIndex 接线回归测试
// 覆盖：
//   A 段：引擎侧接线（_modules 注册 + ALLOWED_ROUTES 生成 + dispatch 可达）
//   B 段：MCP 侧三处同步（HANDLERS 存在 + TOOLS 定义 + WRITE_TOOLS 收口）
//   C 段：读方法白名单收口（printBootSummary 等控制台型方法不可经 MCP 调）
//   D 段：负例注入（LATE_ADDITIONS 去掉 memoryIndex 后 dispatch 必须回到 not allowed）
//   E 段：guest 权限清单同步（test/mcp-guest-permission.test.js 的 WRITE_TOOLS/READ_TOOLS）
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

// ─── A 段：引擎侧 ───────────────────────────────────────────────
function testEngineWiring() {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ autoStart: false });
  // 同步检查静态成员（start 前的 ALLOWED_ROUTES 由 start 内生成，
  // 这里只验证实例构造与 _modules 注册逻辑）
  assert.ok(hf, 'HeartFlow 实例可构造');

  const src = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
  // LATE_ADDITIONS 数组里必须含 memoryIndex（注册路径）
  const lateBlock = src.split('const LATE_ADDITIONS = [')[1].split('];')[0];
  assert.ok(lateBlock.includes("'memoryIndex'"), 'LATE_ADDITIONS 含 memoryIndex');

  // 实例构造点存在（L1465 附近）
  assert.ok(src.includes('this.memoryIndex = new MemoryIndex('), 'memoryIndex 实例构造点存在');

  // memory-index 模块导出完整
  const mi = require(path.join(ROOT, 'src/memory/memory-index.js'));
  assert.strictEqual(typeof mi.MemoryIndex, 'function', 'MemoryIndex 类导出');
  return true;
}

// ─── A2 段：dispatch 真可达（起真实引擎）─────────────────────────
async function testDispatchReachable() {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ autoStart: false });
  await hf.start();

  assert.ok(hf._modules.memoryIndex, 'memoryIndex 已注册进 _modules');
  const routes = [...HeartFlow.ALLOWED_ROUTES].filter(r => r.startsWith('memoryIndex.'));
  assert.ok(routes.length >= 18, `ALLOWED_ROUTES 至少 18 条 memoryIndex.* （实际 ${routes.length}）`);

  const readMethods = ['getIdentity', 'getUser', 'getFeedback', 'getProject', 'getContext', 'getIndex', 'healthCheck'];
  let okCount = 0;
  for (const m of readMethods) {
    const r = await hf.dispatch('memoryIndex.' + m, {});
    assert.ok(r !== undefined, `dispatch memoryIndex.${m} 有返回`);
    okCount++;
  }
  assert.strictEqual(okCount, readMethods.length, '7 个读方法全部 dispatch ok');

  // 写方法 dispatch 也必须可达（引擎层不拦写，权限收口在 MCP 层）
  for (const m of ['updateUser', 'addFeedback', 'setCurrentWork', 'addPausedTask', 'removePausedTask', 'addUnresolvedProblem', 'resolveProblem', 'addSkill', 'recordBoot']) {
    await hf.dispatch('memoryIndex.' + m, {});
  }
  return true;
}

// ─── B 段：MCP 三处同步 ─────────────────────────────────────────
function testMcpWiring() {
  const mcpSrc = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');

  // HANDLERS
  const handlersBlock = mcpSrc.split('heartflow_memory_index_read:')[1] || '';
  assert.ok(handlersBlock.length > 0, 'HANDLERS 含 heartflow_memory_index_read');
  assert.ok(mcpSrc.includes('heartflow_memory_index_write:'), 'HANDLERS 含 heartflow_memory_index_write');

  // WRITE_TOOLS 收口（写工具在集合内、读工具不在）
  const writeBlock = mcpSrc.split('const WRITE_TOOLS = new Set([')[1].split(']);')[0];
  assert.ok(writeBlock.includes("'heartflow_memory_index_write'"), 'WRITE_TOOLS 收口写工具');
  assert.ok(!writeBlock.includes("'heartflow_memory_index_read'"), '读工具不在 WRITE_TOOLS');

  // TOOLS 定义（extended-tools.js）
  const { EXTENDED_TOOLS } = require(path.join(ROOT, 'src/mcp/extended-tools.js'));
  const readDef = EXTENDED_TOOLS.find(t => t.name === 'heartflow_memory_index_read');
  const writeDef = EXTENDED_TOOLS.find(t => t.name === 'heartflow_memory_index_write');
  assert.ok(readDef, 'TOOLS 含 heartflow_memory_index_read 定义');
  assert.ok(writeDef, 'TOOLS 含 heartflow_memory_index_write 定义');
  // action 枚举与 handler 白名单一致
  assert.deepStrictEqual(readDef.inputSchema.properties.action.enum,
    ['getIdentity', 'getUser', 'getFeedback', 'getProject', 'getContext', 'getIndex', 'getBootSummary', 'healthCheck'],
    '读 action 枚举与 handler 白名单一致');
  assert.deepStrictEqual(writeDef.inputSchema.properties.action.enum,
    ['updateUser', 'addFeedback', 'setCurrentWork', 'addPausedTask', 'removePausedTask', 'addUnresolvedProblem', 'resolveProblem', 'addSkill', 'recordBoot'],
    '写 action 枚举与 handler 白名单一致');
  assert.deepStrictEqual(writeDef.inputSchema.required, ['action'], '写工具 action 必填');
  return true;
}

// ─── C 段：读白名单收口（printBootSummary 不可调）─────────────────
function testReadWhitelistClosure() {
  const mcpSrc = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const readHandlerBlock = mcpSrc.split('heartflow_memory_index_read: (args) => {')[1].split('heartflow_memory_index_write:')[0];
  // 白名单里不得含 printBootSummary（console 输出型，经 MCP 调产生噪声）
  assert.ok(!readHandlerBlock.includes('printBootSummary'), '读白名单不含 printBootSummary');
  // 白名单里不得含 _ 前缀私有方法
  assert.ok(!/getOwnPropertyNames|_loadIndex|_saveIndex|_ensureDataDir|_getDefaultIndex/.test(readHandlerBlock),
    '读白名单不含私有方法');
  return true;
}

// ─── D 段：负例注入（去注册 → 必须回到 not allowed）───────────────
async function testNegativeInjection() {
  const hfPath = path.join(ROOT, 'src/core/heartflow.js');
  const orig = fs.readFileSync(hfPath, 'utf8');
  const tmpPath = path.join(ROOT, 'src/core/__r298-negtest-heartflow.js');
  // 注入：把 LATE_ADDITIONS 里的 'memoryIndex' 条目删掉
  const injected = orig.replace(/\n\s*'memoryIndex',\n(\s*'knowledgeBase')/, '\n$1');
  assert.notStrictEqual(injected, orig, '负例注入生效（删掉了 memoryIndex 注册条目）');
  fs.writeFileSync(tmpPath, injected);
  try {
    // 清缓存重新加载
    delete require.cache[require.resolve(hfPath)];
    const { HeartFlow } = require(tmpPath);
    const hf = new HeartFlow({ autoStart: false });
    await hf.start();
    assert.ok(!hf._modules.memoryIndex, '注入后 memoryIndex 不在 _modules');
    const routes = [...HeartFlow.ALLOWED_ROUTES].filter(r => r.startsWith('memoryIndex.'));
    assert.strictEqual(routes.length, 0, '注入后 ALLOWED_ROUTES 0 条 memoryIndex.*');
    let threw = 0;
    for (const m of ['getIdentity', 'getContext', 'healthCheck']) {
      try { await hf.dispatch('memoryIndex.' + m, {}); } catch (e) {
        if (/not allowed/i.test(e.message)) threw++;
      }
    }
    assert.strictEqual(threw, 3, '注入后 3 个读方法全部回到 not allowed');
  } finally {
    fs.unlinkSync(tmpPath);
    delete require.cache[require.resolve(hfPath)];
  }
  return true;
}

// ─── E 段：guest 权限测试清单同步 ────────────────────────────────
function testGuestPermissionSync() {
  const testSrc = fs.readFileSync(path.join(ROOT, 'test/mcp-guest-permission.test.js'), 'utf8');
  assert.ok(testSrc.includes("'heartflow_memory_index_write'"), 'guest 测试 WRITE_TOOLS 抽样含写工具');
  assert.ok(testSrc.includes("'heartflow_memory_index_read'"), 'guest 测试 READ_TOOLS 抽样含读工具');
  return true;
}

// ─── 主流程 ─────────────────────────────────────────────────────
(async () => {
  const results = [];
  const steps = [
    ['A 引擎侧接线静态', () => testEngineWiring()],
    ['A2 dispatch 真可达', () => testDispatchReachable()],
    ['B MCP 三处同步', () => testMcpWiring()],
    ['C 读白名单收口', () => testReadWhitelistClosure()],
    ['D 负例注入', () => testNegativeInjection()],
    ['E guest 权限同步', () => testGuestPermissionSync()],
  ];
  for (const [name, fn] of steps) {
    try {
      await fn();
      results.push([name, 'PASS', '']);
      console.log(`PASS ${name}`);
    } catch (e) {
      results.push([name, 'FAIL', e.message]);
      console.log(`FAIL ${name}: ${e.message}`);
    }
  }
  const passed = results.filter(r => r[1] === 'PASS').length;
  console.log(`\nround-298: ${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
