// r539: 用正确的启动契约复测 associativeEngine 接线
// 根因（r538 误判）：接线代码在 start() 内（L1679），不是 constructor 里。
// HeartFlow 的字段是 "null until start"（L1297 注释 + L1572 if(this.started) return）。
// r538 的探测脚本只 new HeartFlow() 不调 start()，所以所有字段都是 null，
// 包括仓库本来就正常的 memory/knowledge —— 那不是接线失效，是调用契约错了。
const { HeartFlow } = require('../src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow();
  hf.start();

  console.log('=== 相邻字段交叉验证（start 后）===');
  const probe = ['memory', 'dataEraser', 'knowledge', 'knowledgeLayer', 'associativeEngine', 'memoryBank'];
  let allOk = true;
  for (const k of probe) {
    const v = hf[k];
    if (!v) allOk = false;
    console.log('  ' + (v ? '✅' : '❌ null') + '  hf.' + k + (v ? '  (' + v.constructor.name + ')' : ''));
  }

  console.log('=== _initErrors ===');
  const errs = (hf._initErrors || []).filter(x => x.module === 'associativeEngine');
  console.log('  associativeEngine 相关错误 =', errs.length);
  if (errs.length) console.log('  ', JSON.stringify(errs));

  if (hf.associativeEngine) {
    const e = hf.associativeEngine;
    console.log('=== 五子层 ===');
    console.log('  ', ['lexicalAssociator','chunkDetector','narrativeRetriever','semanticConverger','wordByWordGenerator'].map(k => (e[k] ? '✅' : '❌') + k).join(' '));

    console.log('=== process() 端到端 ===');
    const t0 = Date.now();
    const out = await e.process('我今天很累，想休息一下');
    console.log('  返回 =', out ? '✅' : '❌', '|', Date.now() - t0, 'ms');
    console.log('  successfulProcessed =', e.successfulProcessed);
    console.log('  keys =', out && typeof out === 'object' ? Object.keys(out).join(',') : typeof out);
  }

  console.log('=== 结论 ===');
  console.log('  接线状态 =', allOk ? '✅ 全部字段已实例化（r538 的「接线没生效」是探测脚本契约错误）' : '❌ 仍有字段为 null');
})();
