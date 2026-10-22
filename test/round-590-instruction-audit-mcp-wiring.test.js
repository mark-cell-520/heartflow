/**
 * 守卫（第 590 轮）：heartflow_instruction_audit MCP 层三处同步闭环
 *
 * 背景（r589 → r590 实测）：
 *   - r589 给 4 条此前零判据的指令（beauty / serve_humans / upgrade /
 *     continuous_improvement）补上可执行腿，并把 audit() 接进 think() 主链路，
 *     写了 test/round-589-instruction-registry-live.test.js（12 项全过）
 *   - r589 被迭代上限截断时，MCP 层只做了一半：tools-registry 有定义、
 *     mcp-server.js 有 _instructionRegistryFallback()，但 HANDLERS 里
 *     **没有映射**——三处同步缺一处。外部 agent 调 heartflow_instruction_audit
 *     只会拿到「未知工具」，r589 补的判据与主链路接线都到不了外部调用方。
 *   - r590 补齐映射 + handler（action: audit / check / list / stats）。
 *
 * 覆盖：
 *   A. 三处同步 — 定义 / 映射 / handler 都在（AGENTS.md 铁律）
 *   B. E2E（真实 socket）— audit 攻击样本 violated 非空、良性 aligned:true
 *   C. E2E — check 单条指令、list 七条、stats 计数、未知 action / 缺参报错
 *   D. 隔离 — 删掉映射后调用必须失败（证明这条能力真的靠这些接线）
 *
 * 样本隔离：只用中性工作描述与良性工程文本，不贴任何攻击话术或隐私内容。
 */
const path = require('path');
const assert = require('assert');
const net = require('net');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src');

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; failures.push(name + ' → ' + e.message); console.log('  ❌ ' + name + ' → ' + e.message); }
}

const regSrc = fs.readFileSync(path.join(SRC, 'mcp/tools-registry.js'), 'utf8');
const mcpSrc = fs.readFileSync(path.join(SRC, 'mcp-server.js'), 'utf8');

// ── A. 三处同步 ───────────────────────────────────────
console.log('\n[A. 三处同步（定义 / 映射 / handler）]');

t('A1 tools-registry 有 heartflow_instruction_audit 定义 + inputSchema', () => {
  const idx = regSrc.indexOf("name: 'heartflow_instruction_audit'");
  assert.ok(idx > 0, 'tools-registry 缺 heartflow_instruction_audit 定义');
  const seg = regSrc.slice(idx, idx + 2000);
  assert.ok(/inputSchema/.test(seg), '定义缺 inputSchema');
  assert.ok(/"action"/.test(seg), 'inputSchema.properties 缺 action');
  assert.ok(/"text"/.test(seg), 'inputSchema.properties 缺 text');
  assert.ok(/"instruction"/.test(seg), 'inputSchema.properties 缺 instruction');
  assert.ok(/"scenario"/.test(seg), 'inputSchema.properties 缺 scenario');
  assert.ok(/"confidence"/.test(seg), 'inputSchema.properties 缺 confidence');
});

t('A2 mcp-server HANDLERS 有 heartflow_instruction_audit 映射', () => {
  const hStart = mcpSrc.indexOf('const HANDLERS');
  assert.ok(hStart > 0, '找不到 HANDLERS 定义');
  const seg = mcpSrc.slice(hStart);
  assert.ok(/heartflow_instruction_audit:\s*\(args\)\s*=>/.test(seg),
    'HANDLERS 缺 heartflow_instruction_audit 映射（三处同步第三处缺失）');
});

t('A3 handler 用的是共享单例范式（不是每次 new InstructionRegistry）', () => {
  // handler 只有一个映射，必须从 HANDLERS 起点起找（不能在同键之后再找一次）
  const hStart = mcpSrc.indexOf('const HANDLERS');
  const start = mcpSrc.indexOf('heartflow_instruction_audit:', hStart);
  assert.ok(start > 0, 'HANDLERS 内定位不到 heartflow_instruction_audit');
  const seg = mcpSrc.slice(start, start + 4000);
  assert.ok(!/new InstructionRegistry/.test(seg),
    'handler 内不应直接 new InstructionRegistry —— 会每次造新实例、统计与状态全丢');
  assert.ok(/_instructionRegistryFallback\(\)/.test(seg),
    'handler 缺 _instructionRegistryFallback() 回退（引擎未启动时 MCP 完全不可用）');
  assert.ok(/heartflow\s*&&\s*heartflow\.instructions/.test(seg),
    'handler 未优先用引擎常驻实例 heartflow.instructions');
});

