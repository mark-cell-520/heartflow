// [r423] inferenceChain / causalInference 接线固化测试
// 防回归：两模块曾在 LATE_ADDITIONS 列表里但实例字段恒 null（死条目），
// 导致 ALLOWED_ROUTES 零命中、MCP 零工具。本测试锁死「挂载 + 路由 + dispatch 可达」。
const test = require('node:test');
const assert = require('node:assert');
const { HeartFlow } = require('../src/core/heartflow.js');

test('r423 接线：inferenceChain 与 causalInference 实例非 null 且已挂载', async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  assert.notStrictEqual(hf.inferenceChain, null, 'inferenceChain 不得再是 LATE_ADDITIONS 死条目');
  assert.notStrictEqual(hf.causalInference, null, 'causalInference 不得再是 LATE_ADDITIONS 死条目');
  assert.ok(hf._modules.inferenceChain, 'inferenceChain 必须注册进 _modules');
  assert.ok(hf._modules.causalInference, 'causalInference 必须注册进 _modules');
});

test('r423 接线：17 条路由自动生成且全部可 dispatch', async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  // r423 实测：hf.routes() 返回的是「子系统名 → 路由字符串数组」的对象表，
  // 不是扁平数组（与 r578/r601/r603 轮测试法一致，取 table[moduleName]）。
  const table = hf.routes();
  const routes = [...(table['inferenceChain'] || []), ...(table['causalInference'] || [])];
  const registered = routes.filter(r => !r.includes('[未注册'));
  const expected = [
    'inferenceChain.createChain', 'inferenceChain.addStep', 'inferenceChain.declareAssumption',
    'inferenceChain.analyze', 'inferenceChain.expandChain', 'inferenceChain.getChain',
    'inferenceChain.getStats', 'inferenceChain.clear',
    'causalInference.buildGraph', 'causalInference.trace', 'causalInference.getCauses',
    'causalInference.getEffects', 'causalInference.counterfactual',
    'causalInference.searchByCausal', 'causalInference.spreadingActivation',
    'causalInference.getStats', 'causalInference.clear',
  ];
  const missing = expected.filter(r => !registered.includes(r));
  assert.deepStrictEqual(missing, [], `缺失路由: ${missing.join(', ')}`);
  assert.strictEqual(registered.length, 17, `17 条公开路由应全部可注册，实际 ${registered.length}`);
  const stats = await hf.dispatch('inferenceChain.getStats');
  assert.ok(stats && typeof stats.totalChains === 'number', 'inferenceChain.getStats 须真实返回');
  const cstats = await hf.dispatch('causalInference.getStats');
  assert.ok(cstats && cstats.version === '2.0.0', 'causalInference.getStats 须真实返回');
});

test('r423 接线：推理链逐环节校验真实可用（肯定后件被判无效）', async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  const c = await hf.dispatch('inferenceChain.createChain', '如果下雨就取消比赛；比赛取消了；所以下雨了');
  await hf.dispatch('inferenceChain.addStep', c.id, { type: 'premise', text: '如果下雨就取消比赛' });
  await hf.dispatch('inferenceChain.addStep', c.id, { type: 'premise', text: '比赛取消了' });
  await hf.dispatch('inferenceChain.addStep', c.id, { type: 'inference', text: '所以下雨了' });
  await hf.dispatch('inferenceChain.addStep', c.id, { type: 'conclusion', text: '下雨了' });
  const r = await hf.dispatch('inferenceChain.analyze', c.id);
  assert.strictEqual(r.valid, false, '肯定后件必须判无效');
  assert.strictEqual(r.steps[0].fallacy, 'affirming_consequent', '须指明谬误类型');
});

test('r423 接线：因果图构建/追踪/反事实真实可用', async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  await hf.dispatch('causalInference.buildGraph', [
    { id: 'm1', content: '因为连续暴雨，所以水库开闸泄洪' },
    { id: 'm2', content: '水库开闸泄洪导致下游村庄被淹' },
    { id: 'm3', content: '下游村庄被淹引起灾后重建拨款' }]);
  const t = await hf.dispatch('causalInference.trace', 'm1', 'forward', 3);
  assert.ok(Array.isArray(t) && t.length >= 2, 'trace 须返回因果链');
  const cf = await hf.dispatch('causalInference.counterfactual', 'm1', '如果暴雨没有发生');
  assert.ok((cf.brokenCauses || []).length >= 1, '反事实须识别断裂因果');
});

test('r423 接线：MCP 工具 schema 与 handler 三处同步', () => {
  const { TOOLS } = require('../src/mcp/tools-registry.js');
  const names = TOOLS.map(t => t.name);
  assert.ok(names.includes('heartflow_inference_chain'), 'TOOLS 须含 heartflow_inference_chain');
  assert.ok(names.includes('heartflow_causal_inference'), 'TOOLS 须含 heartflow_causal_inference');
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(src.includes('heartflow_inference_chain: handleInferenceChainTool,'), 'HANDLERS 须映射');
  assert.ok(src.includes('heartflow_causal_inference: handleCausalInferenceTool,'), 'HANDLERS 须映射');
});
