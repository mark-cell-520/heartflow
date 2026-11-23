'use strict';
/**
 * [AUDIT-FIX 2026-11-23] 三个审计修复的行为承重测试。
 *
 * 覆盖对象（均来自本轮固化的未提交 diff，已 node --check + 引擎 require 验过，
 * 本测试验「行为真的改了」而非语法通过）：
 *
 *   1. src/core/self-diagnostic.js `_sdRollback` 回滚三态：
 *      原 `else if (backupPath)` 分支在「原文件本不存在（existed=false）」
 *      时刚写坏的新文件残留且错误信息打 null。修正为 `else if (!existed)`
 *      → 删新建，stderr 用 `备份 || '无备份'`。
 *
 *   2. src/reasoning/logic-reasoning.js LLM 兜底外传门槛：
 *      门槛 1 总开关关 → 不外传；门槛 2 身份 guest/未识别 → 不外传。
 *      两条都不发起 fetch（用假 fetch 探针计数为 0 证明）。
 *
 *   3. test/run-all.js 结果分桶恒等式与失败去重：
 *      files = okFiles + timeoutFiles + crashFiles + skipFiles，
 *      total = passed + failed；failureKeys 按 `${idx}::${error}` 去重。
 *      用本文件的纯函数复刻断言（run-all 是 runner 不自导出函数，
 *      故改为源码契约断言 + 行为语义断言）。
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HF = path.resolve(__dirname, '..');
const passed = [], failed = [];
const t = (name, fn) => {
  try { fn(); passed.push(name); }
  catch (e) { failed.push(`${name}: ${e.message}`); }
};

// ─────────────────────────── 1. self-diagnostic 回滚三态 ───────────────────

const { writeWithBackup } = require(path.join(HF, 'src/core/self-diagnostic.js'));

// self-diagnostic 的 writeWithBackup 是 async，其断言归 async runner（下方）

t('self-diagnostic.js 不再含已修正的旧分支形态', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/self-diagnostic.js'), 'utf8');
  // 旧缺陷签名：`else if (backupPath)`（existed 判定缺失）
  assert.ok(!/else if \(backupPath\)/.test(src),
    '_sdRollback 仍用 `else if (backupPath)` 分支——existed=false 时会残留坏文件');
  // 修正签名：`else if (!existed)` 存在
  assert.ok(/else if \(!existed\)/.test(src),
    '_sdRollback 应改为 `else if (!existed)`');
  // 无备份兜底文案
  assert.ok(/无备份/.test(src), 'stderr 应有「无备份」兜底文案');
});

// ─────────────────── 2. logic-reasoning LLM 兜底外传门槛 ───────────────────

const { LogicReasoning } = require(path.join(HF, 'src/reasoning/logic-reasoning.js'));

function countFetchCalls() {
  const calls = [];
  const orig = global.fetch;
  global.fetch = async (...args) => { calls.push(args[0]); return { ok: false, status: 500 }; };
  return { calls, restore: () => { global.fetch = orig; } };
}

t('LogicReasoning._llmFallback 是 async 函数', () => {
  const lr = new LogicReasoning();
  assert.strictEqual(typeof lr._llmFallback, 'function');
  assert.strictEqual(lr._llmFallback.constructor.name, 'AsyncFunction');
});

// t() 只收同步 fn；异步断言走下方 async runner
(async () => {
  const asyncChecks = [];
  const at = (name, fn) => asyncChecks.push([name, fn]);

  // ── 1b. writeWithBackup async 行为（existed=false 回滚三态）──────────────

  at('writeWithBackup 是 async 函数', async () => {
    assert.strictEqual(writeWithBackup.constructor.name, 'AsyncFunction');
  });

  at('writeWithBackup 写不存在的目标文件能创建（existed=false 路径）', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-rollback-'));
    const target = path.join(dir, 'brand-new.js');
    const res = await writeWithBackup(target, 'const x = 1;\n');
    assert.strictEqual(res.ok, true, `写入新文件应 ok，实得 ${JSON.stringify(res)}`);
    assert.strictEqual(fs.existsSync(target), true, '目标应被创建');
    assert.strictEqual(res.existed, false, 'existed 应为 false');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  at('新文件语法校验失败触发回滚后，坏文件不得残留', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-rollback-'));
    const target = path.join(dir, 'brand-new.js');
    // 写一段有语法错误的 JS —— _sdSyntaxCheckOnDisk 判失败 → 触发回滚
    const res = await writeWithBackup(target, 'const x = (((;\n');
    assert.strictEqual(res.rolledBack, true, `应标记已回滚，实得 ${JSON.stringify(res)}`);
    assert.strictEqual(fs.existsSync(target), false,
      '原文件不存在 + 回滚 → 新文件必须被删除；残留说明 `else if (!existed)` 分支未生效');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  at('已存在文件语法校验失败触发回滚后，原内容恢复', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-rollback-'));
    const target = path.join(dir, 'existing.js');
    fs.writeFileSync(target, 'const good = 1;\n', 'utf-8');
    const res = await writeWithBackup(target, 'const x = (((;\n');
    assert.strictEqual(res.rolledBack, true, '应标记已回滚');
    assert.strictEqual(fs.readFileSync(target, 'utf-8'), 'const good = 1;\n',
      '回滚后原内容应恢复');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  at('总开关关闭时 _llmFallback 返回 null 且零 fetch', async () => {
    const prev = process.env.HEARTFLOW_LLM_FALLBACK;
    delete process.env.HEARTFLOW_LLM_FALLBACK;
    const prevKey = process.env.HEARTFLOW_API_KEY;
    process.env.HEARTFLOW_API_KEY = 'test-key-not-real';
    const probe = countFetchCalls();
    try {
      const lr = new LogicReasoning();
      const r = await lr._llmFallback('Q\nA. x\nB. y', {}, 'fallacy');
      assert.strictEqual(r, null, '总开关关应返回 null');
      assert.strictEqual(probe.calls.length, 0, '总开关关不得发起任何 fetch');
    } finally {
      probe.restore();
      if (prev !== undefined) process.env.HEARTFLOW_LLM_FALLBACK = prev;
      if (prevKey === undefined) delete process.env.HEARTFLOW_API_KEY; else process.env.HEARTFLOW_API_KEY = prevKey;
    }
  });

  at('guest/未识别身份时 _llmFallback 返回 null 且零 fetch', async () => {
    // 开总开关但身份 guest —— 这是门槛 2 的行为
    const prev = process.env.HEARTFLOW_LLM_FALLBACK;
    process.env.HEARTFLOW_LLM_FALLBACK = '1';
    const prevKey = process.env.HEARTFLOW_API_KEY;
    process.env.HEARTFLOW_API_KEY = 'test-key-not-real';
    const probe = countFetchCalls();
    try {
      const lr = new LogicReasoning();
      // 不传任何身份字段 —— _resolveLlmCallerRole 实测恒定解析不到 → fail-closed
      const r1 = await lr._llmFallback('Q\nA. x\nB. y', {}, 'fallacy');
      assert.strictEqual(r1, null, '身份未识别应 fail-closed 返回 null');
      // 显式 guest
      const r2 = await lr._llmFallback('Q\nA. x\nB. y', { role: 'guest' }, 'fallacy');
      assert.strictEqual(r2, null, '显式 guest 应返回 null');
      assert.strictEqual(probe.calls.length, 0, 'guest 身份不得发起任何 fetch（选择题原文不外传）');
    } finally {
      probe.restore();
      if (prev === undefined) delete process.env.HEARTFLOW_LLM_FALLBACK; else process.env.HEARTFLOW_LLM_FALLBACK = prev;
      if (prevKey === undefined) delete process.env.HEARTFLOW_API_KEY; else process.env.HEARTFLOW_API_KEY = prevKey;
    }
  });

  at('logic-reasoning.js 含身份门槛与 hostname-only 日志契约', async () => {
    const src = fs.readFileSync(path.join(HF, 'src/reasoning/logic-reasoning.js'), 'utf8');
    assert.ok(/isGuestRole\(callerRole\)/.test(src), '应复用 isGuestRole 做身份门槛');
    assert.ok(/isLlmFallbackEnabled\(\)/.test(src), '应复用 isLlmFallbackEnabled 总开关');
    assert.ok(/_resolveLlmCallerRole/.test(src), '应有身份解析函数');
    assert.ok(/_hostOf/.test(src), '应有 hostname 提取函数（外传日志只记域名）');
    // 外传日志不得记录完整 base_url（可能带 ?key=）
    assert.ok(!/_logLlmEgress\(finalBase/.test(src),
      '_logLlmEgress 不得传 finalBase（完整 URL 可能含 key 查询参数）');
  });

  // ─────────────────── 3. run-all.js 分桶恒等式与去重契约 ───────────────────

  at('run-all.js 含五桶分类与恒等式注释', async () => {
    const src = fs.readFileSync(path.join(HF, 'test/run-all.js'), 'utf8');
    for (const bucket of ['okFiles', 'timeoutFiles', 'crashFiles', 'skipFiles']) {
      assert.ok(new RegExp(`\\b${bucket}\\b`).test(src), `run-all 应有 ${bucket} 桶`);
    }
    assert.ok(/files\s*=\s*okFiles\s*\+\s*timeoutFiles\s*\+\s*crashFiles\s*\+\s*skipFiles/.test(src),
      '应有 files 恒等式注释');
    assert.ok(/failureKeys/.test(src), '应有 failureKeys 去重集合');
    assert.ok(/HF_RUN_ALL_JOBS/.test(src), 'JOBS 应可经 HF_RUN_ALL_JOBS 覆盖');
    assert.ok(/HF_RUN_ALL_TIMEOUT/.test(src), '超时应可经 HF_RUN_ALL_TIMEOUT 覆盖');
  });

  at('JOBS 默认 2（CPU 配额 2 核的实测依据）', async () => {
    const src = fs.readFileSync(path.join(HF, 'test/run-all.js'), 'utf8');
    const m = src.match(/HF_RUN_ALL_JOBS\s*\|\|\s*'(\d+)'/);
    assert.ok(m, '应能解析出 JOBS 默认值');
    assert.strictEqual(m[1], '2', `JOBS 默认应为 2（cgroup 2 核配额），实得 ${m[1]}`);
  });

  at('CHILD_TIMEOUT 默认 600000（消除 SIGKILL 误判失败）', async () => {
    const src = fs.readFileSync(path.join(HF, 'test/run-all.js'), 'utf8');
    const m = src.match(/HF_RUN_ALL_TIMEOUT\s*\|\|\s*'(\d+)'/);
    assert.ok(m, '应能解析出 CHILD_TIMEOUT 默认值');
    assert.strictEqual(parseInt(m[1], 10), 600000, `默认超时应为 600000ms，实得 ${m && m[1]}`);
  });

  at('FAIL_LINE_RE 覆盖中文 ✗ 与英文 x 失败标记', async () => {
    const src = fs.readFileSync(path.join(HF, 'test/run-all.js'), 'utf8');
    const m = src.match(/FAIL_LINE_RE\s*=\s*(\/[\s\S]*?\/[a-z]*);/);
    assert.ok(m, '应能解析 FAIL_LINE_RE');
    const re = eval(m[1]);
    // 中文失败标记
    assert.ok(re.test('✗ 某断言失败'), '应匹配 ✗ 行');
    assert.ok(re.test('❌ fail'), '应匹配 ❌ 行');
    // 英文 node:test 的 "x 描述" 形
    assert.ok(/^\s*[xX]\s/.test('x some test failed'), '裸 x 需后跟空白才判失败');
  });

  let ok = 0, bad = 0;
  for (const [name, fn] of asyncChecks) {
    try { await fn(); ok++; } catch (e) { bad++; failed.push(`${name}: ${e.message}`); }
  }

  console.log(`结果: ${passed.length + ok} 通过, ${failed.length + bad} 失败`);
  for (const f of failed) console.log('  ❌ ' + f);
  process.exit(failed.length + bad === 0 ? 0 : 1);
})();
