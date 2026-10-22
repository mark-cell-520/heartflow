// 为运行时验证过的纯读 handler 生成 MCP 工具定义，追加进 tools-registry.js
// 参数从 handler 体提取（解构 + args?.x + args['x']），保证 schema 与实现一致，
// 不手写（手写会漂移）。
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const cand = JSON.parse(fs.readFileSync('/root/.hermes/cache/scratch/exposure-candidates.json', 'utf8'));
// 兼容两种形状：纯字符串 或 [name, reason]（r419 补验时带了证据说明）
const nm = x => Array.isArray(x) ? x[0] : x;
// 修正上一轮误判：errored 实为正常返回，一并纳入
const clean = [...cand.clean, ...cand.errored].map(nm).sort();
const dirty = cand.dirty.map(nm);
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

// 写成一个独立模块，避免把 114 个定义塞进 tools-registry.js 主文件
const out = `/**
 * extended-tools.js — 运行时验证过的无 fs 副作用工具集
 *
 * 来源：全局审计 P1-1「117 个 handler 未暴露」。
 *
 * ## 验证方法（唯一可信判据）
 * 启动真实 server → JSON-RPC tools/call 真调 → fs 快照比对 mtime+size。
 * 静态分析两个方向都误判过：
 *   · 按 handler 体正则：把 heartflow_memory_write_control 判成纯读（名字没 write）
 *   · 穿透目标模块：把 heartflow_self_benchmark 判成写（模块别处有 writeFileSync，
 *     实际它确实会落盘 data/self-benchmark.json，但那是运行时才发现的）
 * 只有 fs 快照比对是确定性的。
 *
 * ## r419 补验（2026-10-12）：29 个从未被验证的 handler
 * 首轮 exposure-candidates.json 只有 clean 72 + dirty 1 + errored 14 = 87，
 * 而当时差集是 117 —— **29 个从未进入验证**，既没暴露也没排除。
 * r419a 用空参数测，29 个全"零变化"，但那是无效证据：空参数让
 * memory_write_control 之类走了参数错误分支，根本没执行。
 * r419b/r419c/r419d 改为：多组最小有效参数（text/query/action）+ 等 5 秒
 * + 进程退出后再比一次，并用 self_benchmark 作**阳性对照**证明检测有效
 * （它确实让 data/self-benchmark.json 的 mtime 改变）。28 个通过。
 *
 * ## r419 新发现：三个"假成功"工具
 * heartflow_evolve 返回 {learned: true, lesson: "default experience"}
 * heartflow_audit_log 返回 {recorded: true}
 * heartflow_memory_write_control 返回 {timestamp: ...}
 * 三者 5 秒后 + 进程退出后 fs 均零变化 —— 声称成功但**不落盘**，只在内存。
 * 它们因此满足"无 fs 副作用"被纳入本表，但调用方不应把返回值当持久化证据。
 * （此问题记录待修，不影响本次暴露决策。）
 *
 * ## 排除项
 *   heartflow_self_benchmark → 写 data/self-benchmark.json（r419 复测确认）
 *   heartflow_safe_fetch     → 能发任意网络请求，SSRF 面（引擎内有
 *                               url-validator.js 防护但未在此路径复用）
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
