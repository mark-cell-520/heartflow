// r633: 复测缺口 —— daoDecision 是「pipeline 有消费但 dispatch 零路由」。
// 关键判定：pipeline.js L164 每次 new 临时实例 → _stats 永不累计；
// MCP handler 用 engine.daoDecision（常驻）→ 两套统计分裂。
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const rt = Array.isArray(hf.routes()) ? hf.routes() : (hf.routes().routes || []);
  console.log('R633_GAP');
  console.log('daoDecision_routes=' + rt.filter(r => r.startsWith('daoDecision.')).length);
  console.log('modulesKey=' + (hf._modules.daoDecision ? 1 : 0));
  try {
    hf.dispatch('daoDecision.evaluate', { text: '你必须听我的，不要问' });
    console.log('dispatch_evaluate=OK');
  } catch (e) { console.log('dispatch_evaluate=THREW: ' + e.message.slice(0, 80)); }
  // 统计分裂实测：pipeline 用临时实例，常驻实例 stats 应保持 0
  hf.daoDecision.evaluate({ text: 'test' });
  console.log('resident_stats_before=' + JSON.stringify(hf.daoDecision.getStats()));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
