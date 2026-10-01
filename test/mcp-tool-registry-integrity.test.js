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
// [r313 修复] 原正则只匹配 `heartflow_x: handleFoo,` 简短引用一种形态，
// 漏掉 121 个内联箭头 handler（heartflow_x: (args) => {...}），
// 于是把内联形态的**正确** handler 判为「孤儿工具」——
// 首批撞上的是 r312 新增的 heartflow_knowledge_layer。
// 守卫漏检比守卫误报更隐蔽：它让人以为 181 个 handler 都过了门。
// 现行：逐行扫 body，顶层键（缩进正好 2 空格）按三种形态分类：
// 简短引用 / 内联箭头 / 内联 function；同一行多个键也全收。
const hb = mcpSrc.match(/const HANDLERS = \{([\s\S]*?)\n\};/);
const handlerMap = {};
const TOP = /^  '?(heartflow_\w+)'?:\s*(.*)$/;
for (const line of (hb ? hb[1] : '').split('\n')) {
  const m = line.match(TOP);
  if (!m) continue;
  // 同一行可能有多个 `heartflow_x: yy,` 并列（实测存在 dream 那一行）
  const restPairs = m[2].split(/,\s*(?=heartflow_)/);
  let first = true;
  for (let seg of restPairs) {
    const key = first ? m[1] : null;
    first = false;
    seg = seg.trim();
    let name = null, form;
    if (/^(?:async\s*)?\(/.test(seg)) { name = '(inline)'; form = 'inline-arrow'; }
    else if (/^(?:async\s*)?function\b/.test(seg)) { name = '(inline)'; form = 'inline-fn'; }
    else { const r = seg.match(/^(\w+)\s*,?$/); if (r) { name = r[1]; form = 'ref'; } }
    if (key && name) { handlerMap[key] = name; handlerMap['__form_' + key] = form; }
  }
}
// 只有真的解析出值的键才算有 handler；未出现 = 键都没解析到（真孤儿）
const wired = Object.keys(handlerMap).filter(k => !k.startsWith('__form_'));
const inlineCount = wired.filter(k => handlerMap[k] === '(inline)');

t('每个 TOOLS 都有 handler（无孤儿）', () => {
  const orphans = TOOLS.filter(x => !handlerMap[x.name]).map(x => x.name);
  assert.strictEqual(orphans.length, 0, '孤儿工具: ' + orphans.join(', '));
});

// [r313 新增] 形态 census：不许退回「只认简短引用」的半瞎状态。
// r313 实测：181 个顶层键里 59 个简短引用 + 121 个内联箭头 + 1 行内多键。
// 一个内联都认不出 = 解析器退回了 r312 那个只认引用的正则。
t('HANDLERS 解析器覆盖内联箭头形态（r313 修复回归）', () => {
  assert.ok(wired.length >= 170,
    `wired=${wired.length} 远低于实测 181 —— HANDLERS 解析大概率坏了`);
  assert.ok(inlineCount.length >= 100,
    `inline=${inlineCount.length} —— 内联箭头 handler 没被认出来（r312 缺陷的工具就是被这么误报成孤儿的）`);
  assert.ok(handlerMap['heartflow_knowledge_layer'],
    'heartflow_knowledge_layer 未被解析出 handler（内联箭头形态）');
  assert.strictEqual(handlerMap['heartflow_gate'], 'handleGate',
    '简短引用形态也应仍能解析（防止为了修内联把引用形态改坏）');
});

// [r313 新增] 行内并列键也要收到（实测 dream 那行有两个 heartflow_ 键）
t('HANDLERS 一行多键全收（r313 修复回归）', () => {
  const dreamLine = (hb ? hb[1] : '').split('\n').find(l => /heartflow_dream:/.test(l));
  assert.ok(dreamLine, '找不到 dream 那行');
  const keys = dreamLine.match(/heartflow_\w+(?=:)/g) || [];
  assert.ok(keys.length >= 2, `dream 那行只有 ${keys.length} 个键，样本不足`);
  for (const k of keys) {
    assert.ok(handlerMap[k], `行内并列键 ${k} 没被解析`);
  }
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
