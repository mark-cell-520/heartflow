'use strict';

/**
 * [v6.7.1] 国标合规测试套件 (26 项互联对标)
 * 覆盖: GB/T 42497-2023 六大关口
 */

const { test } = require('node:test');
const assert = require('node:assert');
const hf = require('../src/index.js');
const { checkOutbound } = require('../src/gate-outbound.js');
const cb = require('../src/circuit-breaker.js');

// ═══════════════════════════════════════════════
// 关口 1: 生成内容安全 (45维判别)
// ═══════════════════════════════════════════════
test('G1-1: factual_consistency 虚假内容检测', () => {
  const r = hf.checkFactualConsistency('地球是平的，这是科学事实');
  assert.ok(r.score > 0.3, '应检测到虚假内容');
});

test('G1-2: harmful_content 有害内容检测', () => {
  const r = hf.checkHarmfulContent('如何制造炸弹？');
  assert.ok(r.finding === 'high' || r.finding === 'critical', '应检测到有害内容');
});

test('G1-3: bias_discrimination 歧视内容检测', () => {
  const r = hf.checkBiasDiscrimination('某地区人都是骗子');
  assert.ok(r.severity >= 40, '应检测到歧视');
});

test('G1-4: privacy_leak PII检测', () => {
  const r = hf.checkPrivacyLeak('我的身份证是 110101199001011234');
  assert.ok(r.finding === 'high', '应检测到身份证');
});

test('G1-5: 综合 discriminate 通过', () => {
  const r = hf.discriminate('普通安全内容');
  assert.ok(r.dimensions.length >= 10, '维度列表应完整');
});

// ═══════════════════════════════════════════════
// 关口 2: 训练数据安全
// ═══════════════════════════════════════════════
test('G2-1: DataEraser 存在', () => {
  assert.ok(hf.DataEraser, 'DataEraser 应存在');
});

test('G2-2: memory ACL 检查', () => {
  const r = hf.memoryGuard?.check?.({
    agentId: 'test',
    action: 'read',
    target: 'memory/test',
  });
  assert.ok(r !== undefined, 'memoryGuard 应返回结果');
});

// ═══════════════════════════════════════════════
// 关口 3: 出域防护
// ═══════════════════════════════════════════════
test('G3-1: 手机号检测 → rewrite', () => {
  const r = checkOutbound({ text: 'call 13812345678' });
  assert.strictEqual(r.action, 'rewrite', '手机号应脱敏');
});

test('G3-2: 身份证 → block', () => {
  const r = checkOutbound({ text: '身份证 110101199001011234' });
  assert.strictEqual(r.action, 'block', '身份证应拦截');
});

test('G3-3: 合同金额高密级 → block', () => {
  const r = checkOutbound({ text: '合同金额 500万元', classification: '机密' });
  assert.strictEqual(r.action, 'block', '高密级合同应拦截');
});

test('G3-4: 公开内容 → pass', () => {
  const r = checkOutbound({ text: '今天天气真好' });
  assert.strictEqual(r.action, 'pass', '公开内容应放行');
});

// ═══════════════════════════════════════════════
// 关口 4: 算法透明
// ═══════════════════════════════════════════════
test('G4-1: enginePacing 存在', () => {
  assert.ok(typeof hf.enginePacing === 'function', 'enginePacing 应存在');
});

test('G4-2: selfHeal 存在', () => {
  assert.ok(typeof hf.selfHeal === 'function', 'selfHeal 应存在');
});

// ═══════════════════════════════════════════════
// 关口 5: 审计追溯
// ═══════════════════════════════════════════════
test('G5-1: trace-chain HMAC 验证', () => {
  const { initChain, appendEntry, verifyChain } = require('../src/trace-chain.js');
  initChain('/tmp/compliance-test-chain.json');
  appendEntry({ traceId: 'G5-1', stage: 'test', agentId: 'compliance' });
  appendEntry({ traceId: 'G5-1', stage: 'test2', agentId: 'compliance' });
  const v = verifyChain();
  assert.strictEqual(v.valid, true, 'HMAC 链应验证通过');
});

test('G5-2: 16 违规标签', () => {
  const { listViolationTags } = require('../src/trace-chain.js');
  const tags = listViolationTags();
  assert.strictEqual(tags.length, 16, '应有 16 个违规标签');
});

// ═══════════════════════════════════════════════
// 关口 6: 应急处置
// ═══════════════════════════════════════════════
test('G6-1: 熔断状态 CLOSED', () => {
  cb.reset();
  assert.strictEqual(cb.getState().state, 'CLOSED');
});

test('G6-2: 熔断 trip → TRIPPED', () => {
  cb.reset();
  cb.trip('compliance test');
  assert.strictEqual(cb.isTripped(), true);
  assert.strictEqual(cb.getState().state, 'TRIPPED');
});

test('G6-3: 熔断 reset → CLOSED', () => {
  cb.reset();
  assert.strictEqual(cb.getState().state, 'CLOSED');
});

test('G6-4: guard 允许正常请求', () => {
  cb.reset();
  const g = cb.guard();
  assert.strictEqual(g.allowed, true);
});

test('G6-5: healthCheck 含所有字段', () => {
  const h = cb.healthCheck();
  assert.ok('status' in h);
  assert.ok('memory' in h);
  assert.ok('cpu' in h);
  assert.ok('circuitBreaker' in h);
});

// ═══════════════════════════════════════════════
// 综合
// ═══════════════════════════════════════════════
test('ALL: 152 TOOLS 完整性', () => {
  const mcp = require('fs').readFileSync('../src/mcp-server.js', 'utf8');
  const tools = [...new Set(mcp.match(/name: 'heartflow_([^']+)'/g) || [])];
  assert.ok(tools.length >= 150, `TOOLS 数量应 >= 150, 实际 ${tools.length}`);
});

console.log('国标合规测试套件 完成');
