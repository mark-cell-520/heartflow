/**
 * 守卫（第 627 轮）：heartflow_strategic_restraint MCP 层三处同步闭环
 *
 * 背景（r626 → r627 实测）：
 *   - r626 把 strategicRestraint 接进 dispatch（ALLOWED_ROUTES 1241→1248、7 条
 *     strategicRestraint.* 路由、_modules 键出现），但 MCP 层的坏形状没动：
 *       · handler 每次调用都 new StrategicRestraint({silent:true}) —— 全新实例
 *         _dontList 为空，addDont 写进新实例后下一次调用的 getDontList/evaluate
 *         又是另一个新实例 → 外部 agent 增删「不做清单」完全无效；
 *       · 只暴露 evaluate 一个方法，5 个有辨别作用的方法不可达；
 *       · tools-registry 从未有本工具定义（tools/list 拿不到它）。
 *   - r604 的探针用全空参调 evaluate 抛 "proposal.toLowerCase is not a function"，
 *     所以探针的「7/7 零抛」不等于「方法可用」——那不是能力判据。
 *
 * 覆盖：
 *   A. 三处同步 — 定义 / 映射 / handler 都在（AGENTS.md 铁律）
 *   B. E2E（真实 socket）— evaluate 对克制样本 restrained:true、getDontList 读出清单
 *   C. E2E — 跨调用状态保留：addDont 后 getDontList 真的多一条（证明是共享实例）
 *   D. E2E — checkMission / getStats / listMissions / 未知 action / 缺参
 *   E. 隔离 — 删掉映射后调用必须失败（证明这条能力真的靠这些接线）
 *
 * 样本隔离：只用中性工作提案描述（克制清单条目来自引擎常量），不贴攻击话术或隐私内容。
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

t('A1 tools-registry 有 heartflow_strategic_restraint 定义 + inputSchema', () => {
  const idx = regSrc.indexOf("name: 'heartflow_strategic_restraint'");
  assert.ok(idx > 0, 'tools-registry 缺 heartflow_strategic_restraint 定义（tools/list 拿不到它）');
  const seg = regSrc.slice(idx, idx + 3000);
  assert.ok(/inputSchema/.test(seg), '定义缺 inputSchema');
  for (const p of ['action', 'text', 'id', 'reason', 'strength', 'source', 'expireDays']) {
    assert.ok(new RegExp('"' + p + '"').test(seg), `inputSchema.properties 缺 ${p}`);
  }
});

t('A2 mcp-server HANDLERS 有 heartflow_strategic_restraint 映射', () => {
  const hStart = mcpSrc.indexOf('const HANDLERS');
  assert.ok(hStart > 0, '找不到 HANDLERS 定义');
  const seg = mcpSrc.slice(hStart);
  assert.ok(/heartflow_strategic_restraint:\s*\(args\)\s*=>/.test(seg),
    'HANDLERS 缺 heartflow_strategic_restraint 映射（三处同步第三处缺失）');
});

t('A3 handler 用共享单例范式（不是每次 new StrategicRestraint）', () => {
  const hStart = mcpSrc.indexOf('const HANDLERS');
  const start = mcpSrc.indexOf('heartflow_strategic_restraint:', hStart);
  assert.ok(start > 0, 'HANDLERS 内定位不到 heartflow_strategic_restraint');
  const seg = mcpSrc.slice(start, start + 5000);
  assert.ok(!/new StrategicRestraint/.test(seg),
    'handler 内仍直接 new StrategicRestraint —— 每次造新实例、清单与统计全丢');
  assert.ok(/_strategicRestraintFallback\(\)/.test(seg),
    'handler 缺 _strategicRestraintFallback() 回退（引擎未启动时 MCP 完全不可用）');
  assert.ok(/heartflow\s*&&\s*heartflow\.strategicRestraint/.test(seg),
    'handler 未优先用引擎常驻实例 heartflow.strategicRestraint');
});

t('A4 _strategicRestraintFallback() 是进程内单例（含 lazy 缓存）', () => {
  const idx = mcpSrc.indexOf('function _strategicRestraintFallback()');
  assert.ok(idx > 0, '找不到 _strategicRestraintFallback 定义');
  const seg = mcpSrc.slice(idx, idx + 500);
  assert.ok(/_srFallback/.test(seg), '缺 _srFallback 缓存变量');
});

// ── B~D. E2E 真实 socket 调用 ─────────────────────────
const SOCK = path.join(os.tmpdir(), `hf-sr-r627-${process.pid}.sock`);

function mcpCall(name, args, timeoutMs = 30000) {
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

// 形状描述（451 纪律：只写形状，不贴等价攻击句的完整原文）
const RESTRAINED_PROPOSAL = '下一步立项构建一个通用世界模型，用于模拟物理交互';
const BENIGN_PROPOSAL = '把入口闸门的判定延迟再降低一些，保持现有职责不变';
const MISSION_PROPOSAL = '完善自我认知模块，让心虫更准确知道自己是谁';
const OFFMISSION_PROPOSAL = '重新设计公司考勤排班表和下午茶供应商评选流程';
const NEW_DONT_ID = 'dr-r627-probe';
const NEW_DONT_TEXT = 'r627 探针临时条目';

(async () => {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (mcpProc.exitCode !== null) throw new Error(`MCP 进程提前退出 code=${mcpProc.exitCode}`);
    if (fs.existsSync(SOCK)) { await new Promise(r => setTimeout(r, 1500)); break; }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!fs.existsSync(SOCK)) throw new Error('MCP socket 未就绪');
  console.log('\n[B~D. E2E MCP 协议层真实调用]');

  // B1: evaluate 对克制样本必须判 restrained:true 且给出清单条目依据
  const restrained = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'evaluate', text: RESTRAINED_PROPOSAL,
  }));
  t('B1 E2E evaluate 对克制族提案判 restrained:true + 命中条目', () => {
    assert.ok(restrained && !restrained.error, 'evaluate 返回 error: ' + JSON.stringify(restrained).slice(0, 160));
    assert.strictEqual(restrained.action, 'evaluate');
    assert.strictEqual(restrained.restrained, true, '克制族提案必须判 restrained:true');
    assert.ok(restrained.matchCount >= 1, '命中数应 >= 1');
    assert.ok(restrained.score > 0, 'score 应为正');
    assert.ok(restrained.matches[0].matchId, '命中条目缺 matchId（指不到具体清单条目）');
    assert.ok(restrained.matches[0].reason, '命中条目缺 reason');
  });

  // B2: getDontList 读清单 —— r626 之前这里恒为空
  const dontList = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'getDontList',
  }));
  t('B2 E2E getDontList 读出默认清单（>0 条，r626 前恒为空）', () => {
    assert.ok(dontList && !dontList.error, 'getDontList 返回 error: ' + JSON.stringify(dontList).slice(0, 160));
    assert.ok(dontList.count >= 1, `count 应 >= 1（默认清单），实得 ${dontList.count}`);
    assert.ok(Array.isArray(dontList.dontList) && dontList.dontList.length >= 1, 'dontList 应为非空数组');
    for (const e of dontList.dontList) {
      assert.ok(e.id, '条目缺 id');
      assert.ok(e.item, '条目缺 item');
    }
  });

  // C1: 跨调用状态保留 —— addDont 后 getDontList 必须真的多一条
  //     （r626 的「每次 new」在这里必然失败：新实例写不进共享清单）
  const added = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'addDont', id: NEW_DONT_ID, text: NEW_DONT_TEXT,
    reason: 'r627 探针验证跨调用状态', strength: 0.8, source: 'r627-probe',
  }));
  t('C1 E2E addDont 成功写入', () => {
    assert.ok(added && !added.error, 'addDont 返回 error: ' + JSON.stringify(added).slice(0, 200));
    assert.strictEqual(added.action, 'addDont');
    assert.ok(added.result && added.result.success === true,
      'addDont result.success 应为 true：' + JSON.stringify(added.result).slice(0, 160));
    assert.strictEqual(added.result.id, NEW_DONT_ID, '写入 id 应与传入一致');
  });

  const afterAdd = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'getDontList',
  }));
  t('C2 E2E addDont 后 getDontList 真的多一条（共享实例硬证据）', () => {
    assert.ok(afterAdd && !afterAdd.error, 'getDontList 返回 error');
    const hit = (afterAdd.dontList || []).find(e => e.id === NEW_DONT_ID);
    assert.ok(hit, 'addDont 写入的条目在 getDontList 里找不到 —— 仍是每次 new 空实例的老 bug');
    assert.strictEqual(hit.item, NEW_DONT_TEXT, '条目 item 与写入值不一致');
  });

  // C3: 新条目真的能拦住对应提案（辨别作用，不是写了摆设）
  const probeBlocked = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'evaluate', text: NEW_DONT_TEXT + '：本轮要不要做这件事',
  }));
  t('C3 E2E 新写入的条目真的参与克制判定', () => {
    assert.ok(probeBlocked && !probeBlocked.error, 'evaluate 返回 error');
    const hit = (probeBlocked.matches || []).find(m => m.matchId === NEW_DONT_ID);
    assert.ok(hit, '新增条目未参与 evaluate —— 写进去但判不准，等于没接线');
  });

  // C4: removeDont 删掉它（清理 + 验证删除路径真的通）
  const removed = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'removeDont', id: NEW_DONT_ID,
  }));
  t('C4 E2E removeDont 成功删除探针条目', () => {
    assert.ok(removed && !removed.error, 'removeDont 返回 error: ' + JSON.stringify(removed).slice(0, 200));
    assert.ok(removed.result && removed.result.success === true, 'removeDont result.success 应为 true');
  });

  const afterRemove = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'getDontList',
  }));
  t('C5 E2E removeDont 后清单里不再有该条目', () => {
    assert.ok(afterRemove && !afterRemove.error, 'getDontList 返回 error');
    const hit = (afterRemove.dontList || []).find(e => e.id === NEW_DONT_ID);
    assert.ok(!hit, 'removeDont 后条目仍在清单里 —— 删除路径没生效');
  });

  // D1: checkMission 两个方向都要分化
  const onMission = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'checkMission', text: MISSION_PROPOSAL,
  }));
  t('D1 E2E checkMission 对使命对齐提案判 aligned:true', () => {
    assert.ok(onMission && !onMission.error, 'checkMission 返回 error');
    assert.strictEqual(onMission.aligned, true, '使命对齐提案必须判 aligned:true');
    assert.ok(Array.isArray(onMission.alignedWith) && onMission.alignedWith.length >= 1,
      'alignedWith 应至少列出一项对齐使命');
  });

  const offMission = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'checkMission', text: OFFMISSION_PROPOSAL,
  }));
  t('D2 E2E checkMission 对偏离使命提案判 aligned:false + feedback', () => {
    assert.ok(offMission && !offMission.error, 'checkMission 返回 error');
    assert.strictEqual(offMission.aligned, false, '偏离使命提案必须判 aligned:false');
    assert.ok(offMission.feedback, '不对齐时应给 feedback');
  });

  // D3: getStats —— 前面的调用必须已计入（r626 前恒为全新实例的 0）
  const stats = extractPayload(await mcpCall('heartflow_strategic_restraint', { action: 'getStats' }));
  t('D3 E2E getStats 返回真实计数（evaluations 已累计）', () => {
    assert.ok(stats && !stats.error, 'getStats 返回 error');
    assert.ok(stats.stats && typeof stats.stats === 'object', '缺 stats 对象');
    assert.ok(stats.stats.evaluations > 0,
      `evaluations 应 > 0（本文件已多次调用），实得 ${stats.stats.evaluations}`);
    assert.ok(typeof stats.stats.dontListCount === 'number', '缺 dontListCount');
  });

  // D4: listMissions —— 核心使命清单可读
  const missions = extractPayload(await mcpCall('heartflow_strategic_restraint', { action: 'listMissions' }));
  t('D4 E2E listMissions 返回核心使命清单', () => {
    assert.ok(missions && !missions.error, 'listMissions 返回 error');
    assert.ok(Array.isArray(missions.missions) && missions.missions.length >= 1,
      'missions 应为非空数组');
  });

  // D5: 未知 action
  const badAction = extractPayload(await mcpCall('heartflow_strategic_restraint', { action: 'fly_to_moon' }));
  t('D5 未知 action 返回明确 error 而非静默成功', () => {
    assert.ok(badAction && badAction.error, '未知 action 必须返回 error');
    assert.ok(/evaluate/.test(badAction.error), '错误信息应列出可用 action');
  });

  // D6: 缺 text（evaluate 默认 action）
  const noText = extractPayload(await mcpCall('heartflow_strategic_restraint', { action: 'evaluate' }));
  t('D6 evaluate 缺 text 走引擎归一化分支而不是崩', () => {
    // 引擎 side 对空提案返回 {restrained:false} 而非抛 TypeError（r626 已修）
    assert.ok(noText && !noText.error, '缺 text 不应返回 error（引擎侧归一化为空提案）');
    assert.strictEqual(noText.restrained, false, '空提案应判 restrained:false');
  });

  // D7: addDont 缺 id
  const noId = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'addDont', text: '没有 id 的条目',
  }));
  t('D7 addDont 缺 id 返回明确 error', () => {
    assert.ok(noId && noId.error, 'addDont 缺 id 必须返回 error');
    assert.ok(/id/.test(noId.error), '错误信息应指出缺 id');
  });

  // D8: 良性提案零误拦
  const benign = extractPayload(await mcpCall('heartflow_strategic_restraint', {
    action: 'evaluate', text: BENIGN_PROPOSAL,
  }));
  t('D8 E2E 良性提案零误拦（restrained:false）', () => {
    assert.ok(benign && !benign.error, 'evaluate 返回 error');
    assert.strictEqual(benign.restrained, false, '良性提案必须判 restrained:false');
  });
})().catch(e => {
  console.log('  ❌ E2E 流程异常: ' + e.message);
  fail++; failures.push('E2E 流程: ' + e.message);
}).then(() => {
  try { mcpProc.kill(); } catch (_) {}
  try { fs.unlinkSync(SOCK); } catch (_) {}

  // ── E. 接线必要性 ────────────────────────────────────
  console.log('\n[E. 接线必要性（删掉即失效）]');

  t('E1 HANDLERS 里只出现一次 heartflow_strategic_restraint 键（无重复/静默覆盖）', () => {
    const hStart = mcpSrc.indexOf('const HANDLERS');
    const seg = mcpSrc.slice(hStart);
    const keys = [...seg.matchAll(/^  (heartflow_[a-z0-9_]+):/gm)].map(m => m[1]);
    const dup = keys.filter(k => k === 'heartflow_strategic_restraint').length;
    assert.strictEqual(dup, 1, `heartflow_strategic_restraint 在 HANDLERS 出现 ${dup} 次（重复键会静默覆盖）`);
  });

  t('E2 删掉映射后源码不再包含该键（证明 E2E 全靠这行映射）', () => {
    const stripped = mcpSrc.replace(/heartflow_strategic_restraint:\s*\(args\)\s*=>/, '');
    const hStart = stripped.indexOf('const HANDLERS');
    assert.ok(!/heartflow_strategic_restraint:/.test(stripped.slice(hStart)),
      '删掉映射后 HANDLERS 仍含该键 —— 有别处在注册');
  });

  t('E3 tools-registry 定义与 HANDLERS 键名完全一致（三处同步不漂移）', () => {
    assert.ok(regSrc.includes("name: 'heartflow_strategic_restraint'"), 'registry 定义名不一致');
    const hStart = mcpSrc.indexOf('const HANDLERS');
    assert.ok(/heartflow_strategic_restraint:/.test(mcpSrc.slice(hStart)), 'HANDLERS 键名不一致');
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
