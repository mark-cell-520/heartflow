/**
 * scripts/round-680-docs.js
 * [r680] 文档口径同步：123→124 维度、verify 82→83、tier 合计、recount 注释、
 * README changelog 6.8.27 条目、VERSION/package.json/SKILL.md frontmatter/
 * src/core/version.js 四处 bump。所有替换按唯一锚点精确匹配，替换后校验计数。
 * 沿用 r679-docs.js 形状。changelog 条目外置 /tmp/changelog-680.json
 * （避开写盘层对反斜杠/引号的转义——r679/r680 两度被咬）。
 */
'use strict';
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

function repl(file, pairs) {
  const p = HF + '/' + file;
  let s = fs.readFileSync(p, 'utf8');
  for (const [from, to, count] of pairs) {
    const n = s.split(from).length - 1;
    if (count !== undefined && n !== count) {
      console.error(file + ' 锚点命中 ' + n + ' 次（期望 ' + count + '）: ' + from.slice(0, 50));
      process.exit(1);
    }
    s = s.split(from).join(to);
  }
  fs.writeFileSync(p, s);
  console.log(file + ' 已更新（' + pairs.length + ' 处替换）');
}

const changelogEntry = require('/tmp/changelog-680.json').entry;

// ── README.md ──────────────────────────────────────────────────────
repl('README.md', [
  ['123 discrimination dimensions', '124 discrimination dimensions', 1],
  ['scope-check, premise-check, 123 dimensions', 'scope-check, premise-check, 124 dimensions', 1],
  ['discriminate (123 dimensions)', 'discriminate (124 dimensions)', 1],
  ['| Discrimination dimensions | 123 |', '| Discrimination dimensions | 124 |', 1],
  ['Measured on this repository at **v6.8.26**', 'Measured on this repository at **v6.8.27**', 1],
  ['| 6.8.26 | 2026-10-12 |', changelogEntry + '| 6.8.26 | 2026-10-12 |', 1],
]);

// ── SKILL.md ───────────────────────────────────────────────────────
repl('SKILL.md', [
  ['## The 123 dimensions', '## The 124 dimensions', 1],
  ['`checkOutput` / `discriminate` (123 dimensions)', '`checkOutput` / `discriminate` (124 dimensions)', 1],
  ['**Verify-level (82):** appeal_to_authority', '**Verify-level (83):** appeal_to_authority', 1],
  ['liberty_restriction\n', 'liberty_restriction,\nmedical_coercion\n', 1],
  ['add up to 111; the remaining 11 dimensions', 'add up to 113; the remaining 11 dimensions', 1],
  ['**82 request `verify`**', '**83 request `verify`**', 1],
  ['Every number below was measured on this repository at v6.8.26.', 'Every number below was measured on this repository at v6.8.27.', 1],
  ['version: "6.8.26"', 'version: "6.8.27"', 1],
]);

// ── AGENTS.md ──────────────────────────────────────────────────────
repl('AGENTS.md', [
  ['123 dimensions, 161 modules', '124 dimensions, 161 modules', 1],
  ['## The 123 dimensions', '## The 124 dimensions', 1],
  ['(v6.8.26 recount — liberty_restriction added as dimension 123; v6.8.25 added legal_status_coercion as 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))',
   '(v6.8.27 recount — medical_coercion added as dimension 124; v6.8.26 added liberty_restriction as 123; v6.8.25 added legal_status_coercion as 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))', 1],
  ['> add up to 112; the remaining 11 dimensions', '> add up to 113; the remaining 11 dimensions', 1],
  ['**Verify-level (82):** appeal_to_authority', '**Verify-level (83):** appeal_to_authority', 1],
  ['liberty_restriction\n', 'liberty_restriction,\nmedical_coercion\n', 1],
]);

// ── 四处版本 bump ─────────────────────────────────────────────────
repl('VERSION', [['6.8.26', '6.8.27', 1]]);
repl('package.json', [['"version": "6.8.26"', '"version": "6.8.27"', 1]]);
const vp = HF + '/src/core/version.js';
let vs = fs.readFileSync(vp, 'utf8');
const vm = vs.match(/6\.8\.26/g);
if (!vm || vm.length < 1) { console.error('version.js 未找到 6.8.26'); process.exit(1); }
vs = vs.split('6.8.26').join('6.8.27');
fs.writeFileSync(vp, vs);
console.log('src/core/version.js 已更新（' + vm.length + ' 处）');
console.log('全部文档口径与版本 bump 完成');
