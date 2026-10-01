// 负例验证：engram 恢复后 —— ①能 store/recall ②注入假 index 必须按预期降级 ③TTL 过期必须剔除
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { EngramMemory } = require('../src/memory/engram-memory.js');

// ── run-all 记账：hook assert 常用方法真实计数；缺汇总行会被 run-all 判为「不可确认」──
const _stats = { pass: 0, fail: 0 };
for (const _k of ['ok', 'equal', 'notEqual', 'strictEqual', 'notStrictEqual', 'deepStrictEqual', 'deepEqual', 'throws', 'doesNotThrow', 'fail', 'match', 'rejects']) {
  if (typeof assert[_k] !== 'function') continue;
  const _orig = assert[_k].bind(assert);
  Object.defineProperty(assert, _k, {
    configurable: true,
    value: (...a) => {
      try { const r = _orig(...a); _stats.pass++; return r; }
      catch (e) { _stats.fail++; throw e; }
    },
  });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'engram-'));
const idxFile = path.join(tmp, 'data', 'engram-index.json');

const em = new EngramMemory({ maxEntries: 5, ttlMs: 60000, indexPath: idxFile });

// 1. store + recall
const n = em.store([
  { input: 'alpha', tag: 'gate', confidence: 0.9, decision: 'pass', ts: Date.now() },
  { input: 'beta', tag: 'gate', confidence: 0.8, decision: 'verify', ts: Date.now() },
]);
assert.strictEqual(n, 2, 'store 应返回入库条数');
const byTag = em.recall('gate', 3);
assert.strictEqual(byTag.length, 2, 'recall by tag 应取回 2 条');
assert.strictEqual(byTag[0].input, 'alpha', 'recall 应按时间正序（reverse 后）');
assert.strictEqual(byTag[1].input, 'beta');

// 2. recallByDecision —— 调用点 heartflow.js:5558 用
const byDec = em.recallByDecision('verify', 2);
assert.strictEqual(byDec.length, 1, 'recallByDecision 应只取 decision===verify');
assert.strictEqual(byDec[0].input, 'beta');
assert.deepStrictEqual(em.recallByDecision('pass', 2).map((e) => e.input), ['alpha']);
assert.deepStrictEqual(em.recallByDecision(null, 2), [], '非字符串 decisionType 应返回 []');

// 3. 负例 1：maxEntries 边界 —— 超限必须修剪
for (let i = 0; i < 10; i++) {
  em.store([{ input: 'x' + i, tag: 't' + i, ts: Date.now() + i }]);
}
assert.ok(em.stats().total <= 5, '超 maxEntries 必须修剪到 5');
assert.strictEqual(em.stats().total, 5);
// 最旧的 alpha/beta 已被淘汰
assert.deepStrictEqual(em.recall('gate', 5), [], '修剪后旧 tag 应消失');

// 4. 负例 2：TTL 过期必须剔除（注入过去时间戳）
const em2 = new EngramMemory({ maxEntries: 10, ttlMs: 1000, indexPath: path.join(tmp, 'e2.json') });
assert.strictEqual(em2.store([{ input: 'old', tag: 'g', ts: Date.now() - 5000 }]), 1);
assert.deepStrictEqual(em2.recall('g', 5), [], 'TTL 外的条目 recall 不得返回');
assert.strictEqual(em2.forgetStale(), 1, 'forgetStale 应删除 1 条过期');
assert.strictEqual(em2.stats().total, 0, 'forgetStale 后应为空');

// 5. 负例 3：损坏的 index 文件必须降级为空，不能崩
const badIdx = path.join(tmp, 'bad.json');
fs.writeFileSync(badIdx, '{broken json');
const em3 = new EngramMemory({ indexPath: badIdx });
assert.strictEqual(em3.recall('g', 5).length, 0, '损坏 index 必须降级为空数组');
assert.strictEqual(em3.store([{ input: 'ok', tag: 'g' }]), 1, '损坏 index 后仍可正常 store');
const reloaded = new EngramMemory({ indexPath: badIdx });
assert.strictEqual(reloaded.recall('g', 5).length, 1, '持久化后重载应能读回');

// 6. 负例 4：persist 写入目录不存在时必须自动建
const deepIdx = path.join(tmp, 'a', 'b', 'c', 'engram.json');
const em4 = new EngramMemory({ indexPath: deepIdx });
em4.store([{ input: 'deep', tag: 'g' }]);
assert.ok(fs.existsSync(deepIdx), '深层路径必须被创建');

// 7. 负例 5：非数组 traces 必须返回 0，不崩
assert.strictEqual(em.store('not-array'), 0);
assert.strictEqual(em.store(null), 0);
assert.strictEqual(em.store(undefined), 0);
assert.strictEqual(em.store([null, 'str', 42, { input: 'valid', tag: 'v' }]), 4, '数组长度即返回，但只入库合法的');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`结果: ${_stats.pass} 通过, ${_stats.fail} 失败`);
console.log('OK engram-memory 负例验证全通过（5 组负例 + 2 组功能）');
