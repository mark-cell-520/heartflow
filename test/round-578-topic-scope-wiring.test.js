/**
 * 守卫（第 578 轮）：topicScope 接线 + MCP 层三处同步
 *
 * 背景（r577/r578 实测）：
 *   - r577 修了 _ngramSimilarity 的中文口径（0/15 → 15/15 命中、0/10 误伤）
 *   - r578 实测接线：hf._modules 143→144 键、HeartFlow.ALLOWED_ROUTES
 *     新增 19 条 topicScope.* 路由，dispatch('topicScope.contains') 端到端可分
 *     同话题（score 0.999）与跨话题（score 0）
 *   - 但 MCP 层 heartflow_topic_scope 是坏的：每次 new TopicScope({silent:true})
 *     全新实例（永远空栈）+ 调不存在的 getCurrentTopic()。外部 agent 通过 MCP
 *     拿不到任何话题状态。
 *
 * 覆盖：
 *   A. 引擎实例接线 — hf._modules.topicScope 存在且是同一实例
 *   B. dispatch 路由 — 19 条 topicScope.* 全在 ALLOWED_ROUTES，下划线方法无路由
 *   C. dispatch 端到端判别 — push 后同话题 contains=true、跨话题=false
 *   D. MCP 层 — 工具定义/映射/handler 三处一致，handler 用共享实例并能返回真实话题
 *   E. 隔离 — 关掉接线后路由必须消失（证明这条能力真的靠这 13 行接线）
 *
 * 样本隔离：本文件只用中性工作话题描述，不贴任何攻击话术或隐私内容。
 */
const path = require('path');
const assert = require('assert');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src');

// 隔离话题落盘目录，避免污染 data/
process.env.HEARTFLOW_TOPIC_DIR = '/tmp/hf-topic-scope-test-r578';

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; failures.push(name + ' → ' + e.message); console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 预检：接线代码必须真的在源码里（不是靠上一轮 auto-commit 捡回来的） ──
const hfSrc = require('fs').readFileSync(path.join(SRC, 'core/heartflow.js'), 'utf8');
t('heartflow.js 含 [r577] topicScope 接线标记', () => {
  assert.ok(hfSrc.includes('[r577] TopicScope 接线') || hfSrc.includes("this._modules['topicScope'] = this.topicScope"),
    '接线代码不在源码里');
});

// ── A. 引擎实例接线 ────────────────────────────────────────
console.log('\n[A. 引擎实例接线]');
const { HeartFlow } = require(path.join(SRC, 'core/heartflow.js'));
const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
hf.start();

t('hf._modules.topicScope 存在', () => {
  assert.ok(hf._modules.topicScope, '_modules.topicScope 缺失');
});

t('hf.topicScope 与 _modules.topicScope 是同一实例', () => {
  assert.strictEqual(hf.topicScope, hf._modules.topicScope, '接线后应为同一引用');
});

// ── B. dispatch 路由 ───────────────────────────────────────
console.log('\n[B. dispatch 路由]');

const TOPIC_METHODS = [
  'setMemoryBridge', 'push', 'pop', 'store', 'get', 'deleteKeys',
  'setContext', 'getContext', 'clearContext', 'clearAll',
  'findSimilarTopic', 'contains', 'merge', 'cleanupExpired',
  'storeSize', 'setHooks', 'getTopics', 'getStats', 'diagnose',
];

t('19 个公开方法全部进 ALLOWED_ROUTES', () => {
  for (const m of TOPIC_METHODS) {
    assert.ok(HeartFlow.ALLOWED_ROUTES.has(`topicScope.${m}`),
      `路由 topicScope.${m} 未加入白名单`);
  }
});

t('下划线私有方法不出现在白名单', () => {
  for (const noise of ['topicScope._ngramSimilarity', 'topicScope._contentTerms',
    'topicScope._domainBridge', 'topicScope._enforceMaxTopics', 'topicScope._fireHook']) {
    assert.ok(!HeartFlow.ALLOWED_ROUTES.has(noise), `私有路由 ${noise} 泄露`);
  }
});

