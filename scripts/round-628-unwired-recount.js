// r628 全面复测：哪些 instance 不在 _modules（= dispatch 不可达）
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const mods = hf._modules || {};
  const keys = new Set(Object.keys(mods));
  // 扫 hf 上的所有实例字段（非函数、对象）
  const instFields = [];
  for (const [k, v] of Object.entries(hf)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && k !== '_modules' && k !== '_configSystem' && k !== 'config') {
      instFields.push(k);
    }
  }
  const unwired = instFields.filter(k => !keys.has(k));
  console.log('RESULT' + JSON.stringify({
    modulesCount: keys.size,
    instFieldCount: instFields.length,
    unwired,
    unwiredCount: unwired.length,
  }));
  process.exit(0);
})();
