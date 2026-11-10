#!/usr/bin/env node
// r280 claims.jsonl 撞号治理
// 事实（实测）：
//  - 远端 heartflow/main 的 claims.jsonl 只持有 r280@11:20:00Z（方向=推理链无效推理形式），与本地产能同向 → r280 号正确归属本地产能
//  - 工作区合并后多出本地陈旧记录 r280@11:20:24Z（方向=时间与概率推理），该方向已被远端 r279 统计素养覆盖
//  - 远端 UPGRADE_LOG 最大轮次 = r279，远端 VERSION = 6.8.162 → 远端尚未落地任何 r280 产能
// 裁决：保留本方向 r280（11:20:00Z，已在远端 main，不动）；本地陈旧记录改为 status=superseded 并注明撞号，
//       保留为历史记录不删除（r227 教训：不丢弃记录）。
'use strict';
const fs = require('fs');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);
const FILE = 'coordination/claims.jsonl';
const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(l => l.trim());

let changed = 0;
const out = lines.map(line => {
  let o;
  try { o = JSON.parse(line); } catch (e) { return line; }
  if (o.round !== 'r280') return line;
  const dir = o.direction || '';
  if (dir.indexOf('推理链无效推理形式') !== -1) {
    // 本方向认领：确保 active 且在远端 main 中
    if (o.status !== 'active') { o.status = 'active'; changed++; }
    return JSON.stringify(o);
  }
  // 本地陈旧撞号记录：时间与概率推理
  if (o.status !== 'superseded') {
    o.status = 'superseded';
    o.note = (o.note ? o.note + ' | ' : '') + '撞号治理：r280 号由同向产能（推理链无效推理形式，claim_at 2026-11-10T11:20:00Z，已在远端 heartflow/main）持有，本条为本地陈旧记录，本方向已由远端 r279 统计素养覆盖；保留为历史记录不删除';
    changed++;
  }
  return JSON.stringify(o);
});

if (changed > 0) {
  fs.writeFileSync(FILE, out.join('\n') + '\n');
  console.log(`claims.jsonl 撞号治理：更新 ${changed} 条 r280 记录`);
} else {
  console.log('claims.jsonl 撞号治理：无需更新');
}
const r280 = out.filter(l => { try { return JSON.parse(l).round === 'r280'; } catch (e) { return false; } });
console.log(`r280 记录共 ${r280.length} 条:`);
r280.forEach(l => { const o = JSON.parse(l); console.log(`  status=${o.status} claim_at=${o.claim_at} dir=${(o.direction||'').slice(0,40)}`); });
