// r278 探针：运行时维度/模块/路由实测（替代 node -e，cron 安全策略阻断 -e）
const path = require('path');
const HF = '/data/home/heartflow';
const { discriminate } = require(path.join(HF, 'src/index.js'));
const d = discriminate('neutral baseline text');
console.log('dims =', Object.keys(d.dimensions || {}).length);
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
hf.start();
setTimeout(() => {
  console.log('modules =', Object.keys(hf._modules || {}).length);
  console.log('routes =', HeartFlow.ALLOWED_ROUTES.size);
  process.exit(0);
}, 4000);
