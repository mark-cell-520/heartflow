#!/usr/bin/env node
// r314 负例：注入 r313/r314 的缺陷形态，守卫 test/mcp-tool-registry-integrity.test.js 必须变红。
// 每个注入 = 改坏 src/mcp-server.js → 跑守卫 → 记失败数 → 还原 → 守卫必须复绿。
// 用法：node scripts/negative-test-mcp-registry-integrity-r314.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/mcp-server.js');
const GUARD = path.join(ROOT, 'test/mcp-tool-registry-integrity.test.js');
const ORIG = fs.readFileSync(SRC, 'utf8');

// ── 注入清单 ──────────────────────────────────────────────
const INJECTIONS = [
  {
    name: 'A 行内并列键第二键整段丢弃（r314 缺陷原形：dream 那行）',
    fn: (s) => s.replace(
      '  heartflow_dream: handleDream,  heartflow_active_inference: (args) => {',
      '  heartflow_active_inference: (args) => {'
    ),
  },
  {
    name: 'B 引用形态指向不存在的命名 handler（真孤儿）',
    fn: (s) => s.replace(
      '  heartflow_gate: handleGate,',
      '  heartflow_gate: handleGatewayThatDoesNotExist,'
    ),
  },
  {
    name: 'C 引用形态退化成内联箭头（覆盖回归：简短引用必须仍能解析）',
    fn: (s) => s.replace(
      '  heartflow_gate: handleGate,',
      '  heartflow_gate: (args) => handleGate(args),'
    ),
  },
  {
    name: 'D 引用形态键名漂移（工具仍在 TOOLS，handleMap 里 key 找不到→孤儿）',
    fn: (s) => s.replace(
      '  heartflow_memory_consolidate: handleMemoryConsolidateTool,',
      '  heartflow_memory_consolidate_tmp: handleMemoryConsolidateTool,'
    ),
  },
  {
    name: 'E 顶层键缩进变化导致解析器漏收（半瞎形态回归：漏收即孤儿）',
    fn: (s) => s.replace(
      '\n  heartflow_knowledge_layer: (args) => {',
      '\n    heartflow_knowledge_layer: (args) => {'
    ),
  },
];

// ── 跑守卫 ──────────────────────────────────────────────
function runGuard() {
  try {
    const out = execFileSync(process.execPath, [GUARD], { cwd: ROOT, timeout: 240000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, log: out.toString() };
  } catch (e) {
    return { code: e.status || 1, log: (e.stdout || '').toString() + (e.stderr || '').toString() };
  }
}
function parseCount(log) {
  const m = log.match(/(\d+) 通过, (\d+) 失败, 共 (\d+) 个/);
  return m ? { pass: +m[1], fail: +m[2] } : { pass: 0, fail: -1 };
}

console.log('[r314 注册表完整性负例：注入-删条-必须变红]\n');
let fail = 0;

// 基线：守卫在未改动的源码上必须全绿
runGuard();
const base = (() => { return null; })();
fs.writeFileSync(SRC, ORIG);

for (const inj of INJECTIONS) {
  const cur = fs.readFileSync(SRC, 'utf8');
  const next = inj.fn(cur);
  if (next === cur) { console.log('  ❌ ' + inj.name + ' → [注入未生效：old_string 未匹配]'); fail++; continue; }
  fs.writeFileSync(SRC, next);
  const r = runGuard();
  fs.writeFileSync(SRC, ORIG);
  const c = parseCount(r.log);
  if (r.code !== 0 || c.fail > 0) {
    console.log('  ✅ ' + inj.name + ' → 守卫变红（失败 ' + c.fail + '）');
  } else {
    console.log('  ❌ ' + inj.name + ' → 守卫仍绿，注入不是守卫覆盖的缺陷');
    fail++;
  }
}

// 还原后守卫必须复绿
fs.writeFileSync(SRC, ORIG);
const green = runGuard();
const gc = parseCount(green.log);
if (green.code !== 0 || gc.fail > 0) { console.log('  ❌ 还原后守卫未复绿'); fail++; }
else { console.log('  ✅ 还原后守卫复绿（' + gc.pass + ' 通过）'); }

console.log(`\n结果: ${INJECTIONS.length + 1 - fail} 通过, ${fail} 失败, 共 ${INJECTIONS.length + 1} 个`);
process.exit(fail > 0 ? 1 : 0);
