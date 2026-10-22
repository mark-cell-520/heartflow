/**
 * [round 593] 探测 hf.knowledge 的真实构造路径：init() 未调用？
 * 打印 _modules['knowledgeSubsystem']、knowledge 是否 null，以及是否需要 initAsync。
 */
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow({ rootPath: process.cwd() });
  console.log('构造后 hf.knowledge:', hf.knowledge === null ? 'null' : (hf.knowledge.constructor && hf.knowledge.constructor.name));
  console.log('构造后 _modules keys:', Object.keys(hf._modules || {}).join(','));
  if (typeof hf.init === 'function') {
    try {
      const r = hf.init();
      if (r && typeof r.then === 'function') await r;
      console.log('init 完成');
    } catch (e) { console.log('init 抛错:', e.message); }
  } else {
    console.log('无 hf.init 方法');
  }
  console.log('init 后 hf.knowledge:', hf.knowledge === null ? 'null' : (hf.knowledge.constructor && hf.knowledge.constructor.name));
  console.log('init 后 _modules keys:', Object.keys(hf._modules || {}).join(','));
  const k = hf._modules && hf._modules['knowledgeSubsystem'];
  console.log('_modules.knowledgeSubsystem:', k ? (k.constructor && k.constructor.name) : 'N/A');
  if (k) {
    k.addEdge('probe-a-' + Date.now(), 'probe-p', 'probe-b-' + Date.now(), 0.9);
    console.log('kg query 命中:', (k.query({ subject: 'probe-a' }) || []).length);
    console.log('graphAdapter.dataDir:', k.graphAdapter && k.graphAdapter.dataDir);
  }
  process.exit(0);
})();
