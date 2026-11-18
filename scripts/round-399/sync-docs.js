// r399：三份文档数字同步（dimensions 266/267→268，verify 233/234→235）
// 幂等：字符串不存在即跳过。
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');

function patchFile(rel, subs) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, 'utf8');
  let changed = 0;
  for (const [from, to] of subs) {
    if (s.includes(from)) {
      const n = s.split(from).length - 1;
      s = s.split(from).join(to);
      changed += n;
      console.log(`  ${rel}: ${JSON.stringify(from.slice(0, 60))} x${n} -> ${JSON.stringify(to.slice(0, 60))}`);
    }
  }
  if (changed > 0) fs.writeFileSync(p, s);
  console.log(`${rel}: ${changed} 处`);
}

// README.md
patchFile('README.md', [
  ['discrimination%20dimensions-266-blueviolet', 'discrimination%20dimensions-268-blueviolet'],
  ['#what-it-catches-266-dimensions', '#what-it-catches-268-dimensions'],
  ['266 discrimination dimensions  ×  11-layer pipeline', '268 discrimination dimensions  ×  11-layer pipeline'],
  ['premise-check, 266 dimensions, error memory', 'premise-check, 268 dimensions, error memory'],
  ['discriminate (266 dimensions) -> gate', 'discriminate (268 dimensions) -> gate'],
  ['## What it catches (266 dimensions)', '## What it catches (268 dimensions)'],
  ['| Discrimination dimensions | 266 |', '| Discrimination dimensions | 268 |'],
  ['**233 request `verify`**', '**235 request `verify`**'],
]);

// SKILL.md
patchFile('SKILL.md', [
  ['267 discrimination dimensions × 11-layer pipeline', '268 discrimination dimensions × 11-layer pipeline'],
  ['| Discrimination dimensions | 267 |', '| Discrimination dimensions | 268 |'],
  ['## The 267 dimensions', '## The 268 dimensions'],
  ['`discriminate` (267 dimensions)', '`discriminate` (268 dimensions)'],
  ['**234 request `verify`**', '**235 request `verify`**'],
]);

// AGENTS.md
patchFile('AGENTS.md', [
  ['Zero LLM dependency. 267 dimensions', 'Zero LLM dependency. 268 dimensions'],
  ['## The 267 dimensions', '## The 268 dimensions'],
  ['**Verify-level (234):** fallacy_of_relevance', '**Verify-level (235):** fallacy_of_relevance'],
  // verify 列举尾部补 claimed_verification_without_trail（baseline_omission 已在）
  ['duration_neglect, baseline_omission\n', 'duration_neglect, baseline_omission, claimed_verification_without_trail\n'],
  // 三 tier 相加说明：11+19+235=265，剩余 3
  ['The three tiers\n> add up to 255; the remaining 3 dimensions', 'The three tiers\n> add up to 265; the remaining 3 dimensions'],
]);
console.log('done');
