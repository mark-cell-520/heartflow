#!/usr/bin/env node
/**
 * scripts/round-648-doc-sync.js
 *
 * [r648] 三份禁改文档同步：新增第 101 维度 investment_as_debt。
 * 维度总数 99→100（AGENTS/README/SKILL）、Verify 层 58→59 并补
 * investment_as_debt、action-forcing 合计 88→89、remaining 11→10。
 *
 * 纪律（同 r643/r647）：数字一律以 measure-claimed-numbers.js 实测为准，
 * 不抄旧文档；三处同批改同批提交，漏一处即被 doc-numbers-accuracy 打回。
 * 用脚本做替换而不是手工 patch，避免三份文件之间漏改；替换后逐项打印
 * 命中数供人眼核对。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const FILES = ['AGENTS.md', 'README.md', 'SKILL.md'];

// 每项：{ file, from, to, expect } —— expect 是期望替换次数
const EDITS = [
  // ── AGENTS.md ──────────────────────────────────────────────
  { file: 'AGENTS.md', from: '**Zero LLM dependency.** 99 dimensions', to: '**Zero LLM dependency.** 100 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: '## The 99 dimensions', to: '## The 100 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: 'commitment_coercion added as dimension 100。', to: 'investment_as_debt added as dimension 101。', expect: 1 },
  { file: 'AGENTS.md', from: 'add up to 88; the remaining 11 dimensions', to: 'add up to 89; the remaining 10 dimensions', expect: 1 },

  // ── README.md ──────────────────────────────────────────────
  { file: 'README.md', from: '99 discrimination dimensions', to: '100 discrimination dimensions', expect: 1 },
  { file: 'README.md', from: 'premise-check, 99 dimensions, error memory', to: 'premise-check, 100 dimensions, error memory', expect: 1 },
  { file: 'README.md', from: 'discriminate (99 dimensions)', to: 'discriminate (100 dimensions)', expect: 1 },
  { file: 'README.md', from: '| Discrimination dimensions | 99 |', to: '| Discrimination dimensions | 100 |', expect: 1 },

  // ── SKILL.md ───────────────────────────────────────────────
  { file: 'SKILL.md', from: '99 discrimination dimensions × 11-layer pipeline', to: '100 discrimination dimensions × 11-layer pipeline', expect: 1 },
  { file: 'SKILL.md', from: '| Discrimination dimensions | 99 |', to: '| Discrimination dimensions | 100 |', expect: 1 },
  { file: 'SKILL.md', from: '## The 99 dimensions', to: '## The 100 dimensions', expect: 1 },
  { file: 'SKILL.md', from: 'separate from the 99 text dimensions', to: 'separate from the 100 text dimensions', expect: 1 },
  { file: 'SKILL.md', from: 'add up to 88; the remaining 11 dimensions', to: 'add up to 89; the remaining 10 dimensions', expect: 1 },
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

// ── Verify 层列举补 investment_as_debt（三份各自的列举串末尾）──────────
const LIST_EDITS = [
  { file: 'AGENTS.md', anchor: 'sunk_cost_coercion, commitment_coercion', append: ', investment_as_debt' },
  { file: 'SKILL.md', anchor: 'sunk_cost_coercion, commitment_coercion', append: ', investment_as_debt' },
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
  console.log(`✅ ${e.file}: Verify 列举补 investment_as_debt`);
}

// Verify-level 计数 58→59
for (const f of ['AGENTS.md', 'SKILL.md']) {
  const p = path.join(HF, f);
  const src = fs.readFileSync(p, 'utf8');
  const parts = src.split('**Verify-level (58):**');
  if (parts.length - 1 !== 1) {
    console.log(`❌ ${f}: Verify-level (58) 锚点实测 ${parts.length - 1} 处`);
    allOk = false;
    continue;
  }
  fs.writeFileSync(p, parts.join('**Verify-level (59):**'));
  console.log(`✅ ${f}: Verify-level 计数 58→59`);
}

console.log(allOk ? '\n全部同步完成' : '\n有失败项，需检查');
process.exit(allOk ? 0 : 1);
