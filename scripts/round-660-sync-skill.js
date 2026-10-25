/**
 * scripts/round-660-sync-skill.js
 *
 * [r660] SKILL.md 的 Verify 层列举与计数同步：补 social_isolation 并把
 * (64) 改 (65)。AGENTS.md 已在 round-660-sync-docs.js 里改过，SKILL.md
 * 的列举是独立的一份（同族第二处拷贝），必须单独改。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const FILE = path.join(__HF, 'SKILL.md');

let s = fs.readFileSync(FILE, 'utf8');

const pairs = [
  ['**Verify-level (64):**', '**Verify-level (65):**'],
  ['selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion"',
   'selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation"'],
];

let changed = 0;
for (const [from, to] of pairs) {
  const n = s.split(from).length - 1;
  if (n === 0) {
    console.log('⚠️ 未命中: ' + JSON.stringify(from.slice(0, 60)));
    continue;
  }
  s = s.split(from).join(to);
  console.log('✅ ' + n + ' 处 → "' + to.slice(0, 60) + '"');
  changed += n;
}

if (changed > 0) fs.writeFileSync(FILE, s, 'utf8');

// 验证
const after = fs.readFileSync(FILE, 'utf8');
console.log('\n验证: "Verify-level (65)" 出现 ' + (after.split('Verify-level (65)').length - 1) + ' 次');
console.log('验证: social_isolation 在 SKILL.md 出现 ' + (after.split('social_isolation').length - 1) + ' 次');
