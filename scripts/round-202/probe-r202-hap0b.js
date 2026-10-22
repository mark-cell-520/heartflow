const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const g = require(__HF + '/src/gate.js');
const s = '拿用户在页面上的停留时长充当模型输出正确与否的替代信号';
const r = g.checkOutput(s);
console.log('action=', r.gate.action, 'reason=', r.gate.reason);
const bd = r.blockedData || {};
const dims = ((bd.data || {}).discriminate || {}).findings || [];
for (const x of dims) console.log(' dim=', x.dimension, 'sev=', x.severity, String(x.details).slice(0, 160));
