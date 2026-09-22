#!/usr/bin/env node
/** API 参考表核对：文档列的方法名 vs gate.js 实际导出（v6.7.79） */
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';

const gate = require(path.join(ROOT, 'src/gate.js'));
const EXPORTS = Object.keys(gate).filter(k => typeof gate[k] === 'function');
console.log('gate.js 实际导出（函数）:', EXPORTS.join(', '), `\n共 ${EXPORTS.length} 个\n`);

const DOCS = ['README.md', 'AGENTS.md', 'SKILL.md'];
// 从 API 参考章节抽 `方法名(...)` 形式
for (const d of DOCS) {
  const src = fs.readFileSync(path.join(ROOT, d), 'utf8');
  const names = new Set();
  // 表格形式：| `checkInput(text)` | ...
  for (const m of src.matchAll(/\|\s*`(\w+)\s*\(/g)) names.add(m[1]);
  // 章节标题形式：### `checkInput(text)`
  for (const m of src.matchAll(/#+\s*`(\w+)\s*\(/g)) names.add(m[1]);
  if (names.size === 0) { console.log(`${d}: 无 API 方法名`); continue; }
  const bogus = [...names].filter(n => !EXPORTS.includes(n));
  const missing = EXPORTS.filter(e => !names.has(e));
  console.log(`${d}: 提到 ${names.size} 个方法`);
  console.log(`  ❌ 文档有但导出没有: ${bogus.length ? bogus.join(', ') : '(无)'}`);
  console.log(`  ⚠️  导出有但文档没列: ${missing.length ? missing.join(', ') : '(无)'}`);
  console.log();
}
