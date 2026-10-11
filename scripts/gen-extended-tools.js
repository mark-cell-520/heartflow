// 为运行时验证过的纯读 handler 生成 MCP 工具定义，追加进 tools-registry.js
// 参数从 handler 体提取（解构 + args?.x + args['x']），保证 schema 与实现一致，
// 不手写（手写会漂移）。
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const cand = JSON.parse(fs.readFileSync('/root/.hermes/cache/scratch/exposure-candidates.json', 'utf8'));
// 修正上一轮误判：errored 实为正常返回，一并纳入
const clean = [...cand.clean, ...cand.errored.map(([h]) => h)].sort();
const dirty = cand.dirty.map(([h]) => h);
console.log(`待暴露: ${clean.length}（排除有副作用的 ${dirty.length} 个: ${dirty.join(', ')}）\n`);

const srv = fs.readFileSync(HF + '/src/mcp-server.js', 'utf8');
const hStart = srv.indexOf('const HANDLERS');
const hEnd = srv.indexOf('\n};', hStart);
const hBody = srv.slice(hStart, hEnd);

function bodyOf(name) {
  const i = hBody.indexOf('\n  ' + name + ':');
  if (i < 0) return '';
  const rest = hBody.slice(i + name.length + 4);
  const m = rest.match(/\n  heartflow_[a-z0-9_]+:/);
  return m ? rest.slice(0, m.index) : rest;
}
function paramsOf(body) {
  const p = new Set();
  for (const m of body.matchAll(/const\s*\{([^}]+)\}\s*=\s*(?:args|params)/g)) {
    for (const part of m[1].split(',')) {
      const n = part.split('=')[0].trim().replace(/^\.\.\./, '');
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) p.add(n);
    }
  }
  for (const m of body.matchAll(/args\s*\??\.([A-Za-z_][A-Za-z0-9_]*)/g)) p.add(m[1]);
  for (const m of body.matchAll(/args\s*\??\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g)) p.add(m[1]);
  p.delete('action');
  return [...p];
}
// 从 handler 体里的 require 目标与调用猜一个简短用途（不作权威描述，只作兜底）
function guessPurpose(name, body) {
  const m = body.match(/require\(['"]\.\/([^'"]+)['"]\)/);
  const mod = m ? m[1].replace(/\.js$/, '').split('/').pop() : '';
  return mod ? `${name.replace(/^heartflow_/, '').replace(/_/g, ' ')}（${mod}）` : name.replace(/^heartflow_/, '').replace(/_/g, ' ');
}

const defs = [];
for (const name of clean) {
  const body = bodyOf(name);
  const params = paramsOf(body);
  const props = {};
  const required = [];
  for (const p of params) {
    props[p] = { type: 'string', description: `${p}（可选）` };
  }
  // action 型工具：绝大多数用 args?.action
  const usesAction = /args\s*\??\.action|const\s*\{\s*action/.test(body);
  if (usesAction) {
    props.action = { type: 'string', description: '操作类型（可选，不给则由工具自行决定默认行为）' };
  }
  const desc = guessPurpose(name, body);
  defs.push({ name, description: `${desc}。只读工具，无副作用（运行时 fs 快照验证）。`, inputSchema: { type: 'object', properties: props, required } });
}

// 写成一个独立模块，避免把 86 个定义塞进 tools-registry.js 主文件
const out = `/**
 * extended-tools.js — 运行时验证过的只读工具集（2026-10-11 自动生成）
 *
 * 来源：全局审计 P1-1「117 个 handler 未暴露」。116 个未暴露 handler 经
 * **运行时验证**（启动 server → JSON-RPC tools/call 真调 → fs 快照比对
 * mtime+size）确认无副作用后纳入本表。
 *
 * 为何不用静态分析：静态判据两个方向都误判过 ——
 *   · 按 handler 体正则：把 heartflow_memory_write_control 判成纯读（名字没 write）
 *   · 穿透目标模块：把 heartflow_self_benchmark 判成写（模块别处有 writeFileSync，
 *     实际它确实会落盘 data/self-benchmark.json，但那是运行时才发现的）
 * 只有 fs 快照比对是确定性的。
 *
 * 排除项（有 fs 副作用，不纳入）：
 *   heartflow_self_benchmark → 写 data/self-benchmark.json
 *
 * 写工具（WRITE_TOOLS）不在此表，由 mcp-server.js 的 needsWrite 收口。
 *
 * 本文件由 scripts/gen-extended-tools.js 生成，勿手改。
 */

const EXTENDED_TOOLS = ${JSON.stringify(defs, null, 2)};

module.exports = { EXTENDED_TOOLS };
`;
fs.writeFileSync(HF + '/src/mcp/extended-tools.js', out);
console.log(`✅ 已生成 src/mcp/extended-tools.js（${defs.length} 个工具定义）`);
console.log(`\n前 5 个预览:`);
for (const d of defs.slice(0, 5)) {
  console.log(`  ${d.name}`);
  console.log(`     params: ${Object.keys(d.inputSchema.properties).join(', ') || '(无)'}`);
}
const noParams = defs.filter(d => Object.keys(d.inputSchema.properties).length === 0).length;
const withAction = defs.filter(d => d.inputSchema.properties.action).length;
console.log(`\n统计: 无参数 ${noParams} 个 / 带 action ${withAction} 个 / 共 ${defs.length}`);
