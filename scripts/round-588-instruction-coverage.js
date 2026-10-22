#!/usr/bin/env node
/**
 * r588 提案-2 实测：InstructionRegistry 的真缺口 —— 逐条指令的规则覆盖
 *
 * 结论先行（本脚本实测，非简报复述）：
 *   7 条指令里只有 3 条（truth / goodness / reduce_errors）有可执行规则，
 *   另外 4 条（beauty / upgrade / serve_humans / continuous_improvement）
 *   落到 check() 的 default 分支恒 aligned:true —— 说了等于没说。
 *   更硬的一层：全仓（src + test）读取调用点为 0 ——
 *   heartflow.js:1645 实例化后没有任何代码调用 check()/audit()，
 *   也没有任何 MCP 工具暴露它。这是一个「已实例化但零调用」的死能力。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { InstructionRegistry, SEVEN_INSTRUCTIONS } = require('../src/core/instruction-registry.js');

const reg = new InstructionRegistry();

// 违规文本：同时踩 truth（100%确定/绝对保证）、goodness（去死）、reduce_errors（置信度0.1）
const VIOLATION = '我绝对保证这是100%确定的，你去死吧';

const coverage = {};
for (const inst of SEVEN_INSTRUCTIONS) {
  const r = reg.check(inst.id, { text: VIOLATION, confidence: 0.1, scenario: 'output_generation' });
  coverage[inst.id] = r.aligned ? 'DEAD（恒 aligned:true）' : 'live（规则可判）';
}

// audit() 穿透
const auditV = reg.audit({ scenario: 'output_generation', text: VIOLATION, confidence: 0.1 });
const auditC = reg.audit({ scenario: 'output_generation', text: '一段克制的说明文本。', confidence: 0.9 });

// 读取调用点
function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const ROOT = path.resolve(__dirname, '..');
const files = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'test'))];
const readSites = [];
for (const f of files) {
  if (f.endsWith(path.join('src', 'core', 'instruction-registry.js'))) continue;
  const txt = fs.readFileSync(f, 'utf8');
  if (/instructions\s*\.\s*(check|audit|getAll|getStats|getByType|getByApplicable)/.test(txt)) {
    readSites.push(path.relative(ROOT, f));
  }
}
// MCP 暴露
const mcpSrc = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
const mcpSrc2 = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
const mcpExposed = /instruction[s]?[-_]/i.test(mcpSrc + mcpSrc2) && /heartflow_\w*instruction/.test(mcpSrc + mcpSrc2);

console.log(JSON.stringify({
  instructions: SEVEN_INSTRUCTIONS.length,
  coverage,
  deadInstructions: Object.entries(coverage).filter(([, v]) => v.startsWith('DEAD')).map(([k]) => k),
  auditViolationBlocked: auditV.filter(a => !a.aligned).length + '/' + auditV.length,
  auditCleanBlocked: auditC.filter(a => !a.aligned).length + '/' + auditC.length,
  readSitesInRepo: readSites,
  mcpExposed,
}, null, 2));
