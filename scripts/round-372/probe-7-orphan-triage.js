// [r372 probe-7] 版主筛选：对 7 个 orphan 模块判断「是否值得本轮接线」。
// 判据：是否已有真实能力（类/方法数）、是否 test 已覆盖、入口是否天然
// （MCP server 是独立入口不算 orphan）。只打印数字与结论。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const TEST = path.join(ROOT, 'test');

const TARGETS = ['pattern-detector', 'behavior-tracker', 'false-positive-feedback', 'repo-audit', 'aipay-server', 'heartflow-api-server', 'mcp-server'];

const testFiles = fs.readdirSync(TEST).filter(f => f.endsWith('.js'));
const testContents = {};
for (const f of testFiles) testContents[f] = fs.readFileSync(path.join(TEST, f), 'utf8');

function walk(dir, acc) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
const allTests = [];
try { for (const d of fs.readdirSync(TEST)) { const p = path.join(TEST, d); if (fs.statSync(p).isDirectory()) walk(p, allTests); } } catch (_) {}
for (const f of testFiles) allTests.push(path.join(TEST, f));
const testTexts = {};
for (const p of allTests) {
  const rel = path.relative(ROOT, p);
  testTexts[rel] = fs.readFileSync(p, 'utf8');
}

for (const t of TARGETS) {
  const src = fs.readFileSync(path.join(SRC, t + '.js'), 'utf8');
  const classN = (src.match(/^class\s+(\w+)/gm) || []).length;
  const methodN = (src.match(/^\s{2,4}(?:async\s+)?([A-Za-z_][\w]*)\s*\(/gm) || []).length;
  const exportN = (src.match(/^module\.exports/gm) || []).length;
  let tests = [];
  for (const [rel, c] of Object.entries(testTexts)) {
    if (c.includes("require(.*" + t) || c.includes(t + '.js')) tests.push(rel);
  }
  console.log(`${t} | class=${classN} methods~${methodN} exports=${exportN} | tests=${tests.length} ${tests.slice(0, 3).join(' ')}`);
}
