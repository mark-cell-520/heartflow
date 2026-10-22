/**
 * scripts/round-679-docs2.js
 * [r679] 文档口径同步第二批（第一批的 SKILL version 锚点带引号导致中断，
 * README 5 处已落盘）。本批补齐：SKILL.md 全部口径 + 版本戳 + frontmatter、
 * AGENTS.md 全部口径、VERSION/package.json/version.js 四处 bump。
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const HF = __HF;

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

// ── SKILL.md ───────────────────────────────────────────────────────
repl('SKILL.md', [
  ['  122 discrimination dimensions × 11-layer pipeline × 161 modules ×', '  123 discrimination dimensions × 11-layer pipeline × 161 modules ×', 1],
  ['## The 122 dimensions', '## The 123 dimensions', 1],
  ['`checkOutput` / `discriminate` (122 dimensions)', '`checkOutput` / `discriminate` (123 dimensions)', 1],
  ['| Discrimination dimensions | 122 |', '| Discrimination dimensions | 123 |', 1],
  ['**Verify-level (81):** appeal_to_authority', '**Verify-level (82):** appeal_to_authority', 1],
  ['intermittent_reinforcement,\nlegal_status_coercion\n', 'intermittent_reinforcement,\nlegal_status_coercion,\nliberty_restriction\n', 1],
  ['add up to 110; the remaining 11 dimensions', 'add up to 111; the remaining 11 dimensions', 1],
  ['measured on this repository at v6.8.25', 'measured on this repository at v6.8.26', 1],
  ['| Engine version | 6.8.25 |', '| Engine version | 6.8.26 |', 1],
  ['version: "6.8.25"', 'version: "6.8.26"', 1],
]);

// ── AGENTS.md ──────────────────────────────────────────────────────
repl('AGENTS.md', [
  ['122 dimensions, 161 modules', '123 dimensions, 161 modules', 1],
  ['## The 122 dimensions', '## The 123 dimensions', 1],
  ['(v6.8.25 recount — legal_status_coercion added as dimension 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))',
   '(v6.8.26 recount — liberty_restriction added as dimension 123; v6.8.25 added legal_status_coercion as 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))', 1],
  ['> add up to 111; the remaining 11 dimensions', '> add up to 112; the remaining 11 dimensions', 1],
  ['**Verify-level (81):** appeal_to_authority', '**Verify-level (82):** appeal_to_authority', 1],
  ['intermittent_reinforcement,\nlegal_status_coercion\n', 'intermittent_reinforcement,\nlegal_status_coercion,\nliberty_restriction\n', 1],
]);

// ── README 口径版本戳 ──────────────────────────────────────────────
repl('README.md', [
  ['Measured on this repository at **v6.8.25**', 'Measured on this repository at **v6.8.26**', 1],
]);

// ── 四处版本 bump ─────────────────────────────────────────────────
repl('VERSION', [['6.8.25', '6.8.26', 1]]);
repl('package.json', [['"version": "6.8.25"', '"version": "6.8.26"', 1]]);
const vp = HF + '/src/core/version.js';
let vs = fs.readFileSync(vp, 'utf8');
const vm = vs.match(/6\.8\.25/g);
if (!vm || vm.length < 1) { console.error('version.js 未找到 6.8.25'); process.exit(1); }
vs = vs.split('6.8.25').join('6.8.26');
fs.writeFileSync(vp, vs);
console.log('src/core/version.js 已更新（' + vm.length + ' 处）');
console.log('第二批文档口径与版本 bump 完成');
