// [r314] safe_fetch / self_benchmark 接线回归测试
// 背景：两个工具在 v6.8.179 及之前是「HANDLERS 有实现、tools/list 拿不到」的
// 隐藏能力（r291/r627 同款三处同步缺陷）。r314 补 tools-registry 定义 +
// WRITE_TOOLS 收口 + getStats 分支。本测试锁死三件事：
//   ① TOOLS 定义存在且 schema 合法（防再被 clean-tool-registry 误删）
//   ② HANDLERS 有实现且可跑（preflight 检出 PII / assess 返回防自欺 guardNote）
//   ③ WRITE_TOOLS 收口（assess 落盘必须 user 角色）
// 同时锁死 r314 顺手修的 gate-outbound scanPII 缺陷：预置 finding 无条件入列
// 导致所有文本恒 rewrite。
//
// [r316-c 修复] 本文件原写 `function ({ test, expect })`，但 test/_harness.js 的
// mount 契约只提供 test/assertEqual/assertTrue/assertFalse/assertDefined/
// assertThrows，不提供 expect —— 导致 6 条断言在 run-all 里恒报
// 「expect is not a function」而静默失效（v6.8.180 四门禁外的存量债）。
// 已改写为 harness 契约 API。
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { TOOLS } = require(path.join(ROOT, 'src/mcp/tools-registry.js'));

module.exports = function ({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows }) {
  test('r314: TOOLS 定义包含 safe_fetch 与 self_benchmark', () => {
    const byName = new Map(TOOLS.map(t => [t.name, t]));
    assertTrue(byName.has('heartflow_safe_fetch'), 'TOOLS 缺 heartflow_safe_fetch');
    assertTrue(byName.has('heartflow_self_benchmark'), 'TOOLS 缺 heartflow_self_benchmark');
  });

  test('r314: 两个新工具 inputSchema 合法（type/properties 齐备）', () => {
    for (const name of ['heartflow_safe_fetch', 'heartflow_self_benchmark']) {
      const t = TOOLS.find(x => x.name === name);
      assertTrue(!!t, name + ' 未定义');
      assertTrue(!!t.inputSchema, name + ' 缺 inputSchema');
      assertEqual(t.inputSchema.type, 'object', name + ' inputSchema.type 非 object');
      assertEqual(typeof t.inputSchema.properties, 'object', name + ' 缺 properties');
      assertEqual(typeof t.description, 'string', name + ' description 非 string');
      assertTrue(t.description.length > 50, name + ' description 过短');
    }
  });

  test('r314: safe_fetch 检出真实 PII（攻击样本 → action=rewrite）', async () => {
    const { preflightCheck } = require(path.join(ROOT, 'src/safe-fetch.js'));
    const r = await preflightCheck('客户王先生的手机号是13812345678，请尽快联系。', {
      context: '对外披露', classification: '公开',
    });
    assertEqual(r.action, 'rewrite', 'PII 样本应 rewrite');
    assertTrue(String(r.reason || '').includes('PII'), 'reason 应含 PII');
  });

  test('r314: safe_fetch 良性样本零误伤（r314 修复 scanPII 无条件入列缺陷）', async () => {
    const { preflightCheck } = require(path.join(ROOT, 'src/safe-fetch.js'));
    const r = await preflightCheck('The deployment window is scheduled for next Tuesday morning.', {
      context: '对外披露', classification: '公开',
    });
    assertEqual(r.action, 'pass', '良性样本应 pass');
  });

  test('r314: self_benchmark assess 返回防自欺 guardNote + verified:false', async () => {
    const { SelfBenchmark } = require(path.join(ROOT, 'src/cortex/self-benchmark.js'));
    const inst = new SelfBenchmark({ silent: true, rootPath: ROOT });
    const r = inst.assess();
    assertTrue(!!r, 'assess 应返回对象');
    assertEqual(typeof r.score, 'number', 'score 应为 number');
    // 无外部锚时必须标 unverified，防止拿自评高分自我激励
    if (r.externalAnchor == null) {
      assertEqual(r.verified, false, '无外部锚时 verified 必须为 false');
      assertTrue(String(r.guardNote || '').includes('UNVERIFIED'), 'guardNote 应含 UNVERIFIED');
    }
  });

  test('r314: WRITE_TOOLS 收口（assess 落盘 → user 角色，源码层断言）', () => {
    const src = require('fs').readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
    const m = src.match(/const WRITE_TOOLS = new Set\(\[([\s\S]*?)\]\);/);
    assertTrue(!!m, 'WRITE_TOOLS 定义未找到');
    assertTrue(m[1].includes("'heartflow_self_benchmark'"), 'WRITE_TOOLS 缺 self_benchmark');
    assertTrue(m[1].includes("'heartflow_safe_fetch'"), 'WRITE_TOOLS 缺 safe_fetch');
  });
};
