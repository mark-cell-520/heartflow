#!/usr/bin/env node
/**
 * 清理 tools-registry.js 里的空壳工具定义
 *
 * 背景：179 个工具定义中 124 个没有 handler（调用即 Method not found），
 * 属于"对外声明了能力却没有实现"。心虫 decision.decide 选定（0.94 分）：
 * 只接 100% 确认的路由，不确定的一律移除——绝不留错路由。
 *
 * 本轮保留并接线 3 个（dispatch 实测跑通）：
 *   heartflow_decision_decide    → decision.decide
 *   heartflow_memory_consolidate → memory.consolidate
 *   heartflow_execution_verify   → execution.verify
 *
 * 用法：
 *   node scripts/clean-tool-registry.js           # 干跑（只报告）
 *   node scripts/clean-tool-registry.js --apply   # 实际修改
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY = path.join(__dirname, '..', 'src', 'mcp', 'tools-registry.js');
const MCP_SERVER = path.join(__dirname, '..', 'src', 'mcp-server.js');

const KEEP = new Set([
  'heartflow_decision_decide',
  'heartflow_memory_consolidate',
  'heartflow_execution_verify',
]);

const APPLY = process.argv.includes('--apply');

function main() {
  // 1. 直接 require 拿结构化数据（不做字符串切割，避免 elision/双逗号问题）
  delete require.cache[require.resolve(REGISTRY)];
  const { TOOLS } = require(REGISTRY);
  const mcpSrc = fs.readFileSync(MCP_SERVER, 'utf8');

  const hb = mcpSrc.match(/const HANDLERS = \{([\s\S]*?)\n\};/);
  const hasHandler = new Set();
  for (const line of hb[1].split('\n')) {
    const m = line.match(/^\s*'?(heartflow_\w+)'?:\s*(\w+),/);
    if (m) hasHandler.add(m[1]);
  }
  for (const m of mcpSrc.matchAll(/const (handle\w+) = require\('\.\/mcp\/handlers\/([\w-]+)\.js'\)/g)) {
    hasHandler.add('heartflow_' + m[2].replace(/-/g, '_'));
  }

  // 2. 按 name 去重 + 过滤
  const seen = new Set();
  const kept = [], removed = [];
  for (const t of TOOLS) {
    if (!t || !t.name) continue;
    if (seen.has(t.name)) { removed.push(t.name + ' (重复)'); continue; }
    seen.add(t.name);
    if (hasHandler.has(t.name) || KEEP.has(t.name)) kept.push(t);
    else removed.push(t.name);
  }

  console.log(`原 TOOLS: ${TOOLS.length}（唯一 ${seen.size}）`);
  console.log(`保留: ${kept.length}`);
  console.log(`移除（空壳/重复）: ${removed.length}`);
  const newWired = kept.filter(t => KEEP.has(t.name));
  if (newWired.length) {
    console.log(`\n新接线（${newWired.length}）:`);
    newWired.forEach(t => console.log('  + ' + t.name));
  }

  if (!APPLY) { console.log('\n（干跑模式，加 --apply 实际写入）'); return; }

  // 3. 重新序列化（用 JSON.stringify 保证语法正确，无 elision 风险）
  const parts = kept.map(t => {
    const name = JSON.stringify(t.name);
    const desc = JSON.stringify(t.description || '');
    let schema;
    try { schema = JSON.stringify(t.inputSchema || { type: 'object', properties: {} }); }
    catch (_) { schema = "{ type: 'object', properties: {} }"; }
    return `  {\n    name: '${t.name}',\n    description: ${desc},\n    inputSchema: ${schema}\n  }`;
  });
  const out = 'const TOOLS = [\n\n' + parts.join(',\n\n') + ',\n\n];\n\nmodule.exports = { TOOLS };\n';
  fs.writeFileSync(REGISTRY, out);

  // 4. 验证
  delete require.cache[require.resolve(REGISTRY)];
  const after = require(REGISTRY).TOOLS;
  console.log(`\n已写入。验证: TOOLS=${after.length}, 唯一=${new Set(after.map(t => t.name)).size}`);
  const dupes = after.map(t => t.name).filter((n, i, a) => a.indexOf(n) !== i);
  console.log(`重复: ${dupes.length}`);
  if (dupes.length) { console.log('  ' + dupes.join(', ')); process.exit(1); }

  // 5. 每个保留的工具必须有 handler
  const orphan = after.filter(t => !hasHandler.has(t.name) && !KEEP.has(t.name)).map(t => t.name);
  console.log(`无 handler 的孤儿工具: ${orphan.length}`);
  if (orphan.length) { console.log('  ' + orphan.join(', ')); process.exit(1); }
  console.log('\n✅ 清理完成，所有工具均有 handler');
}

main();
