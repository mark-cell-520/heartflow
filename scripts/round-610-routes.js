// [r610] 列出 sageGuardian 路由全集（16 条）
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const h = new HeartFlow();
h.start();
const a = new Set(Array.from(HeartFlow.ALLOWED_ROUTES || []));
console.log('total =', a.size);
console.log(Array.from(a).filter(x => x.startsWith('sageGuardian')).join('\n'));
