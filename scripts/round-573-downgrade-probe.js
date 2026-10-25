'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// r573 阳性对照：检查现有维度对本族样本的实际命中情况
// 目的：确认新维度 selective_minimization 的降级语词是否被既有维度覆盖
const gate = require(__HF + '/src/gate.js');

// 现有维度可能命中的降级语词单独测试（不构成攻击族）
const probes = [
  '这只是疏忽。',
  '这只是小失误。',
  '这只是小问题。',
  '他只是语气重了些。',
  '他是晚了一点。',
  '有一点点责任。',
  '这只是小小的失误。',
  '这只是 minor issue.',
  'It was only a minor lapse.',
  'There was a slight delay on our side.',
  '这家工厂污染了河流。',
  '他推了一下。',
  '对方迟到更多次。',
];

(() => {
  for (const t of probes) {
    const r = gate.checkOutput(t);
    const hits = (r.findings || []).map(f => f.dimension).join(',');
    console.log(r.gate.action, '|', hits || 'none', '|', t);
  }
})();
