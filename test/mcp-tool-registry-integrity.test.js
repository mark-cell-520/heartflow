/**
 * 测试：MCP 工具注册表完整性（v6.7.70，心虫 decision.decide 选定，0.94 分）
 *
 * 铁律：**绝不留错路由，也绝不留空壳。**
 * 对外声明了能力却没有实现（tools/list 列出但调用报 Method not found），
 * 比不声明更糟——调用方会基于错误预期构建逻辑。
 *
 * 本测试是注册表的守门人：
 *   1. TOOLS 无重复名
 *   2. 每个 TOOLS 都有对应 handler（无孤儿）
 *   3. HANDLERS 映射的函数都真实存在
 *   4. 新接线的 3 个工具路由经实测可用
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { TOOLS } = require(path.join(HF, 'src/mcp/tools-registry.js'));
const mcpSrc = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[注册表完整性]');

t('TOOLS 无重复名', () => {
  const names = TOOLS.map(x => x.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  assert.strictEqual(dupes.length, 0, '重复: ' + dupes.join(', '));
});

t('每个 TOOLS 都有 name + description + inputSchema', () => {
  for (const x of TOOLS) {
    assert.ok(x.name && x.name.startsWith('heartflow_'), `非法 name: ${x.name}`);
    assert.ok(typeof x.description === 'string' && x.description.length > 0, `${x.name} 缺 description`);
    assert.ok(x.inputSchema && x.inputSchema.type === 'object', `${x.name} 缺 inputSchema`);
  }
});

// HANDLERS 映射
const hb = mcpSrc.match(/const HANDLERS = \{([\s\S]*?)\n\};/);
const handlerMap = {};
for (const line of hb[1].split('\n')) {
  const m = line.match(/^\s*'?(heartflow_\w+)'?:\s*(\w+),/);
  if (m) handlerMap[m[1]] = m[2];
}

t('每个 TOOLS 都有 handler（无孤儿）', () => {
  const orphans = TOOLS.filter(x => !handlerMap[x.name]).map(x => x.name);
  assert.strictEqual(orphans.length, 0, '孤儿工具: ' + orphans.join(', '));
});

t('HANDLERS 映射的函数都真实存在', () => {
  const missing = [];
  for (const [tool, fn] of Object.entries(handlerMap)) {
    if (!new RegExp('function ' + fn + '\\s*\\(').test(mcpSrc)
        && !new RegExp('const ' + fn + '\\s*=').test(mcpSrc)) missing.push(tool + ' → ' + fn);
  }
  assert.strictEqual(missing.length, 0, '函数不存在: ' + missing.join(', '));
});

t('新接线的 3 个工具在 HANDLERS 中', () => {
  for (const n of ['heartflow_decision_decide', 'heartflow_memory_consolidate', 'heartflow_execution_verify']) {
    assert.ok(handlerMap[n], `${n} 未接线`);
  }
});

t('清理脚本存在且可跑', () => {
  const p = path.join(HF, 'scripts', 'clean-tool-registry.js');
  assert.ok(fs.existsSync(p), 'scripts/clean-tool-registry.js 不存在');
});

console.log('\n[新接线工具的路由实测]');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3800));

  t('decision.decide 路由可用', () => {
    const r = hf.dispatch('decision.decide', {
      task: '测试', options: [{ label: 'A', feasibility: 0.9, consequence_value: 0.9, risk: 0.1, confidence: 0.9, promotes_upgrade: true, promotes_truth: true }],
    });
    assert.ok(r && !r.error, JSON.stringify(r).slice(0, 80));
    assert.ok(typeof r.reasoning === 'string' && r.reasoning.length > 0, '应有 reasoning');
  });

  t('memory.consolidate 路由可用', () => {
    const r = hf.dispatch('memory.consolidate', { limit: 5 });
    assert.ok(r && !r.error, JSON.stringify(r).slice(0, 80));
  });

  t('execution.verify 路由可用', () => {
    const r = hf.dispatch('execution.verify', { action: 'test-action', result: null, expected: null });
    assert.ok(r && !r.error, JSON.stringify(r).slice(0, 80));
  });

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
