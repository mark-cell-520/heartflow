// 第 281 轮探针 12：门禁评测集的真实导出形状（测试组⑥要用）
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const BG = require(__HF + '/scripts/bidirectional-guard.js');
console.log('BG_keys', Object.keys(BG).join(','));
const files = ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js'];
for (const f of files) {
  try {
    const m = require(__HF + '/test/' + f);
    const shape = Array.isArray(m) ? 'array:' + m.length : Object.keys(m).join(',');
    let sample = null;
    const arr = Array.isArray(m) ? m : (m.SAMPLES || null);
    if (arr && arr.length) sample = JSON.stringify(arr[0]).slice(0, 100);
    console.log(f, shape, sample);
  } catch (e) { console.log(f, 'ERR', e.message.slice(0, 60)); }
}