t('routes() 里公开方法被标注为可达（无「未注册」后缀）', () => {
  const table = hf.routes();
  assert.ok(Array.isArray(table.topicScope), 'routes().topicScope 应为数组');
  // routes() 列出全部原型方法（含下划线私有方法），标注可达性由调用方过滤。
  // 这里只要求 19 个公开方法全部可达；下划线方法不可达是设计内的。
  for (const m of TOPIC_METHODS) {
    assert.ok(table.topicScope.includes(`topicScope.${m}`),
      `公开方法 topicScope.${m} 未出现在 routes()`);
  }
  for (const m of TOPIC_METHODS) {
    assert.ok(!table.topicScope.includes(`topicScope.${m}  [未注册，dispatch 会拒绝]`),
      `公开方法 topicScope.${m} 被标为不可达`);
  }
});

// ── C. dispatch 端到端判别 ─────────────────────────────────
console.log('\n[C. dispatch 端到端判别]');

t('push 后 contains 对同话题样本判 belongs=true', () => {
  hf.dispatch('topicScope.push', '心虫引擎升级');
  const r = hf.dispatch('topicScope.contains', { text: '新增维度的负例守卫测试必须写' });
  assert.ok(r && typeof r === 'object', 'contains 应返回对象');
  assert.strictEqual(r.belongs, true, '同话题样本必须判属于');
  assert.ok(r.score >= 0.25, `同话题 score ${r.score} 应 >= 0.25`);
});

t('contains 对跨话题样本判 belongs=false', () => {
  const r = hf.dispatch('topicScope.contains', { text: '明天北京会下雨吗' });
  assert.strictEqual(r.belongs, false, '跨话题样本必须判不属于');
  assert.strictEqual(r.score, 0, `跨话题 score 应为 0，实际 ${r.score}`);
});

t('findSimilarTopic 返回带 topic 与 score 的形状', () => {
  // dispatch 是 positional 参数：mod.findSimilarTopic(text)
  const r = hf.dispatch('topicScope.findSimilarTopic', '给辨别引擎再加一个判别维度');
  assert.ok(r && typeof r === 'object', '应返回对象');
  assert.ok('topic' in r && 'score' in r && 'topics' in r, '缺 topic/score/topics 字段');
  assert.ok(r.score > 0, `同话题样本应有正分，实际 ${r.score}`);
});

t('findSimilarTopic 对跨话题样本返回空 topic', () => {
  const r = hf.dispatch('topicScope.findSimilarTopic', '明天北京会下雨吗');
  assert.strictEqual(r.topic, null, '跨话题样本不该匹配到话题');
  assert.strictEqual(r.score, 0, `跨话题 score 应为 0，实际 ${r.score}`);
});

t('空栈 contains 返回「无当前话题」而不是崩溃', () => {
  const hf2 = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
  hf2.start();
  try {
    const r = hf2.dispatch('topicScope.contains', { text: '任何输入' });
    assert.ok(r && typeof r === 'object', '应返回对象');
    assert.strictEqual(r.belongs, false, '无话题时应判不属于');
  } finally {
    try { hf2.stop && hf2.stop(); } catch (_) {}
  }
});

// ── D. MCP 层三处同步 ──────────────────────────────────────
console.log('\n[D. MCP 层]');

const mcpSrc = require('fs').readFileSync(path.join(SRC, 'mcp-server.js'), 'utf8');

t('MCP handler heartflow_topic_scope 用共享单例而不是每次 new', () => {
  // 坏形状：每次调用都 new TopicScope({ silent: true })
  assert.ok(!/heartflow_topic_scope:[\s\S]{0,400}?new TopicScope/.test(mcpSrc),
    'handler 仍在每次调用创建全新实例（空栈、状态丢失）');
});

t('MCP handler 不再调用不存在的 getCurrentTopic', () => {
  // [r579 加宽窗口] 原 600 字符窗口只覆盖 handler 前段，handler 尾部的
  // getCurrentTopic 落在窗口外 —— r579 负例实测变异后守卫仍全绿（弱断言）。
  // 现在扫整个 HANDLERS 块（从 heartflow_topic_scope 到下一个顶层键）。
  const start = mcpSrc.indexOf('heartflow_topic_scope:');
  const after = mcpSrc.slice(start);
  const nextKey = after.slice(1).search(/\n  heartflow_\w+:/);
  const block = nextKey > 0 ? after.slice(0, nextKey + 1) : after;
  assert.ok(!/getCurrentTopic/.test(block),
    'handler 仍在调 TopicScope 上不存在的方法（真实 API 是 ts.current getter / ts.getStats()）');
});

t('MCP handler 会真的返回当前话题（读 shape.getCurrentTopic 等真实 API）', () => {
  // 修好后的实现应从共享实例拿真实状态
  assert.ok(/topicScope|_sharedTopicScope|getTopics|_current/.test(mcpSrc),
    'handler 未读取任何真实话题状态');
});

