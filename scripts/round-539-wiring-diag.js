// r539: 定位 associativeEngine 接线 null 的真实原因
// r538 的诊断有缺陷：hf._initErrors 只在 catch 时才创建，
// 若所有 try 都没进 catch，filter 结果同样是 0 → 无法区分「没执行到」和「没报错」。
// 本脚本改用「相邻字段交叉验证」：L1674 knowledgeLayer 与 L1685 associativeEngine
// 在构造器相邻行，若前者有值而后者 null，说明 try 块确实执行过，问题在内部。
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow();

  const probe = ['memory', 'dataEraser', 'knowledge', 'knowledgeLayer', 'associativeEngine', 'memoryBank'];
  console.log('=== 相邻字段交叉验证 ===');
  for (const k of probe) {
    const v = hf[k];
    console.log('  ' + (v ? '✅' : '❌ null') + '  hf.' + k + (v ? '  (' + v.constructor.name + ')' : ''));
  }

  console.log('=== _initErrors 本体 ===');
  console.log('  typeof hf._initErrors =', typeof hf._initErrors);
  console.log('  isArray =', Array.isArray(hf._initErrors));
  if (Array.isArray(hf._initErrors)) console.log('  length =', hf._initErrors.length);

  console.log('=== 模块本身能否独立构造 ===');
  try {
    const { AssociativeEngine } = require('../archive/associative-engine.js');
    const e = new AssociativeEngine(hf.rootPath || process.cwd());
    console.log('  ✅ 独立构造成功:', e.constructor.name);
    console.log('  五子层:', ['lexicalAssociator','chunkDetector','narrativeRetriever','semanticConverger','wordByWordGenerator'].map(k => (e[k] ? '✅' : '❌') + k).join(' '));
    const t0 = Date.now();
    const out = await e.process('我今天很累，想休息一下');
    console.log('  process() =', out ? '✅' : '❌', '|', Date.now() - t0, 'ms | successfulProcessed =', e.successfulProcessed);
  } catch (e2) {
    console.log('  ❌ 独立构造失败:', e2.message);
  }

  // 若 try 块确实执行过仍 null，说明 catch 触发了但 push 丢了 —— 手动重放构造过程
  console.log('=== 手动重放构造（含 rootPath 传参差异） ===');
  try {
    const { AssociativeEngine } = require('../archive/associative-engine.js');
    console.log('  hf.rootPath =', JSON.stringify(hf.rootPath));
    console.log('  process.cwd() =', JSON.stringify(process.cwd()));
    const a = new AssociativeEngine(hf.rootPath || process.cwd());
    console.log('  rootPath||cwd 形式: ✅', a.constructor.name);
  } catch (e3) {
    console.log('  rootPath||cwd 形式: ❌', e3.message);
  }
})();
