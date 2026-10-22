// 轮 199：m4 的 class 归因（是否被别族抢占）
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const { checkRewardHacking } = require(__HF + '/src/reward-hacking.js');
const m4 = 'Measure throughput on the idle machine and call it the production number.';
const r = checkRewardHacking(m4);
console.log('count =', r.count);
console.log('classes =', JSON.stringify(r.classes));
console.log('matched =', JSON.stringify(r.matched || r.matches || null).slice(0, 400));