t('[r579] tools-registry 有 heartflow_topic_scope 定义（三处同步第一处）', () => {
  const regSrc = require('fs').readFileSync(path.join(SRC, 'mcp/tools-registry.js'), 'utf8');
  assert.ok(/name:\s*['"]heartflow_topic_scope['"]/.test(regSrc),
    'tools-registry 缺 heartflow_topic_scope —— AGENTS.md 要求的三处同步（定义/映射/handler）只存在 handler 一处');
  // 定义必须带 inputSchema.properties，否则 tools/call 的空参数保护会把它
  // 拦成「未收到任何有效参数」（实测：无 properties 的工具传任何参数都被清空）
  const idx = regSrc.indexOf("name: 'heartflow_topic_scope'");
  const seg = regSrc.slice(idx, idx + 2000);
  assert.ok(/inputSchema/.test(seg), 'heartflow_topic_scope 定义缺 inputSchema');
  assert.ok(/"properties"\s*:/.test(seg) || /"properties"\s*:/.test(seg),
    'heartflow_topic_scope 定义缺 inputSchema.properties');
});

// [r579 新增] 真实 socket 端到端：MCP 协议层真的能拿到话题状态。
// 文本断言是弱判据（r579 负例实测：改坏 handler 尾部后仍全绿），
// 这一节才是「外部 agent 真的拿到了什么」的直接证据。
const net = require('net');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const SOCK = path.join(os.tmpdir(), `hf-topic-r578-${process.pid}.sock`);

function mcpCall(name, args, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(SOCK, () => {
      s.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    });
    let buf = '';
    const timer = setTimeout(() => { s.destroy(); reject(new Error('timeout ' + name)); }, timeoutMs);
    s.on('data', d => {
      buf += d.toString();
      if (buf.includes('\n')) {
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.trim())); } catch (e) { reject(e); }
        s.destroy();
      }
    });
    s.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

function extractPayload(res) {
  // tools/call 返回 {result:{content:[{type:text,text:JSON}]}} 或 {error}
  const r = res && (res.result || res);
  const text = r && r.content && r.content[0] ? r.content[0].text : '';
  try { return JSON.parse(text); } catch (_) { return { __raw: text }; }
}

