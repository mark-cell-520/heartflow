// r298 — memoryIndex MCP handler 实测（读/写全 action 覆盖 + 不支持的 action 拒绝）
// 在临时目录里构造 handler 的调用环境，避免污染仓库 data/。
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r298-handler-'));

// 从 mcp-server.js 源码中提取两个 handler 的函数体（用 eval 还原，保证测的就是真实代码）
const mcpSrc = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
// 让 require('./memory/memory-index.js') 解析到仓库真实模块（handler 内部是相对 mcp-server.js 的路径，
// eval 后的 require 是相对本脚本的——预加载并固定 Module._load 到仓库副本）
const Module = require('module');
const realMI = require(path.join(ROOT, 'src/memory/memory-index.js'));
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === './memory/memory-index.js') return realMI;
  return origLoad.apply(this, arguments);
};
global.HF_DIR = TMP;
function extractHandler(name) {
  const marker = `  ${name}: (args) => {`;
  const start = mcpSrc.indexOf(marker);
  if (start < 0) throw new Error('handler not found: ' + name);
  let depth = 0, i = mcpSrc.indexOf('{', start), end = -1;
  for (let j = i; j < mcpSrc.length; j++) {
    if (mcpSrc[j] === '{') depth++;
    else if (mcpSrc[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  const body = mcpSrc.slice(start, end);
  // 去掉 key 前缀，变成 `const handler = (args) => {...}`
  return eval(`(${body.replace(`  ${name}: `, '')})`);
}
const readHandler = extractHandler('heartflow_memory_index_read');
const writeHandler = extractHandler('heartflow_memory_index_write');
const HF_DIR_REF = { value: TMP };
global.HF_DIR = TMP;

(async () => {
  const results = [];
  const t = (name, fn) => { try { fn(); results.push([name, 'PASS']); console.log('PASS', name); } catch (e) { results.push([name, 'FAIL: ' + e.message]); console.log('FAIL', name, e.message); } };

  // 读：8 个 action 全部应有 result 且无 error
  for (const a of ['getIdentity', 'getUser', 'getFeedback', 'getProject', 'getContext', 'getIndex', 'getBootSummary', 'healthCheck']) {
    t('read:' + a, () => {
      const r = readHandler({ action: a });
      assert.ok(!r.error, '无 error');
      assert.ok(r.result !== undefined, '有 result');
      assert.strictEqual(r.action, a);
    });
  }
  // 读：默认 action = getContext
  t('read:default-getContext', () => {
    const r = readHandler({});
    assert.ok(!r.error);
    assert.strictEqual(r.action, 'getContext');
  });
  // 读：不支持的 action 必须拒绝
  t('read:reject-unknown', () => {
    const r = readHandler({ action: 'printBootSummary' });
    assert.ok(r.error, '未知 action 必须报错');
  });

  // 写：updateUser 落盘后再读回（真持久化闭环）
  t('write:updateUser+readback', () => {
    const w = writeHandler({ action: 'updateUser', payload: { name: 'r298-probe', preferences: { lang: 'zh' } } });
    assert.ok(!w.error, 'updateUser 无 error');
    const r = readHandler({ action: 'getUser' });
    assert.strictEqual(r.result.name, 'r298-probe', '读回 name 一致');
  });
  // 写：addSkill + addFeedback + setCurrentWork + addPausedTask 全链路
  t('write:addSkill', () => {
    const r = writeHandler({ action: 'addSkill', payload: { name: 'wiring-test', level: 'probe' } });
    assert.ok(!r.error, 'addSkill 无 error');
  });
  t('write:addFeedback', () => {
    const r = writeHandler({ action: 'addFeedback', payload: { content: 'r298 handler probe', kind: 'test' } });
    assert.ok(!r.error, 'addFeedback 无 error');
  });
  t('write:setCurrentWork', () => {
    const r = writeHandler({ action: 'setCurrentWork', payload: { task: 'verify-wiring', status: 'running' } });
    assert.ok(!r.error, 'setCurrentWork 无 error');
  });
  t('write:addPausedTask', () => {
    const r = writeHandler({ action: 'addPausedTask', payload: { id: 'p1', title: 'probe task' } });
    assert.ok(!r.error, 'addPausedTask 无 error');
  });
  t('write:removePausedTask', () => {
    const r = writeHandler({ action: 'removePausedTask', payload: { id: 'p1' } });
    assert.ok(!r.error, 'removePausedTask 无 error');
  });
  t('write:addUnresolvedProblem', () => {
    const r = writeHandler({ action: 'addUnresolvedProblem', payload: { id: 'x1', desc: 'probe' } });
    assert.ok(!r.error, 'addUnresolvedProblem 无 error');
  });
  t('write:resolveProblem', () => {
    const r = writeHandler({ action: 'resolveProblem', payload: { id: 'x1' } });
    assert.ok(!r.error, 'resolveProblem 无 error');
  });
  t('write:recordBoot', () => {
    const r = writeHandler({ action: 'recordBoot', payload: { version: 'r298-probe' } });
    assert.ok(!r.error, 'recordBoot 无 error');
  });
  // 写：不支持的 action 必须拒绝
  t('write:reject-unknown', () => {
    const r = writeHandler({ action: 'deleteEverything' });
    assert.ok(r.error, '未知写 action 必须报错');
  });
  // 写：缺 action 必须拒绝
  t('write:reject-missing-action', () => {
    const r = writeHandler({});
    assert.ok(r.error, '缺 action 必须报错');
  });
  // 落盘文件真实存在于 TMP（不落仓库 data/）
  t('persist:data-file-in-tmp', () => {
    const p = path.join(TMP, 'data', 'memory-index.json');
    assert.ok(fs.existsSync(p), 'data/memory-index.json 落在临时根');
    assert.ok(!fs.existsSync(path.join(ROOT, 'data', 'memory-index.json')), '仓库 data/ 未被污染');
  });

  const passed = results.filter(r => r[1] === 'PASS').length;
  console.log(`\nr298-handler: ${passed}/${results.length} passed`);
  // 清理
  fs.rmSync(TMP, { recursive: true, force: true });
  if (passed !== results.length) process.exit(1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
