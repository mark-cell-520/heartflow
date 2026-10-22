/**
 * r592 探针：引擎常驻 KnowledgeGraph 实例的真实名字与方法可用性
 */
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
(async () => {
  const { HeartFlow } = require(ROOT + '/src/core/heartflow.js');
  const hf = new HeartFlow({ rootPath: ROOT });
  const t0 = Date.now();
  hf.start();
  console.log('start ms', Date.now() - t0);
  const names = Object.keys(hf).filter(k => k === 'knowledge' || /knowledge/i.test(k)).sort();
  console.log('knowledge-ish keys:', names.join(','));
  for (const k of names) {
    const v = hf[k];
    if (v && typeof v === 'object') {
      const meths = Object.getOwnPropertyNames(Object.getPrototypeOf(v)).filter(m => m !== 'constructor');
      console.log(k, '→', v.constructor && v.constructor.name, '| methods:', meths.join(','));
    }
  }
  // dispatch 路由里有没有 knowledgeGraph.*
  let routes = [];
  try { routes = hf.routes ? (Array.isArray(hf.routes) ? hf.routes : Object.keys(hf.routes())) : []; } catch (_) {}
  console.log('routes containing knowledgeGraph:', (routes || []).filter(r => /knowledgeGraph|^knowledge\./.test(r)).slice(0, 20));
  // 常驻实例是否可用：addEdge + query
  const kg = hf.knowledge;
  if (kg && typeof kg.addEdge === 'function') {
    kg.addEdge('probe-a', 'rel', 'probe-b', 0.9);
    const q = kg.query({ subject: 'probe-a' });
    console.log('resident kg query count:', q.length, '| stats triplesAdded:', kg.getStats().triplesAdded);
    console.log('dataDir:', JSON.stringify(kg.dataDir));
  }
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
