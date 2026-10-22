'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  const vi = hf.valueInternalizer;

  const show = (name, fn) => {
    try { const r = fn(); console.log(name + ' => OK ' + JSON.stringify(r).slice(0, 160)); }
    catch (e) { console.log(name + ' => THROW ' + e.message); console.log('   stack: ' + String(e.stack).split('\n').slice(1, 3).join(' || ')); }
  };

  console.log('_boundaryHistory type: ' + typeof vi._boundaryHistory + ' | isArray=' + Array.isArray(vi._boundaryHistory) + ' | len=' + (vi._boundaryHistory && vi._boundaryHistory.length));
  try { console.log('_boundaryHistory content: ' + JSON.stringify(vi._boundaryHistory).slice(0, 300)); } catch (e) { console.log('_boundaryHistory stringify fail: ' + e.message); }
  console.log('');

  show('generateBoundaryRequest(null, {})', () => vi.generateBoundaryRequest(null, {}));
  show('generateBoundaryRequest({action:"x"}, undefined-context-default)', () => vi.generateBoundaryRequest({ action: 'x' }));
  show('generateBoundaryRequest("str", {})', () => vi.generateBoundaryRequest('读取文件', {}));
  show('_resolveConflict("truth","safety", undefined)', () => vi._resolveConflict('truth', 'safety', undefined));
  show('_resolveConflict("truth","safety", {})', () => vi._resolveConflict('truth', 'safety', {}));
  show('_recordDecision(true, undefined, {})', () => vi._recordDecision(true, undefined, {}));
  show('_recordDecision(true, "x", undefined)', () => vi._recordDecision(true, 'x', undefined));
  show('_recordDecision(true, "abc", {})', () => vi._recordDecision(true, 'abc', {}));

  // 检查 dispatcher 的路由生成规则（_ 前缀是否被过滤）
  const disp = require(path.join(ROOT, 'src/core/engine-dispatcher.js'));
  console.log('');
  console.log('generateAllowedRoutes 是否是函数: ' + typeof disp.generateAllowedRoutes);
  const fake = { valueInternalizer: { pub: () => {}, _priv: () => {}, getStatus: () => {} } };
  try {
    const routes = disp.generateAllowedRoutes(fake);
    console.log('generateAllowedRoutes(样例) => ' + JSON.stringify(routes));
  } catch (e) { console.log('generateAllowedRoutes 抛错: ' + e.message); }
})().catch(e => { console.error('PROBE FAIL:', e.message); });
