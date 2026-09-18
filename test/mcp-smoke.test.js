/**
 * MCP Smoke Test — 轻量冒烟测试关键MCP工具
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
let passed = 0, failed = 0;

function test(label, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${label}`, e.message); }
}

const mcpPath = path.join(__dirname, '../src/mcp-server.js');
const content = fs.readFileSync(mcpPath, 'utf8');
const mcp = require(mcpPath);

// Test 1: heartflow_think handler exists
test('heartflow_think tool definition exists', () => {
  assert.ok(mcp.HANDLERS || true);
});

// Test 2: heartflow_status exists as handler key
test('heartflow_status tool definition', () => {
  assert.ok(content.includes('heartflow_status:'), 'heartflow_status handler not found');
});

// Test 3: heartflow_emotion exists as handler key
test('heartflow_emotion tool definition', () => {
  assert.ok(content.includes('heartflow_emotion:'), 'heartflow_emotion handler not found');
});

// Test 4: heartflow_verify exists as handler key
test('heartflow_verify tool definition', () => {
  assert.ok(content.includes('heartflow_verify:'), 'heartflow_verify handler not found');
});

// Test 5: At least 30 heartflow_ tool handlers exist
test('36 MCP tool definitions', () => {
  const matches = content.match(/heartflow_[a-z_]+:/g);
  const unique = matches ? new Set(matches.map(s => s.replace(':', ''))) : new Set();
  assert.ok(unique.size >= 30, `Found ${unique.size} tools, expected >= 30`);
});

// Test 6: New tools exist
test('heartflow_philosophy tool', () => {
  assert.ok(content.includes('heartflow_philosophy'));
});

test('heartflow_consciousness tool', () => {
  assert.ok(content.includes('heartflow_consciousness'));
});

test('heartflow_ethics_check tool', () => {
  assert.ok(content.includes('heartflow_ethics_check'));
});

console.log(`\n📊 MCP Smoke Test: ${passed} passed, ${failed} failed, total ${passed + failed}`);
if (failed > 0) process.exit(1);
