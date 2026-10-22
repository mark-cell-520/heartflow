/**
 * scripts/round-660-sync-docs.js
 *
 * [r660] 三份禁改文档的维度口径同步：105 → 106（新增第 106 维度
 * social_isolation）。改点：
 *   1. README.md 规格表 Discrimination dimensions 105 → 106
 *   2. README.md 两处 pipeline 描述 "105 dimensions" → 106
 *   3. SKILL.md 规格表 + "The 105 dimensions" 标题
 *   4. AGENTS.md 横幅 + "The 105 dimensions" 标题 + 版本戳 + Verify 列举
 *   5. SKILL.md 的 verify 计数（doc-numbers 报 64 != 65）
 * 每处替换后立即打印命中数，证明改动真的落盘（python str.replace 静默跳过的教训）。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const REPO = __HF;

const FILES = {
  README: path.join(REPO, 'README.md'),
  SKILL: path.join(REPO, 'SKILL.md'),
  AGENTS: path.join(REPO, 'AGENTS.md'),
};

function apply(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  let changed = 0;
  for (const [from, to, expectCount] of pairs) {
    const before = s.split(from).length - 1;
    if (before === 0) {
      console.log('  ⚠️ 未命中（跳过）: ' + JSON.stringify(from.slice(0, 60)));
      continue;
    }
    s = s.split(from).join(to);
    const after = s.split(to).length - 1;
    console.log('  ✅ ' + before + ' 处 → "' + to.slice(0, 46).replace(/\n/g, ' ') + '"');
    changed += before;
    if (expectCount !== undefined && before !== expectCount) {
      console.log('  ⚠️ 预期 ' + expectCount + ' 处，实际 ' + before + ' 处');
    }
  }
  if (changed > 0) fs.writeFileSync(file, s, 'utf8');
  return changed;
}

console.log('=== README.md ===');
apply(FILES.README, [
  ['| Discrimination dimensions | 105 |', '| Discrimination dimensions | 106 |', 1],
  ['scope-check, premise-check, 105 dimensions, error memory', 'scope-check, premise-check, 106 dimensions, error memory', 1],
  ['discriminate (105 dimensions)', 'discriminate (106 dimensions)', 1],
]);

console.log('=== SKILL.md ===');
apply(FILES.SKILL, [
  ['| Discrimination dimensions | 105 |', '| Discrimination dimensions | 106 |', 1],
  ['## The 105 dimensions', '## The 106 dimensions', 1],
]);

console.log('=== AGENTS.md ===');
apply(FILES.AGENTS, [
  ['105 dimensions, 161 modules', '106 dimensions, 161 modules', 1],
  ['## The 105 dimensions', '## The 106 dimensions', 1],
  ['(v6.8.10 recount — silent_treatment_coercion added as dimension 105)', '(v6.8.11 recount — social_isolation added as dimension 106)', 1],
  ['**Verify-level (64):**', '**Verify-level (65):**', 1],
  ['selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion', 'selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation', 1],
  ['> add up to 94; the remaining 11 dimensions', '> add up to 95; the remaining 11 dimensions', 1],
]);

// 验证
console.log('\n=== 验证 ===');
for (const [k, f] of Object.entries(FILES)) {
  const s = fs.readFileSync(f, 'utf8');
  const left = (s.match(/105 dimensions/g) || []).length;
  const newN = (s.match(/106 dimensions/g) || []).length;
  console.log(k + ': "105 dimensions" 残留 ' + left + '，"106 dimensions" ' + newN + ' 处');
}
