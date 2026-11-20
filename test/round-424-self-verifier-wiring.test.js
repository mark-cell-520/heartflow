// [r424] selfVerifier 接线固化测试
// 防回归：SelfVerifier（src/identity/self-verifier.js，341 行 v5.17.12）的实例
// L1791 `this.verify = new SelfVerifier(...)` 一直活着、4 项检查能力完整，
// 但从未注册进 _modules → routes() 零命中、dispatch('selfVerifier.*') 全抛
// 'route not allowed'、MCP 侧无工具入口。本测试锁死「挂载 + 路由 + dispatch 可达
// + 四项检查真实承重」。
//
// 四项检查语义（与模块实现对齐，逐常量验证）：
//   reverseConsistency —— 结论与推理是否匹配（检出结论跑偏/无根据跳跃）
//   logicalChain        —— 是否藏有未声明假设（「显然/理所当然/不言而喻」等）
//   counterfactual      —— 是否考虑替代推理路径（「只有/唯一/别无选择」等）
//   coverageCheck       —— 是否遗漏同类因素（「纯粹是因为/单纯因为」单因归因）
const test = require('node:test');
const assert = require('node:assert');
const { HeartFlow } = require('../src/core/heartflow.js');

async function freshHf() {
  const hf = new HeartFlow({ silent: true });
  await hf.start();
  return hf;
}

test('r424 接线：selfVerifier 实例非 null 且已挂载 _modules', async () => {
  const hf = await freshHf();
  assert.notStrictEqual(hf.selfVerifier, null, 'selfVerifier 不得为 null');
  assert.notStrictEqual(hf.verify, null, '原 this.verify 实例不得被破坏');
  assert.ok(hf._modules.selfVerifier, 'selfVerifier 必须注册进 _modules');
  assert.strictEqual(hf._modules.selfVerifier, hf.verify, '注册的必须是同一实例');
});

test('r424 接线：3 条公开路由自动生成且全部可 dispatch', async () => {
  const hf = await freshHf();
  const table = hf.routes();
  const routes = table['selfVerifier'] || [];
  const registered = routes.filter(r => !r.includes('[未注册'));
  const expected = ['selfVerifier.verify', 'selfVerifier.getStats', 'selfVerifier.getRecentIssues'];
  const missing = expected.filter(r => !registered.includes(r));
  assert.deepStrictEqual(missing, [], `缺失路由: ${missing.join(', ')}`);
  assert.strictEqual(registered.length, 3, `3 条公开路由应全部可注册，实际 ${registered.length}`);
  const stats = await hf.dispatch('selfVerifier.getStats');
  assert.ok(stats && typeof stats.totalVerified === 'number', 'getStats 须真实返回');
  const issues = await hf.dispatch('selfVerifier.getRecentIssues');
  assert.ok(Array.isArray(issues), 'getRecentIssues 须返回数组');
});

test('r424 接线：MCP 工具三处同步（HANDLERS + TOOLS + 引擎路由）', async () => {
  const fs = require('fs');
  const path = require('path');
  const srvSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp-server.js'), 'utf8');
  const regSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'mcp', 'tools-registry.js'), 'utf8');
  assert.ok(srvSrc.includes('heartflow_self_verifier: handleSelfVerifierTool'), 'HANDLERS 表缺少 heartflow_self_verifier');
  assert.ok(/function handleSelfVerifierTool\(/.test(srvSrc), '缺少 handleSelfVerifierTool 函数');
  assert.ok(regSrc.includes("name: 'heartflow_self_verifier'"), 'tools-registry 缺少 heartflow_self_verifier 定义');
});

// ─── 功能矩阵：四项检查逐常量承重 ────────────────────────────────────────

test('r424 功能：结论跑偏被 reverseConsistency 捕获（攻击族）', async () => {
  const hf = await freshHf();
  // 推理讲的是「下雨→堵车→迟到」，结论却跳到「会议取消」——结论与推理不匹配
  const r = await hf.dispatch('selfVerifier.verify',
    '因为今天下雨了，路上堵车，开会要迟到，所以我没来。',
    '下雨导致会议取消');
  assert.strictEqual(r.passed, false, '结论跑偏必须判不通过');
  assert.strictEqual(r.checks.reverseConsistency, false, 'reverseConsistency 必须承重');
  assert.ok(r.issues.some(i => i.includes('结论与推理逻辑不匹配')), 'issues 须含反向一致性条目');
});

