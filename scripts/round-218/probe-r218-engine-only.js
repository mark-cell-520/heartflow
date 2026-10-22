// 第 218 轮诊断 4：测试文件结构没问题，但顶层同步代码跑完后 IIFE 异步还没结束进程就退了？
// 手动重放：只跑引擎段，看 finish 是否被调用
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
(async () => {
  const hf = new HeartFlow();
  console.log('STARTING...');
  await hf.start();
  console.log('STARTED');
  const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
  console.log('THOUGHT_DONE hasSV=' + !!r._selfVerification);
  console.log('DONE_MARKER');
  process.exit(0);
})();
