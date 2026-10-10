#!/usr/bin/env node
/**
 * scripts/round-655-doc-sync.js
 *
 * [r655] 三份禁改文档同步：新增第 104 维度 fear_projection（恐惧投射服从）。
 *
 * **口径说明（r655 实测）**：dimensions 键实测 104 个（含 evidence
 * 非维度键）= **103 个真维度**（守卫 measure() 用裸键数 104 比对文档）。
 * r654 上线 relationship_severance 后文档已写 103 维度 / Verify 62 /
 * action-forcing 92 / remaining 8。
 * 本轮接入 fear_projection 后键 105 个 = **104 维度**，
 * 所以三份文档的维度总数从 103 → 104，Verify 层 62 → 63，
 * action-forcing 合计 92 → 93，remaining 8 → 7。
 *
 * 纪律（同 r643/r647/r648/r649/r654）：数字一律以 measure-claimed-numbers.js
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
  { file: 'AGENTS.md', from: '**Zero LLM dependency.** 103 dimensions', to: '**Zero LLM dependency.** 104 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: '## The 103 dimensions', to: '## The 104 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: 'relationship_severance added as dimension 103)。', to: 'fear_projection added as dimension 104)。', expect: 1 },
  { file: 'AGENTS.md', from: '> add up to 92; the remaining 10 dimensions are scored but do not force a gate action.', to: '> add up to 93; the remaining 9 dimensions are scored but do not force a gate action.', expect: 1 },
  { file: 'AGENTS.md', from: '**Verify-level (62):**', to: '**Verify-level (63):**', expect: 1 },

  // ── README.md ──────────────────────────────────────────────
  { file: 'README.md', from: '103 discrimination dimensions  ×', to: '104 discrimination dimensions  ×', expect: 1 },
  { file: 'README.md', from: 'premise-check, 103 dimensions, error memory', to: 'premise-check, 104 dimensions, error memory', expect: 1 },
  { file: 'README.md', from: 'discriminate (103 dimensions)', to: 'discriminate (104 dimensions)', expect: 1 },
  { file: 'README.md', from: '| Discrimination dimensions | 103 |', to: '| Discrimination dimensions | 104 |', expect: 1 },

  // ── SKILL.md ───────────────────────────────────────────────
  { file: 'SKILL.md', from: '103 discrimination dimensions × 11-layer pipeline', to: '104 discrimination dimensions × 11-layer pipeline', expect: 1 },
  { file: 'SKILL.md', from: '| Discrimination dimensions | 103 |', to: '| Discrimination dimensions | 104 |', expect: 1 },
  { file: 'SKILL.md', from: '## The 103 dimensions', to: '## The 104 dimensions', expect: 1 },
  { file: 'SKILL.md', from: '**Verify-level (62):**', to: '**Verify-level (63):**', expect: 1 },
  { file: 'SKILL.md', from: '> The three action-forcing layers add up to 92; the remaining 8 dimensions are scored but do not force a gate action.', to: '> The three action-forcing layers add up to 93; the remaining 7 dimensions are scored but do not force a gate action.', expect: 1 },
];

let allOk = true;
for (const e of EDITS) {
  const p = path.join(HF, e.file);
  const src = fs.readFileSync(p, 'utf8');
  const parts = src.split(e.from);
  const count = parts.length - 1;
  if (count !== e.expect) {
    console.log('FAIL ' + e.file + ': "' + e.from.slice(0, 50) + '..." expect ' + e.expect + ' got ' + count);
    allOk = false;
    continue;
  }
  fs.writeFileSync(p, parts.join(e.to));
  console.log('OK   ' + e.file + ': ' + count + ' -> "' + e.to.slice(0, 60) + '"');
}

// ── Verify 层列举补 fear_projection（三份各自的列举串末尾）──────────────
const LIST_EDITS = [
  { file: 'AGENTS.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion, relationship_severance', append: ', fear_projection' },
  { file: 'SKILL.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt, suffering_capital, selfharm_coercion, relationship_severance', append: ', fear_projection' },
];
for (const e of LIST_EDITS) {
  const p = path.join(HF, e.file);
  const src = fs.readFileSync(p, 'utf8');
  const parts = src.split(e.anchor);
  if (parts.length - 1 !== 1) {
    console.log('FAIL ' + e.file + ': Verify list anchor got ' + (parts.length - 1) + ' (expect 1)');
    allOk = false;
    continue;
  }
  fs.writeFileSync(p, parts.join(e.anchor + e.append));
  console.log('OK   ' + e.file + ': Verify list += fear_projection');
}

console.log(allOk ? '\nall synced' : '\nhave failures');
process.exit(allOk ? 0 : 1);
