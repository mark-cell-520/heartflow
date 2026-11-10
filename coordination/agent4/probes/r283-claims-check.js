// r283 轮次辅助：校验 claims.jsonl 每行 JSON 合法 + 输出轮次号盘点
const fs = require('fs');
const path = 'coordination/claims.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n').filter((s) => s.trim());
let bad = 0;
const rounds = new Set();
for (const ln of lines) {
  try {
    const o = JSON.parse(ln);
    if (o && o.round) rounds.add(String(o.round));
  } catch (e) {
    bad++;
    console.error('非法行:', ln.slice(0, 80));
  }
}
console.log(`总行数=${lines.length} 非法行=${bad}`);
const nums = [...rounds].map((r) => parseInt(r.replace(/\D/g, ''), 10)).filter((n) => !Number.isNaN(n));
console.log('claims 中出现过的轮次号最大值:', Math.max(...nums));
// UPGRADE_LOG "## rNNN" 头
const log = fs.readFileSync('UPGRADE_LOG.md', 'utf8').split('\n');
const logRounds = [];
for (const ln of log) {
  const m = ln.match(/^##\s*r(\d+)\b/);
  if (m) logRounds.push(parseInt(m[1], 10));
}
console.log('UPGRADE_LOG ## rNNN 头最大值:', Math.max(...logRounds), ' 个数:', logRounds.length);
console.log('=> next_round 应为:', Math.max(Math.max(...nums), Math.max(...logRounds)) + 1);
