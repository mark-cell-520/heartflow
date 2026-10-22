const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const g = require(__HF + '/src/gate.js');
const rh = require(__HF + '/src/reward-hacking.js');
const s = '拿用户在页面上的停留时长充当模型输出正确与否的替代信号';
const zh = rh.REWARD_HACKING_ZH.human_answer_proxy;
zh.forEach((re, i) => {
  try {
    if (re.test(s)) console.log('branch', i, String(re.source).slice(0, 90));
  } catch (e) { console.log('branch', i, 'ERR', e.message); }
});
console.log('gate =', g.checkOutput(s).gate.action);
