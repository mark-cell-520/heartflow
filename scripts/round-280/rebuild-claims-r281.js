#!/usr/bin/env node
// r281 claims.jsonl 重建（修复 resolve-uu-r280.js 的数据丢失 bug）
// 丢失原因：上一版以 worktree 优先 + (round|kind|claim_at) 键去重，远端独有记录
// （r223/r225/r253/r267 各 1 条 + r280 时间与概率推理）不在本地任何来源中 → 被丢。
// 正确策略：远端 claims.jsonl 为权威 base（保留其全部行，含他人 r280），
// 再按「整行规范化内容」去重追加本地独有记录（含本方向 r281 认领）。
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);

function readBlob(ref, f) {
  const r = spawnSync('git', ['cat-file', '-p', `${ref}:${f}`], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git cat-file ${ref}:${f} failed: ${r.stderr}`);
  return r.stdout.toString('utf8');
}

const CL = 'coordination/claims.jsonl';
const remote = readBlob('heartflow/main', CL);
const wt = fs.readFileSync(CL, 'utf8');

function norm(line) {
  // 规范化去重键：解析后按稳定字段序列化（键顺序无关），失败则原串
  try {
    const o = JSON.parse(line);
    return JSON.stringify(o, Object.keys(o).sort());
  } catch (e) { return 'RAW:' + line.trim(); }
}

const out = [];
const seen = new Set();
let addedLocal = 0;
// 1) 远端全量（权威 base，含他人 r280 时间与概率推理）
for (const line of remote.split('\n')) {
  if (!line.trim()) continue;
  const k = norm(line);
  if (seen.has(k)) continue;
  seen.add(k);
  out.push(line);
}
// 2) 本地独有记录追加（含本方向 r281 认领）
for (const line of wt.split('\n')) {
  if (!line.trim()) continue;
  const k = norm(line);
  if (seen.has(k)) continue;
  seen.add(k);
  out.push(line);
  addedLocal++;
}

const result = out.join('\n') + '\n';
if (result !== wt) {
  fs.writeFileSync(CL, result);
  console.log(`claims.jsonl 重建完成：远端 base ${remote.split('\n').filter(l=>l.trim()).length} 行 + 本地独有 ${addedLocal} 行 = ${out.length} 行`);
} else {
  console.log('claims.jsonl 与重建结果一致，未改写');
}

/* 校验 */
const parsed = out.map(l => { try { return JSON.parse(l); } catch (e) { return null; } });
const bad = parsed.filter(x => x === null).length;
if (bad) { console.error(`FATAL: ${bad} 行非法 JSON`); process.exit(1); }
console.log('JSON 全合法:', out.length, '行');

// 远端记录零丢失校验
const remoteKeys = new Set(remote.split('\n').filter(l => l.trim()).map(norm));
const missing = [...remoteKeys].filter(k => !seen.has(k));
console.log('远端记录丢失:', missing.length, '(必须为 0)');

// 轮次号唯一性检查：同一 round 不得有多个不同方向的 active 认领
const activeByRound = {};
for (const o of parsed) {
  if (o.status !== 'active') continue;
  (activeByRound[o.round] = activeByRound[o.round] || []).push(o);
}
let dupActive = 0;
for (const [r, list] of Object.entries(activeByRound)) {
  const dirs = new Set(list.map(o => (o.direction || '').slice(0, 40)));
  if (list.length > 1 && dirs.size > 1) {
    dupActive++;
    console.log(`  撞号 active: ${r} 有 ${list.length} 条不同方向认领: ${[...dirs].join(' | ').slice(0, 120)}`);
  }
}
console.log('撞号 active 轮次:', dupActive);
const r281 = parsed.filter(x => x.round === 'r281');
const r280 = parsed.filter(x => x.round === 'r280');
console.log(`r281: ${r281.length} 条 (${(r281[0]||{}).status||'-'}) dir=${((r281[0]||{}).direction||'').slice(0,30)}`);
console.log(`r280: ${r280.length} 条 (${(r280[0]||{}).status||'-'}) dir=${((r280[0]||{}).direction||'').slice(0,30)}`);
