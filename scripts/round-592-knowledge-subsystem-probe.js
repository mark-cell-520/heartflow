/**
 * r592 探针二：确认 KnowledgeSubsystem 内的图存储位置与持久化路径
 */
const ROOT = __HF;
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
(async () => {
  const { HeartFlow } = require(ROOT + '/src/core/heartflow.js');
  const hf = new HeartFlow({ rootPath: ROOT });
  hf.start();
  const k = hf.knowledge;
  console.log('knowledge class:', k.constructor.name);
  console.log('graphAdapter present:', !!k.graphAdapter);
  const kg = k.graphAdapter && k.graphAdapter.kg;
  console.log('underlying kg class:', kg && kg.constructor.name);
  console.log('underlying kg dataDir:', JSON.stringify(kg && kg.dataDir));
  k.addEdge('probe-s', 'probe-p', 'probe-o', 0.8);
  console.log('query after addEdge (subsystem):', k.query({ subject: 'probe-s' }).length);
  console.log('graphQuery after addEdge:', k.graphQuery({ subject: 'probe-s' }).length);
  console.log('searchEntities(probe):', k.searchEntities('probe').join(','));
  console.log('ontology domains:', k.getStats().totalDomains !== undefined ? k.getStats().totalDomains : Object.keys(k.getStats()));
  // persistence path
  const fs = require('fs');
  const p = path.join(ROOT, 'data', 'ontology', 'knowledge-graph-adapter.json');
  console.log('adapter persist file exists:', fs.existsSync(p));
  const p2 = path.join(ROOT, 'data', 'ontology');
  console.log('data/ontology listing:', fs.existsSync(p2) ? fs.readdirSync(p2).slice(0, 10) : 'missing');
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
