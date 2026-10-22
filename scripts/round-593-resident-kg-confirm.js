/**
 * [round 593] 常驻 KnowledgeGraph 实例探测：证实 heartflow_knowledge_graph
 * 的 handler 每次 new 装饰实例、tools-registry 无定义 —— 坏接线确认探针。
 */
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow({ rootPath: process.cwd() });
  await hf.init ? hf.init() : null;

  const kg = hf.knowledge;
  console.log('hf.knowledge 构造函数:', kg && kg.constructor && kg.constructor.name);
  console.log('方法清单:', kg ? Object.getOwnPropertyNames(Object.getPrototypeOf(kg)).filter(m => m !== 'constructor').join(', ') : 'N/A');

  // 1. 常驻图谱活性：addEdge -> query 跨调用可见
  if (kg && typeof kg.addEdge === 'function') {
    const s = 'probe-s-' + Date.now();
    const o = 'probe-o-' + Date.now();
    kg.addEdge(s, 'probe-pred', o, 0.9);
    const hits = kg.query({ subject: s });
    console.log('addEdge 后 query 命中:', Array.isArray(hits) ? hits.length : JSON.stringify(hits));
    const ent = kg.searchEntities('probe-s');
    console.log('searchEntities 命中:', Array.isArray(ent) ? ent.length : JSON.stringify(ent));
    const rel = kg.getRelated(s, 2);
    console.log('getRelated 返回:', Array.isArray(rel) ? `数组 len=${rel.length}` : JSON.stringify(rel).slice(0, 200));
  } else {
    console.log('⛔ hf.knowledge 无 addEdge');
  }

  // 2. dataDir / 持久化
  const ga = kg && kg.graphAdapter;
  console.log('graphAdapter.dataDir:', ga && ga.dataDir ? ga.dataDir : 'N/A');

  // 3. 旧 handler 症状复现：new KnowledgeGraph({silent:true}) 是否真蒸发
  const { KnowledgeGraph } = require('../src/memory/knowledge-graph.js');
  const bad = new KnowledgeGraph({ silent: true });
  bad.addEdge('X', 'r', 'Y');
  console.log('坏实例 query 命中:', (bad.query({ subject: 'X' }) || []).length, '(预期 0 = 写入蒸发)');
  process.exit(0);
})();