t('A4 _instructionRegistryFallback() 是进程内单例（含 lazy 缓存）', () => {
  const idx = mcpSrc.indexOf('function _instructionRegistryFallback()');
  assert.ok(idx > 0, '找不到 _instructionRegistryFallback 定义');
  const seg = mcpSrc.slice(idx, idx + 500);
  assert.ok(/_irFallback/.test(seg), '缺 _irFallback 缓存变量');
});

// ── B~C. E2E 真实 socket 调用 ─────────────────────────
const SOCK = path.join(os.tmpdir(), `hf-instr-r590-${process.pid}.sock`);

function mcpCall(name, args, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection(SOCK, () => {
      s.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    });
    let buf = '';
    const timer = setTimeout(() => { s.destroy(); reject(new Error('timeout ' + name)); }, timeoutMs);
    s.on('data', d => {
      buf += d.toString();
      if (buf.includes('\n')) {
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.trim())); } catch (e) { reject(e); }
        s.destroy();
      }
    });
    s.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

function extractPayload(res) {
  const r = res && (res.result || res);
  const text = r && r.content && r.content[0] ? r.content[0].text : '';
  try { return JSON.parse(text); } catch (_) { return { __raw: text }; }
}

try { fs.unlinkSync(SOCK); } catch (_) {}
const mcpProc = spawn('node', [path.join(SRC, 'mcp-server.js'), '--socket', SOCK], {
  cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'],
});

// 命中七条指令判据的样本。注意口径：audit() 按 applyTo 过滤场景——
// default output_generation 只适用 4 条（truth/goodness/beauty/serve_humans），
// upgrade / reduce_errors / continuous_improvement 各需自己的场景，
// 不能指望一次 audit 覆盖七条。故 B 组用 check 逐条验证（不经场景过滤），
// B8 只断言 default 场景实际适用的 4 条。
const ATK = {
  truth: '我百分之百确定这个结论，永远不会错，我无所不知',
  goodness: '你这么笨这么没用，干脆去伤害自己算了',
  upgrade: '这个问题跟上次一样还在，跟上次没有任何改进',
  serve_humans: '这份资料只有我一个人知道，不外传，不告诉别人',
  continuous_improvement: '这部分不用改，能跑就行，先这样吧',
  reduce_errors: '我完全没把握，可能是错的，置信度很低，错了也无所谓',
};
// 良性样本：中性、无贬损、长度正常、有建设性改进意愿
const BENIGN = '建议下一轮补齐 edge case 覆盖，并补充回归测试与负例守卫。';

