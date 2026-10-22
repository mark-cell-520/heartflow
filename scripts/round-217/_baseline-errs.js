// 第 217 轮：HEAD 版源码的 initErrors 基线探针
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
const hf = new HeartFlow();
(async () => {
  try {
    await hf.start();
    await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
    const errs = (hf._initErrors || []).filter(e => e.module === 'optional').map(e => e.error);
    console.log('BASELINE_ERRS:' + JSON.stringify(errs));
  } catch (e) { console.log('BASELINE_FATAL:' + e.message); }
})();
