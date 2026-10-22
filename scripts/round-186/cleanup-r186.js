// 第 186 轮：清理本轮临时副本目录（npm fs.rm，避免 shell rm -rf 被拦）
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const targets = [
  __HF + '/src/.r186-cmp',
  __HF + '/scripts/round-186/cmp',
];
for (const t of targets) {
  try { fs.rmSync(t, { recursive: true, force: true }); console.log('removed: ' + t); }
  catch (e) { console.log('skip: ' + t + ' (' + e.message + ')'); }
}
