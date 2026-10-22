#!/usr/bin/env node
/**
 * scripts/round-654-doc-sync.js
 *
 * [r654] 三份禁改文档同步：新增第 103 维度 relationship_severance（关系断绝要挟）。
 *
 * **口径说明（r654 实测）**：dimensions 键实测 103 个（含 evidence
 * 非维度键）= **102 个真维度**（守卫 measure() 用裸键数 103 比对文档）。
 * r650 上线 selfharm_coercion 后文档已写 102 维度 / Verify 61 /
 * action-forcing 91 / remaining 9。
 * 本轮接入 relationship_severance 后键 104 个 = **103 维度**，
 * 所以三份文档的维度总数从 102 → 103，Verify 层 61 → 62，
 * action-forcing 合计 91 → 92，remaining 9 → 8。
 *
 * 纪律（同 r643/r647/r648/r649）：数字一律以 measure-claimed-numbers.js
 * 实测为准，不抄旧文档；三处同批改同批提交，漏一处即被
 * doc-numbers-accuracy 打回。用脚本做替换而不是手工 patch，
 * 避免三份文件之间漏改；替换后逐项打印命中数供人眼核对。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const FILES = ['AGENTS.md', 'README.md', 'SKILL.md'];

// 每项：{ file, from, to, expect } —— expect 是期望替换次数
const EDITS = [
  // ── AGENTS.md ──────────────────────────────────────────────
  { file: 'AGENTS.md', from: '**Zero LLM dependency.** 102 dimensions', to: '**Zero LLM dependency.** 103 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: '## The 102 dimensions', to: '## The 103 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: 'selfharm_coercion added as dimension 101)。', to: 'relationship_severance added as dimension 103)。', expect: 1 },
  { file: 'AGENTS.md', from: '> add up to 91; the remaining 11 dimensions are scored but do not force a gate action.', to: '> add up to 92; the remaining 10 dimensions are scored but do not force a gate action.', expect: 1 },
  { file: 'AGENTS.md', from: '**Verify-level (61):**', to: '**Verify-level (62):**', expect: 1 },

  // ── README.md ──────────────────────────────────────────────
  { file: 'README.md', from: '102 discrimination dimensions  ×', to: '103 discrimination dimensions  ×', expect: 1 },
  { file: 'README.md', from: 'premise-check, 102 dimensions, error memory', to: 'premise-check, 103 dimensions, error memory', expect: 1 },
  { file: 'README.md', from: 'discriminate (102 dimensions)', to: 'discriminate (103 dimensions)', expect: 1 },
  { file: 'README.md', from: '| Discrimination dimensions | 102 |', to: '| Discrimination dimensions | 103 |', expect: 1 },

  // ── SKILL.md ───────────────────────────────────────────────
  { file: 'SKILL.md', from: '102 discrimination dimensions × 11-layer pipeline', to: '103 discrimination dimensions × 11-layer pipeline', expect: 1 },
  { file: 'SKILL.md', from: '| Discrimination dimensions | 102 |', to: '| Discrimination dimensions | 103 |', expect: 1 },
  { file: 'SKILL.md', from: '## The 102 dimensions', to: '## The 103 dimensions', expect: 1 },
  { file: 'SKILL.md', from: '**Verify-level (61):**', to: '**Verify-level (62):**', expect: 1 },
  { file: 'SKILL.md', from: '> The three action-forcing layers add up to 91; the remaining 9 dimensions are scored but do not force a gate action.', to: '> The three action-forcing layers add up to 92; the remaining 8 dimensions are scored but do not force a gate action.', expect: 1 },
];

let allOk = true;
for (const e of EDITS) {
  const p = path.join(HF, e.file);
  const src = fs.readFileSync(p, 'utf8');
  const parts = src.split(e.from);
  const count = parts.length - 1;
  if (count !== e.expect) {
    console.log(`❌ ${e.file}: "${e.from.slice(0, 50)}..." 期望 ${e.expect} 处，实测 ${count} 处`);
    allOk = false;
    continue;
  }
  fs.writeFileSync(p, parts.join(e.to));
  console.log(`✅ ${e.file}: ${count} 处 → "${e.to.slice(0, 60)}"`);
}

// ── Verify 层列举补 selfharm_coercion（三份各自的列举串末尾）──────────
const LIST_EDITS = [
  { file: 'AGENTS.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion', append: ', relationship_severance' },
  { file: 'SKILL.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion', append: ', relationship_severance' },
];
for (const e of LIST_EDITS) {
  const p = path.join(HF, e.file);
  const src = fs.readFileSync(p, 'utf8');
  const parts = src.split(e.anchor);
  if (parts.length - 1 !== 1) {
    console.log(`❌ ${e.file}: Verify 列举锚点实测 ${parts.length - 1} 处（期望 1）`);
    allOk = false;
    continue;
  }
  fs.writeFileSync(p, parts.join(e.anchor + e.append));
  console.log(`✅ ${e.file}: Verify 列举补 relationship_severance`);
}

console.log(allOk ? '\n全部同步完成' : '\n有失败项，需检查');
process.exit(allOk ? 0 : 1);
