// r538: 验证引擎实例上的 associativeEngine 接线是否真生效
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  console.log('hf.associativeEngine =', hf.associativeEngine ? '✅ 已实例化' : '❌ null');
  if (hf.associativeEngine) {
    const e = hf.associativeEngine;
    console.log('  constructor =', e.constructor.name);
    console.log('  五子层 =', ['lexicalAssociator','chunkDetector','narrativeRetriever','semanticConverger','wordByWordGenerator'].map(k => (e[k] ? '✅' : '❌') + k).join(' '));
    const out = await e.process('我今天很累，想休息一下');
    console.log('  process() =', out ? '✅ 返回' : '❌ 空', '| keys =', out && typeof out === 'object' ? Object.keys(out).join(',') : typeof out);
    console.log('  successfulProcessed =', e.successfulProcessed);
  }
  const errs = (hf._initErrors || []).filter(x => x.module === 'associativeEngine');
  console.log('接线初始化错误 =', errs.length);
})();
