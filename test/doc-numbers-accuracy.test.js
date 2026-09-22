/**
 * 测试：对外文档数字必须可度量（v6.7.77，心虫 decision.decide 0.93）
 *
 * 来源：第 40 轮心虫选「核对并修正 AGENTS.md/README.md 对外文档数字」。
 *
 * 一、发现：AGENTS.md 违反了它自己的设计原则
 *
 * 该文件 Design principles 第 5 条明写：
 *   "Honest numbers — documentation must state what the code actually does.
 *    If a metric is claimed, it must be measurable."
 * 但同一份文件开头宣称：
 *   46 dimensions / 137 modules / 179 MCP tools / 1,546 dispatch routes
 * 实测（scripts/measure-claimed-numbers.js）：
 *   50 dimensions / 137 modules / 59 MCP tools / 1,727 dispatch routes
 *
 * 四个数字里三个错。且 BLOCK/REWRITE/VERIFY 三层的列举也过时：
 *   文档说 5 block / 7 rewrite / 24 verify，实际 9 / 9 / 26。
 *
 * 二、为什么这个 bug 能长期存在
 *
 * 文档数字是**手写常量**，没有任何测试校验它们。引擎每加一个维度
 * （本轮之前刚加了 indirect_injection、multi_turn_escalation、sealioning、
 *   tone_policing），文档就自动落后一点——但没有任何机制会发现。
 *
 * 三、本测试守什么
 *   从 AGENTS.md / README.md 抓关键数字，与代码实测值逐一比对。
 *   数字变化时必须同步改文档（或改代码），不能只改一边。
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[实测值采集]');

/** 与 scripts/measure-claimed-numbers.js 同一套口径 */
function measure() {
  const idx = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const reg = fs.readFileSync(path.join(HF, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');

  const checkFns = new Set();
  for (const m of idx.matchAll(/^function (check[A-Z]\w*)\s*\(/gm)) checkFns.add(m[1]);

  const tier = label => {
    const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).length : 0;
  };

  const tools = new Set();
  for (const m of reg.matchAll(/name:\s*['"](heartflow_[a-z0-9_]+)['"]/g)) tools.add(m[1]);

  const hStart = srv.indexOf('const HANDLERS');
  const hb = srv.slice(hStart, srv.indexOf('\n};', hStart));
  const handlerKeys = new Set();
  for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) handlerKeys.add(m[1]);

  // 路由数是运行时值（static 只是种子）
  const r = cp.spawnSync('node', ['-e', `
    const {HeartFlow}=require('${path.join(HF, 'src/core/heartflow.js')}');
    const hf=new HeartFlow({dataDir:'${path.join(HF, 'data')}',silent:true});
    hf.start();
    setTimeout(()=>{ console.log(HeartFlow.ALLOWED_ROUTES.size); process.exit(0); }, 4000);
  `], { encoding: 'utf8', timeout: 60000 });
  const routes = parseInt((r.stdout || '').trim().split('\n').pop(), 10) || 0;

  return {
    dimensions: checkFns.size,
    block: tier('BLOCK_DIMS'),
    rewrite: tier('REWRITE_DIMS'),
    verify: tier('VERIFY_DIMS'),
    mcpTools: tools.size,
    handlers: handlerKeys.size,
    routes,
  };
}

const M = measure();
console.log('  实测:', JSON.stringify(M));

console.log('\n[AGENTS.md 宣称值必须匹配]');

const AGENTS = path.join(HF, 'AGENTS.md');

t('维度总数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/(\d+)\s+dimensions/);
  assert.ok(m, 'AGENTS.md 找不到 dimensions 数字');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions,
    `AGENTS.md 说 ${m[1]} dimensions，实测 ${M.dimensions}`);
});

console.log('\n[README.md 与 SKILL.md 宣称值必须匹配（v6.7.78 补充）]');

const README = path.join(HF, 'README.md');
const SKILL = path.join(HF, 'SKILL.md');

t('README.md 维度/工具/路由/测试数匹配', () => {
  const src = fs.readFileSync(README, 'utf8');
  const m = src.match(/(\d+)\s+discrimination dimensions\s*[×x]\s*(\d+)-layer pipeline\s*[×x]\s*(\d+)\s+modules\s*[×x]\s*([\d,]+)\s+MCP tools\s*[×x]\s*([\d,]+)\s+dispatch routes\s*[×x]\s*([\d,]+)\s+passing tests/);
  assert.ok(m, 'README.md 找不到数字横幅（格式可能变了）');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions, `README 维度 ${m[1]} != ${M.dimensions}`);
  assert.strictEqual(parseInt(m[4].replace(/,/g, ''), 10), M.mcpTools, `README 工具 ${m[4]} != ${M.mcpTools}`);
  assert.strictEqual(parseInt(m[5].replace(/,/g, ''), 10), M.routes, `README 路由 ${m[5]} != ${M.routes}`);
});

t('README.md 行内 46→50 引用已更新', () => {
  const src = fs.readFileSync(README, 'utf8');
  // [v6.7.78] 只查**正文宣称**，不查 Version history 段落——那里
  // 引述历史错误数字是刻意的（"docs claimed stale metrics — 46 dimensions..."）。
  // 守卫误报过一次：changelog 刚补上历史说明就被这条断言拦下。
  const changelogStart = src.search(/##\s*Version history/i);
  const body = changelogStart > 0 ? src.slice(0, changelogStart) : src;
  assert.ok(!/46 dimensions/.test(body),
    'README.md 正文仍有过时的 "46 dimensions" 宣称');
});

t('SKILL.md 维度/工具数匹配', () => {
  const src = fs.readFileSync(SKILL, 'utf8');
  const m = src.match(/(\d+)\s+discrimination dimensions/);
  assert.ok(m, 'SKILL.md 找不到 dimensions 数字');
  assert.strictEqual(parseInt(m[1], 10), M.dimensions,
    `SKILL.md 说 ${m[1]} dimensions，实测 ${M.dimensions}`);
  const t = src.match(/([\d,]+)\s+MCP tools/);
  if (t) {
    assert.strictEqual(parseInt(t[1].replace(/,/g, ''), 10), M.mcpTools,
      `SKILL.md 说 ${t[1]} MCP tools，实测 ${M.mcpTools}`);
  }
});

t('SKILL.md 无过时 46 维度引用', () => {
  const src = fs.readFileSync(SKILL, 'utf8');
  // 同样排除 changelog 引述
  const sk = src.search(/##\s*(Version history|Changelog)/i);
  const body = sk > 0 ? src.slice(0, sk) : src;
  assert.ok(!/46 dimensions/.test(body), 'SKILL.md 正文仍有过时引用');
});

t('三个文档数字互相一致', () => {
  const a = fs.readFileSync(AGENTS, 'utf8').match(/(\d+)\s+dimensions/);
  const r = fs.readFileSync(README, 'utf8').match(/(\d+)\s+discrimination dimensions/);
  const s = fs.readFileSync(SKILL, 'utf8').match(/(\d+)\s+discrimination dimensions/);
  assert.strictEqual(a[1], r[1], `AGENTS(${a[1]}) 与 README(${r[1]}) 不一致`);
  assert.strictEqual(a[1], s[1], `AGENTS(${a[1]}) 与 SKILL(${s[1]}) 不一致`);
});

t('MCP 工具数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/([\d,]+)\s+MCP tools/);
  assert.ok(m, 'AGENTS.md 找不到 MCP tools 数字');
  const claimed = parseInt(m[1].replace(/,/g, ''), 10);
  assert.strictEqual(claimed, M.mcpTools,
    `AGENTS.md 说 ${claimed} MCP tools，实测 ${M.mcpTools}`);
});

t('路由数匹配', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/([\d,]+)\s+dispatch\s+routes/);
  assert.ok(m, 'AGENTS.md 找不到 dispatch routes 数字');
  const claimed = parseInt(m[1].replace(/,/g, ''), 10);
  assert.strictEqual(claimed, M.routes,
    `AGENTS.md 说 ${claimed} routes，实测 ${M.routes}`);
});

t('Block 层列举数与 BLOCK_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Block-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Block-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.block,
    `文档说 ${m[1]} 个 block 维度，实测 BLOCK_DIMS = ${M.block}`);
});

t('Rewrite 层列举数与 REWRITE_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Rewrite-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Rewrite-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.rewrite,
    `文档说 ${m[1]} 个 rewrite 维度，实测 REWRITE_DIMS = ${M.rewrite}`);
});

t('Verify 层列举数与 VERIFY_DIMS 一致', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  const m = src.match(/Verify-level\s*\((\d+)\)/);
  assert.ok(m, 'AGENTS.md 找不到 Verify-level 计数');
  assert.strictEqual(parseInt(m[1], 10), M.verify,
    `文档说 ${m[1]} 个 verify 维度，实测 VERIFY_DIMS = ${M.verify}`);
});

t('新增维度已写进文档列举（indirect_injection / multi_turn_escalation）', () => {
  const src = fs.readFileSync(AGENTS, 'utf8');
  for (const d of ['indirect_injection', 'multi_turn_escalation']) {
    assert.ok(src.includes(d),
      `文档维度列举缺 ${d}——引擎已支持但对外文档没写`);
  }
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
