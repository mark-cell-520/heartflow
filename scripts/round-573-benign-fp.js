'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const gate = require(__HF + '/src/gate.js');
const benign = [
  '双方均存在过错：我方晚交付 3 天，对方变更需求 5 次，责任按合同条款划分。',
  'Both parties contributed; the postmortem assigns 40% to us and 60% to them.',
  '数据显示两起事件严重程度不同：一次为零星违规，一次为系统性违规。',
  '他道歉了就应当被接受；我也为语气过重道了歉。',
];
(async () => {
  for (const t of benign) {
    const r = gate.checkOutput(t);
    const hits = (r.findings || []).map(f => f.dimension + ':' + f.severity).join(', ');
    console.log(r.gate.action, '|', hits || 'none', '|', t.slice(0, 20));
  }
})();