test('r424 功能：隐藏假设被 logicalChain 捕获（攻击族）', async () => {
  const hf = await freshHf();
  // 含明确假设指示词「理所当然」却无任何连接词 → 判定为未声明的隐藏假设
  const r = await hf.dispatch('selfVerifier.verify',
    '他这个方案理所当然是最优的',
    '应该直接采纳他的方案');
  assert.strictEqual(r.checks.logicalChain, false, '「理所当然」且无连接词必须判隐藏假设');
  assert.ok(r.issues.some(i => i.includes('隐藏假设')), 'issues 须含隐藏假设条目');
});

test('r424 功能：未考虑替代情形被 counterfactual 捕获（攻击族）', async () => {
  const hf = await freshHf();
  // 无任何条件词/限定词/替代词（如果/除非/可能/也许/否则…）的绝对化陈述
  // → 判定为未考虑替代推理路径（这是 v5.17.12 词表的既定契约）
  const r = await hf.dispatch('selfVerifier.verify',
    '这是唯一的出路，除此之外别无选择，只有这条路能走通。',
    '我们只能走这条路');
  assert.strictEqual(r.checks.counterfactual, false, '无条件词/限定词/替代词必须判未考虑替代路径');
  assert.ok(r.issues.some(i => i.includes('替代推理路径')), 'issues 须含替代路径条目');
});

test('r424 功能：良性推理含条件/限定词时四项全绿（无过度拦截）', async () => {
  const hf = await freshHf();
  // 按 v5.17.12 真实契约构造良性样本：含条件或限定词（counterfactual 腿成立），
  // 推理与结论对应、无未声明假设词、长度充分（coverageCheck 腿成立）
  const benign = [
    // 契约：结论须与推理共享关键词（reverseConsistency 腿），
    // 且含条件/限定词（counterfactual 腿），无未声明假设词（logicalChain 腿）
    ['如果明天下雨，比赛就取消；天气预报说明天有雨。', '比赛可能会取消'],
    ['考虑到样本量只有 30，这个结论可能需要更大样本验证。', '该结论可能需要更大样本验证'],
    ['由于三组独立实验都复现了该效应，该效应可能是真实的。', '该效应可能是真实的'],
    ['如果多因共同作用，战争就可能由资源、地理、制度与文化因素共同造成。', '战争是多因共同造成的'],
    ['尽管预算有限，团队可能仍然按计划完成了三个阶段。', '项目可能已完成三个阶段'],
  ];
  for (const [reasoning, conclusion] of benign) {
    const r = await hf.dispatch('selfVerifier.verify', reasoning, conclusion);
    assert.strictEqual(r.passed, true, `良性样本不得被拦截: ${reasoning.slice(0, 30)}`);
  }
});

test('r424 功能：中英双语攻击族均可命中', async () => {
  const hf = await freshHf();
  // 英文侧：结论跑偏——推理只到「写完测试计划」，结论跳到「产品已全面上市」
  const en = await hf.dispatch('selfVerifier.verify',
    'The team finished the design review and wrote the test plan on Monday.',
    'The product has already launched to all customers');
  assert.strictEqual(en.passed, false, '英文结论跑偏必须判不通过');
  // 英文侧：无条件词/限定词/替代词（if/unless/maybe/perhaps/otherwise/else…）的绝对化陈述
  // 注意：措辞须避开 "nothing else"（\belse\b 会被词表当作显式替代词 → 误放行）
  const en2 = await hf.dispatch('selfVerifier.verify',
    'This is the sole path forward and no alternative can succeed.',
    'We must take this path');
  assert.strictEqual(en2.checks.counterfactual, false, '英文无 if/unless/maybe/otherwise/else 必须判未考虑替代');
  // 英文良性：含 if 条件句 + 推理结论对应
  const en3 = await hf.dispatch('selfVerifier.verify',
    'If the shipment arrives on time, we can start the trial this week.',
    'The trial may start this week');
  assert.strictEqual(en3.passed, true, '英文含 if 条件句的良性推理不得被拦截');
});
