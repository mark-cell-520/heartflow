#!/usr/bin/env node
// r281 改号：宪法 §1.1 轮次号全局唯一
// 实测事实（fetch heartflow main 后）：
//   远端 main HEAD = d52040ec "claim: r280 by agent-4 — 时间与概率推理 wired 维度全新措辞家族扩展（真升级②）"
//   远端 r280 认领方向 = 时间与概率推理，claim_at 2026-11-10T11:20:24Z，仅 1 条，且无 commit（d52040ec 本身就是 claim 提交）
//   远端 UPGRADE_LOG 最大轮次 = r279；远端 VERSION = 6.8.162
//   → 本地产能（推理链无效推理形式）必须让位，正确轮次号 = r281
// 动作：
//   1) UPGRADE_LOG.md 顶部条目 r280 → r281（标题 + 正文中的轮次引用）
//   2) coordination/claims.jsonl 中本方向那条 r280（claim_at 11:20:00Z）→ r281
//   3) 远端那条 r280（时间与概率推理，11:20:24Z）原样保留不动（他人认领）
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);

/* ---- 1) UPGRADE_LOG.md ---- */
const UL = 'UPGRADE_LOG.md';
let ul = fs.readFileSync(UL, 'utf8');
// 只改顶部 r280 条目的标题行（首个 "## r280 —" 出现处）
const titleOld = '## r280 — 推理链无效推理形式：跨前提否定前件检测 + 中文短句单字级重叠 + 归纳/规范结论豁免（真升级②）';
const titleNew = '## r281 — 推理链无效推理形式：跨前提否定前件检测 + 中文短句单字级重叠 + 归纳/规范结论豁免（真升级②）';
if (ul.indexOf(titleOld) === -1) throw new Error('未找到 UPGRADE_LOG 顶部 r280 标题，请人工检查');
ul = ul.replace(titleOld, titleNew);
// 正文轮次引用（只改条目块内的，即前 60 行内）
const lines = ul.split('\n');
let inEntry = false, entryChanges = 0;
for (let i = 0; i < lines.length; i++) {
  if (i === 0) { inEntry = true; continue; }
  if (inEntry) {
    if (/^## r\d/.test(lines[i]) && i > 1) { inEntry = false; continue; }
    // 条目正文：r280 → r281（避开 claim_at 时间戳里的数字，不含 r280 字样）
    if (lines[i].indexOf('r280') !== -1) {
      lines[i] = lines[i].replace(/r280/g, 'r281');
      entryChanges++;
    }
  }
}
ul = lines.join('\n');
fs.writeFileSync(UL, ul);
console.log(`UPGRADE_LOG.md: 标题 r280→r281；正文轮次引用 ${entryChanges} 行`);

/* ---- 2) coordination/claims.jsonl ---- */
const CL = 'coordination/claims.jsonl';
const cl = fs.readFileSync(CL, 'utf8').split('\n').filter(l => l.trim());
let clChanged = 0;
const clOut = cl.map(line => {
  let o;
  try { o = JSON.parse(line); } catch (e) { return line; }
  if (o.round !== 'r280') return line;
  const dir = o.direction || '';
  if (dir.indexOf('推理链无效推理形式') !== -1) {
    o.round = 'r281';
    clChanged++;
    return JSON.stringify(o);
  }
  return line; // 他人 r280（时间与概率推理）不动
});
if (clChanged === 0) throw new Error('claims.jsonl 未找到本方向 r280 记录');
fs.writeFileSync(CL, clOut.join('\n') + '\n');
console.log(`claims.jsonl: 本方向 r280→r281 共 ${clChanged} 条；他人 r280 保留`);

/* ---- 3) 校验 ---- */
const verify = clOut.map(l => { try { return JSON.parse(l); } catch (e) { return null; } });
const bad = verify.filter(x => x === null).length;
console.log('claims.jsonl JSON 合法:', bad === 0, `(共 ${clOut.length} 行)`);
const r281 = verify.filter(x => x && x.round === 'r281');
const r280others = verify.filter(x => x && x.round === 'r280');
console.log(`r281 记录: ${r281.length} 条 (方向: ${(r281[0] && r281[0].direction || '').slice(0, 30)}...)`);
console.log(`r280 记录: ${r280others.length} 条 (方向: ${(r280others[0] && r280others[0].direction || '').slice(0, 30)}...)`);
const ulTop = fs.readFileSync(UL, 'utf8').split('\n')[0];
console.log('UPGRADE_LOG 首行:', ulTop);