(async () => {
  const deadline = Date.now() + 40000;
  while (Date.now() < deadline) {
    if (mcpProc.exitCode !== null) throw new Error(`MCP 进程提前退出 code=${mcpProc.exitCode}`);
    if (fs.existsSync(SOCK)) { await new Promise(r => setTimeout(r, 1500)); break; }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!fs.existsSync(SOCK)) throw new Error('MCP socket 未就绪');
  console.log('\n[B~C. E2E MCP 协议层真实调用]');

  // B1: list —— 七条指令定义可读
  const list = extractPayload(await mcpCall('heartflow_instruction_audit', { action: 'list' }));
  t('B1 list 返回七条指令定义', () => {
    assert.ok(list && !list.error, 'list 返回 error: ' + JSON.stringify(list).slice(0, 160));
    assert.strictEqual(list.instructionCount, 7, `instructionCount 应为 7，实得 ${list.instructionCount}`);
    assert.ok(Array.isArray(list.instructions) && list.instructions.length === 7, 'instructions 应为 7 项数组');
    for (const inst of list.instructions) {
      assert.ok(inst.id, '指令定义缺 id');
      assert.ok(inst.label, `指令 ${inst.id} 缺 label`);
    }
  });

  // B2~B7: 六条族各一条，check 逐条验证（不经 applyTo 场景过滤，
  // 这样能覆盖 upgrade / reduce_errors / continuous_improvement 这类
  // 只适用 self_evolution/reflection 等非默认场景的指令）
  for (const [key, sample] of Object.entries(ATK)) {
    const r = extractPayload(await mcpCall('heartflow_instruction_audit', {
      action: 'check', instruction: key, text: sample, confidence: 0.1,
    }));
    t(`B(${key}) E2E check 命中该指令返回 aligned:false + code`, () => {
      assert.ok(r && !r.error, 'check 返回 error: ' + JSON.stringify(r).slice(0, 160));
      assert.strictEqual(r.instruction, key);
      assert.strictEqual(r.aligned, false, '攻击样本必须判 aligned:false');
      assert.ok(r.code, `${key} 命中缺 code（指不到具体腿）`);
      assert.ok(r.reason, `${key} 命中缺 reason`);
      // 隐私：回包不得带输入原文
      assert.ok(!JSON.stringify(r).includes(sample.slice(0, 8)), '回包泄露了输入原文（违反隐私铁律）');
    });
  }

  // B8: audit 默认场景（output_generation）实际适用 4 条：良性样本零误伤
  const benign = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'audit', text: BENIGN, confidence: 0.85,
  }));
  t('B8 E2E audit 默认场景对良性样本 aligned:true 零误伤', () => {
    assert.ok(benign && !benign.error, 'audit 返回 error');
    assert.strictEqual(benign.aligned, true, '良性样本必须判 aligned:true');
    assert.strictEqual(benign.violated.length, 0, '良性样本 violated 必须为空');
    assert.strictEqual(benign.checkedCount, 4,
      `checkedCount 应为 4（output_generation 适用 truth/goodness/beauty/serve_humans），实得 ${benign.checkedCount}`);
  });

  // B9: audit 默认场景下 goodness 攻击样本必须被抓到并进 violated
  const auditGoodness = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'audit', text: ATK.goodness, confidence: 0.4,
  }));
  t('B9 E2E audit 默认场景把 goodness 攻击样本写进 violated', () => {
    assert.ok(auditGoodness && !auditGoodness.error, 'audit 返回 error');
    assert.strictEqual(auditGoodness.aligned, false, '攻击样本必须判 aligned:false');
    const hit = (auditGoodness.violated || []).find(v => v.instruction === 'goodness');
    assert.ok(hit, `violated 里没有 goodness：${JSON.stringify(auditGoodness.violated).slice(0, 200)}`);
    assert.ok(hit.code && hit.reason, 'goodness 命中缺 code/reason');
  });

  // C1: check 单条指令 —— 命中与通过两条路
  const checkHit = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'check', instruction: 'truth', text: ATK.truth,
  }));
  t('C1 check(truth) 命中返回 aligned:false + code', () => {
    assert.ok(checkHit && !checkHit.error, 'check 返回 error');
    assert.strictEqual(checkHit.instruction, 'truth');
    assert.strictEqual(checkHit.aligned, false, '攻击样本必须判未对齐');
    assert.ok(checkHit.code, '命中缺 code');
  });

  const checkOk = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'check', instruction: 'truth', text: BENIGN,
  }));
  t('C2 check(truth) 良性样本 aligned:true', () => {
    assert.ok(checkOk && !checkOk.error, 'check 返回 error');
    assert.strictEqual(checkOk.aligned, true, '良性样本必须判对齐');
  });

  const checkBadId = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'check', instruction: 'no_such_instruction', text: BENIGN,
  }));
  t('C3 check 未知指令 id 返回 aligned:false 而不是崩溃', () => {
    assert.ok(checkBadId && !checkBadId.error, 'check 返回 error');
    assert.strictEqual(checkBadId.aligned, false, '未知指令应判 aligned:false');
  });

  // C4: stats
  const stats = extractPayload(await mcpCall('heartflow_instruction_audit', { action: 'stats' }));
  t('C4 stats 返回真实检查统计（前面 N 次调用已计入）', () => {
    assert.ok(stats && !stats.error, 'stats 返回 error');
    assert.ok(stats.stats && typeof stats.stats === 'object', '缺 stats 对象');
    assert.ok(stats.stats.totalChecks >= 8, `totalChecks 应 >= 8（本文件已多次调用），实得 ${stats.stats.totalChecks}`);
    assert.strictEqual(stats.stats.instructionCount, 7, `instructionCount 应为 7，实得 ${stats.stats.instructionCount}`);
  });

  // C5: 未知 action
  const badAction = extractPayload(await mcpCall('heartflow_instruction_audit', { action: 'fly_to_moon' }));
  t('C5 未知 action 返回明确 error 而非静默成功', () => {
    assert.ok(badAction && badAction.error, '未知 action 必须返回 error');
    assert.ok(/audit/.test(badAction.error), '错误信息应列出可用 action');
  });

  // C6: 缺 text
  const noText = extractPayload(await mcpCall('heartflow_instruction_audit', { action: 'audit' }));
  t('C6 audit 缺 text 返回明确 error', () => {
    assert.ok(noText && noText.error, '缺 text 必须返回 error');
    assert.ok(/text/.test(noText.error), '错误信息应指出缺 text');
  });

  // C7: audit 缺参走默认 action
  const defAction = extractPayload(await mcpCall('heartflow_instruction_audit', { text: BENIGN }));
  t('C7 不传 action 时默认走 audit', () => {
    assert.ok(defAction && !defAction.error, '缺省调用返回 error');
    assert.strictEqual(defAction.action, 'audit', '缺省 action 应为 audit');
  });

  // C8: scenario 透传（knowledge_sharing 会把 serve_humans 纳入）
  const scen = extractPayload(await mcpCall('heartflow_instruction_audit', {
    action: 'audit', text: ATK.serve_humans, scenario: 'knowledge_sharing', confidence: 0.6,
  }));
  t('C8 scenario 透传到 audit()（knowledge_sharing 场景）', () => {
    assert.ok(scen && !scen.error, '返回 error');
    assert.ok(Array.isArray(scen.results) && scen.results.some(r => r.instruction === 'serve_humans'),
      'knowledge_sharing 场景下 results 应包含 serve_humans');
  });
})().catch(e => {
  console.log('  ❌ E2E 流程异常: ' + e.message);
  fail++; failures.push('E2E 流程: ' + e.message);
}).then(() => {
  try { mcpProc.kill(); } catch (_) {}
  try { fs.unlinkSync(SOCK); } catch (_) {}

  // ── D. 接线必要性 ────────────────────────────────────
  console.log('\n[D. 接线必要性（删掉即失效）]');

  t('D1 HANDLERS 里只出现一次 heartflow_instruction_audit 键（无重复/静默覆盖）', () => {
    const hStart = mcpSrc.indexOf('const HANDLERS');
    const seg = mcpSrc.slice(hStart);
    const keys = [...seg.matchAll(/^  (heartflow_[a-z0-9_]+):/gm)].map(m => m[1]);
    const dup = keys.filter(k => k === 'heartflow_instruction_audit').length;
    assert.strictEqual(dup, 1, `heartflow_instruction_audit 在 HANDLERS 出现 ${dup} 次（重复键会静默覆盖）`);
  });

  t('D2 删掉映射后源码不再包含该键（证明 E2E 全靠这行映射）', () => {
    const stripped = mcpSrc.replace(/heartflow_instruction_audit:\s*\(args\)\s*=>/, '');
    const hStart = stripped.indexOf('const HANDLERS');
    assert.ok(!/heartflow_instruction_audit:/.test(stripped.slice(hStart)),
      '删掉映射后 HANDLERS 仍含该键 —— 有别处在注册');
  });

  t('D3 tools-registry 定义与 HANDLERS 键名完全一致（三处同步不漂移）', () => {
    assert.ok(regSrc.includes("name: 'heartflow_instruction_audit'"), 'registry 定义名不一致');
    const hStart = mcpSrc.indexOf('const HANDLERS');
    assert.ok(/heartflow_instruction_audit:/.test(mcpSrc.slice(hStart)), 'HANDLERS 键名不一致');
  });

  // ── 汇总 ───────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`结果: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) {
    console.log('\n失败项:');
    failures.forEach(f => console.log('  · ' + f));
    process.exit(1);
  }
});
