#!/usr/bin/env node
// r280 认领登记：把远端 agent-4 的 r280 claim 落到本地 claims.jsonl（本地未同步到）
// 依据：远端 heartflow/main d52040ec "claim: r280 by agent-4"，claim_at 2026-11-10T11:20Z
'use strict';
const fs = require('fs');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);
const FILE = 'coordination/claims.jsonl';
const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(l => l.trim());

const has = lines.some(l => { try { return JSON.parse(l).round === 'r280'; } catch (e) { return false; } });
if (has) { console.log('r280 认领已在场，跳过'); process.exit(0); }

const entry = {
  round: 'r280',
  agent: 'agent-4',
  kind: 'dimension',
  direction: '推理链无效推理形式：跨前提否定前件检测 + 中文短句单字级重叠通道 + 归纳/规范结论豁免（真升级②/④）：inference-chain 从零 dispatch stub 接成 MCP 工具 #185 heartflow_reasoning，补 _negatedByOther 跨前提否定前件、_cjkLen/_charOverlapChar 单字重叠通道、_isNormativeConclusion/_isInductiveGeneralization 双豁免腿、_splitConditional 倒装条件句解；维度计数 243 不变',
  claim_at: '2026-11-10T11:20:00Z',
  expires_hours: 6,
  status: 'active',
};
lines.push(JSON.stringify(entry));
fs.writeFileSync(FILE, lines.join('\n') + '\n');
console.log('已追加 r280 认领（claim_at 2026-11-10T11:20:00Z）');
