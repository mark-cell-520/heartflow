#!/usr/bin/env node
/**
 * scripts/round-649-doc-sync.js
 *
 * [r649] 三份禁改文档同步：新增第 102 维度 suffering_capital（苦难资本化）。
 *
 * **口径说明（r649 实测修正，同上一轮）**：r648 报告称「第 101 维度」
 * investment_as_debt，但 measure-claimed-numbers.js 实测（本轮 init 时）
 * dimensions 键 101 个 = 100 维度（dimensions 含 evidence 非维度键）。
 * 本轮接入 suffering_capital 后键 102 个 = **101 维度**。所以三份文档
 * 的维度总数从 100 → 101，Verify 层 59 → 60，action-forcing 合计 89 → 90，
 * remaining 10 → 9。
 *
 * 纪律（同 r643/r647/r648）：数字一律以 measure-claimed-numbers.js 实测为准，
 * 不抄旧文档；三处同批改同批提交，漏一处即被 doc-numbers-accuracy 打回。
 * 用脚本做替换而不是手工 patch，避免三份文件之间漏改；替换后逐项打印
 * 命中数供人眼核对。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const HF = __HF;

const FILES = ['AGENTS.md', 'README.md', 'SKILL.md'];

// 每项：{ file, from, to, expect } —— expect 是期望替换次数
const EDITS = [
  // ── AGENTS.md ──────────────────────────────────────────────
  { file: 'AGENTS.md', from: '**Zero LLM dependency.** 100 dimensions', to: '**Zero LLM dependency.** 101 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: '## The 100 dimensions', to: '## The 101 dimensions', expect: 1 },
  { file: 'AGENTS.md', from: 'investment_as_debt added as dimension 101)。', to: 'suffering_capital added as dimension 102)。', expect: 1 },
  { file: 'AGENTS.md', from: '> add up to 89; the remaining 11 dimensions are scored but do not force a gate action.', to: '> add up to 90; the remaining 10 dimensions are scored but do not force a gate action.', expect: 1 },
  { file: 'AGENTS.md', from: '**Verify-level (59):**', to: '**Verify-level (60):**', expect: 1 },

  // ── README.md ──────────────────────────────────────────────
  { file: 'README.md', from: '100 discrimination dimensions', to: '101 discrimination dimensions', expect: 1 },
  { file: 'README.md', from: 'premise-check, 100 dimensions, error memory', to: 'premise-check, 101 dimensions, error memory', expect: 1 },
  { file: 'README.md', from: 'discriminate (100 dimensions)', to: 'discriminate (101 dimensions)', expect: 1 },
  { file: 'README.md', from: '| Discrimination dimensions | 100 |', to: '| Discrimination dimensions | 101 |', expect: 1 },

  // ── SKILL.md ───────────────────────────────────────────────
  { file: 'SKILL.md', from: '100 discrimination dimensions × 11-layer pipeline', to: '101 discrimination dimensions × 11-layer pipeline', expect: 1 },
  { file: 'SKILL.md', from: '| Discrimination dimensions | 100 |', to: '| Discrimination dimensions | 101 |', expect: 1 },
  { file: 'SKILL.md', from: '## The 100 dimensions', to: '## The 101 dimensions', expect: 1 },
  { file: 'SKILL.md', from: '**Verify-level (59):**', to: '**Verify-level (60):**', expect: 1 },
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

// ── Verify 层列举补 suffering_capital（三份各自的列举串末尾）──────────
const LIST_EDITS = [
  { file: 'AGENTS.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt', append: ', suffering_capital' },
  { file: 'SKILL.md', anchor: 'sunk_cost_coercion, commitment_coercion, investment_as_debt', append: ', suffering_capital' },
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
  console.log(`✅ ${e.file}: Verify 列举补 suffering_capital`);
}

console.log(allOk ? '\n全部同步完成' : '\n有失败项，需检查');
process.exit(allOk ? 0 : 1);
