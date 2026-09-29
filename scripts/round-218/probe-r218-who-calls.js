// 第 218 轮探针 2：decision.evaluate 在真实心虫链路里是否被调、被谁 catch 吞掉
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  // 找到 decision router 实例
  const cands = [];
  const seen = new Set();
  const walk = (obj, depth, keyPath) => {
    if (!obj || typeof obj !== 'object' || depth > 3 || seen.has(obj)) return;
    seen.add(obj);
    for (const k of Object.keys(obj)) {
      let v;
      try { v = obj[k]; } catch { continue; }
      if (!v || typeof v !== 'object') continue;
      const ctorName = v.constructor && v.constructor.name;
      if (ctorName === 'DecisionRouter') cands.push({ keyPath: keyPath + '.' + k, hasEval: typeof v.evaluate === 'function' });
      else if (depth < 3 && k !== 'parent' && k !== '_ced') walk(v, depth + 1, keyPath + '.' + k);
    }
  };
  walk(hf, 0, 'hf');
  console.log('PROBE2-INSTANCES:' + JSON.stringify(cands));

  // 统计 evaluate 抛错次数：monkey-patch 太复杂，直接看 _initErrors 与 decide 路径
  const errs = (hf._initErrors || []).filter(e => e.module === 'optional').map(e => e.error);
  console.log('PROBE2-INITERRS:' + JSON.stringify(errs.slice(0, 6)));
})();