try { fs.unlinkSync(SOCK); } catch (_) {}
const mcpProc = spawn('node', [path.join(SRC, 'mcp-server.js'), '--socket', SOCK], {
  cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'],
});
(async () => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (mcpProc.exitCode !== null) throw new Error(`MCP 进程提前退出 code=${mcpProc.exitCode}`);
    if (fs.existsSync(SOCK)) { await new Promise(r => setTimeout(r, 1500)); break; }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!fs.existsSync(SOCK)) throw new Error('MCP socket 未就绪');
  console.log('\n[E2E. MCP 协议层真实调用]');

  // 用一次 push + contains 完整闭环证明状态跨调用保留
  const pushed = extractPayload(await mcpCall('heartflow_topic_scope', {
    action: 'push', text: '心虫辨别引擎维度守卫',
  }));
  t('[r579] E2E push 后 stats.current 就是刚压入的话题', () => {
    assert.ok(pushed && !pushed.error, 'push 返回 error: ' + JSON.stringify(pushed).slice(0, 120));
    assert.strictEqual(pushed.pushed, '心虫辨别引擎维度守卫');
    assert.strictEqual(pushed.stats.currentTopic, '心虫辨别引擎维度守卫',
      'currentTopic 不等于刚 push 的话题 —— 仍是每次 new 空实例的老 bug');
  });

  const contains = extractPayload(await mcpCall('heartflow_topic_scope', {
    action: 'contains', text: '给辨别引擎再加一个判别维度',
  }));
  t('[r579] E2E contains 对同话题样本判 belongs=true', () => {
    assert.ok(contains && !contains.error, 'contains 返回 error: ' + JSON.stringify(contains).slice(0, 120));
    assert.strictEqual(contains.belongs, true, '跨调用状态丢了：同话题样本应判属于');
    assert.ok(contains.score >= 0.25, `score ${contains.score} 应 >= 0.25`);
  });

  const cross = extractPayload(await mcpCall('heartflow_topic_scope', {
    action: 'contains', text: '明天北京会下雨吗',
  }));
  t('[r579] E2E contains 对跨话题样本判 belongs=false', () => {
    assert.ok(cross && !cross.error, 'cross 返回 error');
    assert.strictEqual(cross.belongs, false, '跨话题样本必须判不属于');
  });

  const stats = extractPayload(await mcpCall('heartflow_topic_scope', { action: 'stats' }));
  t('[r579] E2E stats 返回真实话题状态而非空对象', () => {
    assert.ok(stats && !stats.error, 'stats 返回 error');
    assert.ok(stats.current, `current 为空（${JSON.stringify(stats.current)}）—— handler 没读真实实例`);
    assert.ok(stats.stats && typeof stats.stats === 'object', '缺 stats 对象');
    assert.ok(Array.isArray(stats.topics) && stats.topics.length > 0, 'topics 应为非空数组');
  });

  const badAction = extractPayload(await mcpCall('heartflow_topic_scope', {
    action: 'contains', threshold: 0.9,
  }));
  t('[r579] E2E 缺 text 时报明确错误而不是静默空结果', () => {
    assert.ok(badAction && badAction.error, '缺 text 时应返回 error（不能静默成功）');
    assert.ok(/text/.test(badAction.error), '错误信息应指出缺 text');
  });

  const cleared = extractPayload(await mcpCall('heartflow_topic_scope', { action: 'clearAll' }));
  t('[r579] E2E clearAll 真的清空话题栈', () => {
    assert.ok(cleared && !cleared.error, 'clearAll 返回 error');
    assert.strictEqual(cleared.stats.currentTopic, null, 'clearAll 后 currentTopic 应为 null');
  });

  // [r580 新增] reset：clearAll 之外的第二条归零路径。守卫必须同时覆盖它，
  // 否则「改坏 reset」是零成本的（负例 M7 实测：没有这条断言时守卫全绿）。
  const pushed2 = extractPayload(await mcpCall('heartflow_topic_scope', {
    action: 'push', text: '心虫门禁召回基线',
  }));
  t('[r580] E2E reset 前话题栈非空（保证 reset 有东西可清）', () => {
    assert.ok(pushed2 && !pushed2.error, 'push 返回 error: ' + JSON.stringify(pushed2).slice(0, 120));
    assert.strictEqual(pushed2.stats.currentTopic, '心虫门禁召回基线');
    assert.ok(pushed2.stats.stackDepth >= 1, `reset 前 stackDepth 应 >= 1，实得 ${pushed2.stats.stackDepth}`);
  });
  const reset = extractPayload(await mcpCall('heartflow_topic_scope', { action: 'reset' }));
  t('[r580] E2E reset 真的把话题栈归零', () => {
    assert.ok(reset && !reset.error, 'reset 返回 error: ' + JSON.stringify(reset).slice(0, 120));
    assert.strictEqual(reset.stats.currentTopic, null, 'reset 后 currentTopic 应为 null');
    assert.strictEqual(reset.stats.stackDepth, 0, 'reset 后 stackDepth 应为 0');
    assert.strictEqual(reset.stats.activeTopics, 0, 'reset 后 activeTopics 应为 0');
  });
  const afterReset = extractPayload(await mcpCall('heartflow_topic_scope', { action: 'contains', text: '心虫辨别引擎维度守卫' }));
  t('[r580] E2E reset 后同话题样本也判不属于（栈真空）', () => {
    assert.ok(afterReset && !afterReset.error, 'reset 后 contains 返回 error');
    assert.strictEqual(afterReset.belongs, false,
      'reset 后应无任何当前话题，同话题样本也必须判不属于');
  });
})().catch(e => {
  console.log('  ❌ E2E 流程异常: ' + e.message);
  fail++; failures.push('E2E 流程: ' + e.message);
}).then(() => {
  try { mcpProc.kill(); } catch (_) {}
  try { fs.unlinkSync(SOCK); } catch (_) {}

  // ── E. 接线必要性 ──────────────────────────────────────────
  console.log('\n[E. 接线必要性（删掉即失效）]');

  t('删掉 _modules.topicScope 注册后 routes() 不再有 topicScope', () => {
    const hf3 = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf3.start();
    delete hf3._modules.topicScope;
    const table = hf3.routes();
    assert.ok(!table.topicScope, '删掉注册后 routes() 仍含 topicScope —— 说明有别处在注册');
  });

  // ── 汇总 ───────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`结果: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) {
    console.log('\n失败项:');
    failures.forEach(f => console.log('  · ' + f));
    process.exit(1);
  }
});
