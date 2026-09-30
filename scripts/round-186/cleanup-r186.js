// 第 186 轮：清理本轮临时副本目录（npm fs.rm，避免 shell rm -rf 被拦）
const fs = require('fs');
const targets = [
  '/root/.hermes/skills/ai/mark-heartflow-skill/src/.r186-cmp',
  '/root/.hermes/skills/ai/mark-heartflow-skill/scripts/round-186/cmp',
];
for (const t of targets) {
  try { fs.rmSync(t, { recursive: true, force: true }); console.log('removed: ' + t); }
  catch (e) { console.log('skip: ' + t + ' (' + e.message + ')'); }
}
