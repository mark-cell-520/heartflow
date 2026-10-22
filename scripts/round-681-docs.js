'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
/**
 * scripts/round-681-docs.js
 * [r681] 文档口径同步（124→125、verify 83→84、tier 合计 113→114）+
 * 版本 bump 四处（VERSION/package.json/SKILL.md/version.js）+
 * README changelog 追加 6.8.28 条目（长文本外置 /tmp/changelog-681.txt）。
 */
const fs = require('fs');
const path = require('path');
const HF = __HF;

function edit(file, pairs) {
  const p = path.join(HF, file);
  let s = fs.readFileSync(p, 'utf8');
  for (const [old, neu, tag] of pairs) {
    const n = s.split(old).length - 1;
    if (n !== 1) throw new Error(file + ' ' + tag + ' 锚点命中 ' + n + ' 处（要求 1）');
    s = s.replace(old, neu);
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log('OK ' + file);
}

// ── AGENTS.md ────────────────────────────────────────────────────────
// 幂等：上一轮脚本已在 AGENTS.md 写入后中断，含 deprivation_coercion 即跳过
if (!fs.readFileSync(path.join(HF, 'AGENTS.md'), 'utf8').includes('deprivation_coercion')) {
  edit('AGENTS.md', [
    ['**Zero LLM dependency.** 124 dimensions, 161 modules, 154 MCP tools, 1,314 dispatch',
     '**Zero LLM dependency.** 125 dimensions, 161 modules, 154 MCP tools, 1,314 dispatch', 'banner'],
    ['## The 124 dimensions', '## The 125 dimensions', '标题'],
    ['(v6.8.27 recount — medical_coercion added as dimension 124;',
     '(v6.8.28 recount — deprivation_coercion added as dimension 125; v6.8.27 recount — medical_coercion added as dimension 124;', 'recount 注'],
    ['add up to 113; the remaining 11 dimensions', 'add up to 114; the remaining 11 dimensions', 'tier 合计'],
    ["legal_status_coercion,\nliberty_restriction,\nmedical_coercion\nconfidence, fallacies",
     "legal_status_coercion,\nliberty_restriction,\nmedical_coercion,\ndeprivation_coercion\nconfidence, fallacies", 'VERIFY 列举'],
  ]);
} else {
  console.log('SKIP AGENTS.md（已含 deprivation_coercion）');
}

// ── README.md ────────────────────────────────────────────────────────
// 注：README 无「N request verify」行（该口径行只在 SKILL.md），此处只改维度数相关
edit('README.md', [
  ['124 discrimination dimensions  ×  11-layer pipeline  ×  161 modules  ×  154 MCP tools',
   '125 discrimination dimensions  ×  11-layer pipeline  ×  161 modules  ×  154 MCP tools', 'banner'],
  ['scope-check, premise-check, 124 dimensions, error memory', 'scope-check, premise-check, 125 dimensions, error memory', '入口表'],
  ['scope-check -> premise-check -> discriminate (124 dimensions) -> gate',
   'scope-check -> premise-check -> discriminate (125 dimensions) -> gate', '流水线'],
  ['| Discrimination dimensions | 124 |', '| Discrimination dimensions | 125 |', '指标表'],
]);

// ── SKILL.md ─────────────────────────────────────────────────────────
edit('SKILL.md', [
  ['  124 discrimination dimensions × 11-layer pipeline × 161 modules ×',
   '  125 discrimination dimensions × 11-layer pipeline × 161 modules ×', 'banner'],
  ['| Discrimination dimensions | 124 | `dimMap` keys in `src/index.js` |',
   '| Discrimination dimensions | 125 | `dimMap` keys in `src/index.js` |', '指标表'],
  ['a `rewrite`, **83 request `verify`**', 'a `rewrite`, **84 request `verify`**', 'verify 计数'],
  ['## The 124 dimensions', '## The 125 dimensions', '标题'],
  ['legal_status_coercion,\nliberty_restriction,\nmedical_coercion\n\n> The three action-forcing layers add up to 113',
   'legal_status_coercion,\nliberty_restriction,\nmedical_coercion,\ndeprivation_coercion\n\n> The three action-forcing layers add up to 114', 'VERIFY 列举+tier'],
  ['| Generated-content safety | `checkOutput` / `discriminate` (124 dimensions) |',
   '| Generated-content safety | `checkOutput` / `discriminate` (125 dimensions) |', '能力表'],
]);

// ── README changelog 追加（条目插到 6.8.27 行之后）────────────────────
{
  const p = path.join(HF, 'README.md');
  let s = fs.readFileSync(p, 'utf8');
  const entry = fs.readFileSync('/tmp/changelog-681.txt', 'utf8').trim();
  if (s.includes('| 6.8.28 |')) throw new Error('README 已含 6.8.28 条目');
  const anchor = '| 6.8.27 | 2026-10-12 |';
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error('changelog 锚点命中 ' + n + ' 处');
  const idx = s.indexOf(anchor);
  const lineEnd = s.indexOf('\n', idx);
  s = s.slice(0, lineEnd + 1) + entry + '\n' + s.slice(lineEnd + 1);
  fs.writeFileSync(p, s, 'utf8');
  console.log('OK README changelog 6.8.28');
}

// ── 版本 bump 四处 ───────────────────────────────────────────────────
{
  // 1) VERSION
  const vp = path.join(HF, 'VERSION');
  let v = fs.readFileSync(vp, 'utf8').trim();
  if (v !== '6.8.27') throw new Error('VERSION 意外值: ' + v);
  fs.writeFileSync(vp, '6.8.28\n', 'utf8');
  console.log('OK VERSION 6.8.28');
  // 2) package.json
  const pp = path.join(HF, 'package.json');
  let pj = fs.readFileSync(pp, 'utf8');
  if (!pj.includes('"version": "6.8.27"')) throw new Error('package.json 版本锚点未命中');
  fs.writeFileSync(pp, pj.replace('"version": "6.8.27"', '"version": "6.8.28"'), 'utf8');
  console.log('OK package.json 6.8.28');
  // 3) SKILL.md frontmatter
  const sp = path.join(HF, 'SKILL.md');
  let sk = fs.readFileSync(sp, 'utf8');
  if (!sk.includes('version: "6.8.27"')) throw new Error('SKILL.md 版本锚点未命中');
  fs.writeFileSync(sp, sk.replace('version: "6.8.27"', 'version: "6.8.28"'), 'utf8');
  console.log('OK SKILL.md 6.8.28');
  // 4) src/core/version.js（sync-version.js 不管这里，手动同步）
  const vjp = path.join(HF, 'src/core/version.js');
  let vj = fs.readFileSync(vjp, 'utf8');
  if (!vj.includes("let VERSION = '6.8.27';")) throw new Error('version.js 版本锚点未命中');
  fs.writeFileSync(vjp, vj.replace("let VERSION = '6.8.27';", "let VERSION = '6.8.28';"), 'utf8');
  console.log('OK src/core/version.js 6.8.28');
}
