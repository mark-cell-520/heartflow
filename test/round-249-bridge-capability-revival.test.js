/**
 * round-249-bridge-capability-revival.test.js
 *
 * r249 轮测试：bridge 交流层缺陷修复 + 能力复活
 *
 * 本轮修四个实测确认的真缺陷（scripts/tmp-249-probe.js / probe2.js）：
 *   ① dispatch('translator.toneAnalyzer') 恒返回 {tone:'neutral',confidence:0}
 *      —— src/bridge/tone-analyzer.js（12037 字节）从未被 require，是死代码
 *   ② dispatch('translator.implicitNeedDetector') 恒返回 []
 *      —— src/bridge/implicit-need-detector.js（5513 字节）同上
 *   ③ dispatch('personaCore.valueAligner') 抛 TypeError: va.check is not a function
 *      —— personaCore 写 va.check()，stub 只有 align()
 *   ④ dispatch('personaCore.metaPosition') 抛 TypeError: mp.getDeclaration is not a function
 *      —— personaCore 写 mp.getDeclaration()，stub 只有 get()
 *   ⑤ MCP heartflow_bridge_analyze 100% 返回 {"error":"StanceDetector is not defined"}
 *      —— src/mcp-server.js 的 handleBridgeAnalyze 里两个标识符从未被 require
 *
 * 并新增公开方法 translator.communicationBrief + MCP 工具
 * heartflow_communication_brief（AGENTS.md 约定 3：工具定义 + handler 映射 + handler 函数）。
 *
 * 运行：node test/round-249-bridge-capability-revival.test.js
 */

'use strict';

// [r249] src/mcp-server.js 在**模块顶层**强制要求认证 token，缺则直接
// process.exit(1)（src/mcp-server.js:211-216）。run-all.js 起的子进程不带
// HEARTFLOW_MCP_TOKEN，D 族 require 它会把整个测试进程静默杀掉、连汇总行都
// 打不出来（本轮首跑实测：无 token 时输出停在第 [D 族] 标题）。故在 require
// 之前注入一个仅本进程可见的值。
if (!process.env.HEARTFLOW_MCP_TOKEN && !process.env.MCP_HEARTFLOW_API_KEY && !process.env.MCP_HEARTFLOW_KEY) {
  process.env.HEARTFLOW_MCP_TOKEN = 'round-249-local-test-token';
}

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const HF = path.join(__dirname, '..');
const results = [];
const asyncTests = [];
function t(name, fn) {
  const p = (async () => fn())();
  if (p && typeof p.then === 'function') {
    asyncTests.push(p.then(
      () => { results.push({ name, ok: true }); console.log(`  ✅ ${name}`); },
      (e) => { results.push({ name, ok: false, err: e.message }); console.log(`  ❌ ${name}\n     ${e.message}`); }
    ));
    return;
  }
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`  ✅ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
    console.log(`  ❌ ${name}\n     ${e.message}`);
  }
}

// ─── 共享：一个 start 过的引擎实例 ───
let hf = null;
let dispatchError = null;
try {
  const { createHeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  hf = createHeartFlow();
  hf.start();
} catch (e) {
  dispatchError = e.message;
}

console.log('\n[A 族] 复活：toneAnalyzer / implicitNeedDetector 不再返回恒值');

const TONE_CASES = [
  // [输入, 期望 urgency, 期望 emotion 或 null(不校验)]
  ['urgently need this fixed right now, please help ASAP!!!', 'high', null],
  ['我很满意这个结果，谢谢！', 'low', 'positive'],
  ['今天天气怎么样？', 'low', null],
];
const STUB_TONE = { tone: 'neutral', confidence: 0 };

t('A1 三条输入的 tone 全部不是 stub 常量 {tone:neutral,confidence:0}', () => {
  assert.ok(hf, '引擎未启动: ' + dispatchError);
  for (const [input] of TONE_CASES) {
    const tone = hf.dispatch('translator.toneAnalyzer', input, {});
    assert.ok(tone && typeof tone === 'object', `tone 不是对象: ${JSON.stringify(tone)}`);
    assert.notDeepStrictEqual(tone, STUB_TONE, `仍是 stub 恒值: ${input}`);
    // 真 ToneAnalyzer 的四维字段
    for (const k of ['urgency', 'emotion', 'formality', 'intensity']) {
      assert.ok(k in tone, `tone 缺字段 ${k}: ${JSON.stringify(tone)}`);
    }
  }
});

t('A2 高紧迫句被判 urgency=high（stub 恒为 neutral/0，不可能满足）', () => {
  const tone = hf.dispatch('translator.toneAnalyzer', TONE_CASES[0][0], {});
  assert.strictEqual(tone.urgency, 'high');
  assert.ok(tone.details && tone.details.urgencySignals.length > 0, '缺 urgencySignals');
});

t('A3 情绪正向句被判 positive 且 intensity > 0', () => {
  const tone = hf.dispatch('translator.toneAnalyzer', TONE_CASES[1][0], {});
  assert.strictEqual(tone.emotion, 'positive');
  assert.ok(typeof tone.intensity === 'number' && tone.intensity > 0, `intensity=${tone.intensity}`);
  assert.strictEqual(tone.urgency, 'low', `urgency=${tone.urgency}`);
});

t('A4 implicitNeedDetector 从恒 [] 变为真检测（8 类需求）', () => {
  const r = hf.dispatch('translator.implicitNeedDetector', '那个东西怎么用来着？比如举个例子说明一下', {});
  assert.ok(r && Array.isArray(r.needs), 'needs 不是数组');
  assert.ok(r.count >= 2, `count=${r.count}，期望 ≥2`);
  assert.ok(r.needs.some(n => n.type === 'need_example'), '未检出 need_example');
  assert.ok(r.needs.some(n => n.type === 'need_clarification'), '未检出 need_clarification');
  assert.ok(typeof r.summary === 'string' && r.summary.length > 0, '缺 summary');
  // 每条 need 都带可审计字段
  for (const n of r.needs) {
    for (const k of ['type', 'confidence', 'signal', 'suggestion']) {
      assert.ok(k in n, `need 缺字段 ${k}`);
    }
  }
});

t('A5 无隐性需求的输入返回空但不报错（诚实零命中）', () => {
  const r = hf.dispatch('translator.implicitNeedDetector', '今天天气不错', {});
  assert.strictEqual(r.count, 0);
  assert.strictEqual(r.summary, '');
});

t('A6 两个真实模块确实存在于 src/bridge/ 且被 require 过', () => {
  for (const f of ['tone-analyzer.js', 'implicit-need-detector.js']) {
    const p = path.join(HF, 'src/bridge', f);
    assert.ok(fs.existsSync(p), `缺文件 ${f}`);
    assert.ok(fs.statSync(p).size > 5000, `${f} 只有 ${fs.statSync(p).size} 字节`);
  }
  // 加载过 real 类的证据：实例上带模块自报名
  const ta = hf.translator._toneAnalyzer;
  assert.strictEqual(ta.name, 'tone-analyzer', `toneAnalyzer 实例 name=${ta.name}（stub 无 name）`);
  assert.strictEqual(ta.version, '2.0.0');
  const ind = hf.translator._implicitNeedDetector;
  assert.strictEqual(ind.name, 'implicit-need-detector', `实例 name=${ind.name}`);
});

console.log('\n[B 族] 修崩溃：personaCore.valueAligner / metaPosition 不再抛 TypeError');

t('B1 personaCore.valueAligner 从 TypeError 变为真实核查', () => {
  const r = hf.dispatch('personaCore.valueAligner', {
    plannedResponse: '根据2025哈佛大学研究，这个方法100%有效，保证你能立刻解决。',
  });
  assert.ok(r && typeof r === 'object' && !r.error, `返回异常: ${JSON.stringify(r)}`);
  assert.strictEqual(r.aligned, false, '攻击性回应不应判 aligned');
  assert.ok(r.score < 0.8, `score=${r.score}`);
  assert.ok(r.violationCount >= 3, `violationCount=${r.violationCount}`);
  assert.ok(r.violations.every(v => v.value && v.signal && v.severity && v.guidance), 'violation 缺字段');
  assert.strictEqual(r.source, 'plannedResponse');
});

t('B2 良性回应判 aligned 且 score=1（不制造假阳性）', () => {
  const r = hf.dispatch('personaCore.valueAligner', {
    plannedResponse: '在这个配置下通常会更快，具体提升取决于数据规模，建议先在小样本上验证。',
  });
  assert.strictEqual(r.aligned, true);
  assert.strictEqual(r.score, 1);
  assert.strictEqual(r.violationCount, 0);
});

t('B3 无文本可查时返回 aligned=null 并说明原因（不假装查过）', () => {
  const r = hf.dispatch('personaCore.valueAligner', {});
  assert.strictEqual(r.aligned, null);
  assert.strictEqual(r.score, null);
  assert.ok(/未提供可核查文本/.test(r.guidance));
});

t('B4 只给 userInput 时降级扫 userInput 并标记 source', () => {
  const r = hf.dispatch('personaCore.valueAligner', { userInput: '你太敏感了，这点事有什么大不了' });
  assert.strictEqual(r.source, 'userInput');
  assert.strictEqual(r.aligned, false);
  assert.ok(r.violations.some(v => v.value === 'respect'), '未检出 respect 违背');
});

t('B5 personaCore.metaPosition 从 TypeError 变为真实声明，维度数是现场实测', () => {
  const d = hf.dispatch('personaCore.metaPosition');
  assert.ok(d && typeof d === 'object' && !d.error, `返回异常: ${JSON.stringify(d)}`);
  assert.strictEqual(d.role, 'discriminator');
  assert.strictEqual(d.layer, 1);
  // 维度数由探针现场跑 discriminate() 数 dimensions 键得到，不是硬编码
  assert.strictEqual(d.measured.dimensions, 210, `实测维度数=${d.measured.dimensions}，期望 210`);
  assert.ok(d.measured.measuredAt, '缺 measuredAt');
  assert.ok(/210 条规则维度/.test(d.declaration), 'declaration 未含实测维度数');
  // Honest limitations 一条不许省
  for (const frag of ['不是 AGI', '纯模式匹配', '反讽', '8%', '启发式']) {
    assert.ok(d.doesNot.some(x => x.includes(frag)), `doesNot 缺「${frag}」`);
  }
  assert.strictEqual(Object.keys(d.gateActions).length, 4, 'gateActions 应为四档');
});

t('B6 personaCore.stanceDetector 不再恒为 {stance:neutral}', () => {
  const r = hf.dispatch('personaCore.stanceDetector', '我不同意这个方案，它站不住', {});
  assert.ok(r && typeof r === 'object' && !r.error, `返回异常: ${JSON.stringify(r)}`);
  assert.strictEqual(r.stance, 'oppose');
  assert.ok(r.confidence > 0.5, `confidence=${r.confidence}`);
  assert.ok(Array.isArray(r.signals) && r.signals.length > 0, '缺 signals');
});

console.log('\n[C 族] 新公开方法 translator.communicationBrief');

const BRIEF_CASES = [
  ['urgently need this fixed right now, please help ASAP!!!', 'urgency_lead_with_conclusion'],
  ['那个东西怎么用来来？比如举个例子说明一下，对吗', 'clarify'],
  ['今天天气不错', 'match_register'],
];

t('C1 三条输入的 topMove 各不相同（不是恒值模板）', () => {
  const tops = BRIEF_CASES.map(([input, expect]) => {
    const b = hf.dispatch('translator.communicationBrief', input, {});
    assert.strictEqual(b.ok, true, `ok=false: ${JSON.stringify(b)}`);
    assert.strictEqual(b.degraded, false, '不应降级');
    assert.ok(b.topMove, '缺 topMove');
    assert.strictEqual(b.topMove.id, expect, `${input} → topMove=${b.topMove.id}，期望 ${expect}`);
    // 动作按 priority 降序
    for (let i = 1; i < b.moves.length; i++) {
      assert.ok(b.moves[i - 1].priority >= b.moves[i].priority, 'moves 未按 priority 降序');
    }
    return b.topMove.id;
  });
  assert.strictEqual(new Set(tops).size, 3, '三条 topMove 有重复');
});

t('C2 多隐性需求句：moves 覆盖追问/示例/步骤三类且 multi_need 旗标升起', () => {
  const b = hf.dispatch('translator.communicationBrief', BRIEF_CASES[1][0], {});
  const ids = b.moves.map(m => m.id);
  for (const id of ['clarify', 'need_example', 'need_step_by_step']) {
    assert.ok(ids.includes(id), `moves 缺 ${id}: ${ids.join(',')}`);
  }
  assert.ok(b.riskFlags.some(f => f.flag === 'multi_need'), '缺 multi_need 旗标');
  assert.ok(b.questions.length >= 1, '缺建议追问');
});

t('C3 高紧迫句给 urgency_pacing / register 两条可执行建议', () => {
  const b = hf.dispatch('translator.communicationBrief', BRIEF_CASES[0][0], {});
  const ids = b.moves.map(m => m.id);
  assert.ok(ids.includes('urgency_lead_with_conclusion'), ids.join(','));
  assert.ok(ids.includes('match_register'), ids.join(','));
  assert.strictEqual(b.strategy.urgency, 'high');
  assert.ok(b.strategy.registerAdvice, '缺 registerAdvice');
});

t('C4 每条 move 都带 reason（可审计），且 summary 非空', () => {
  const b = hf.dispatch('translator.communicationBrief', BRIEF_CASES[1][0], {});
  for (const m of b.moves) {
    assert.ok(typeof m.reason === 'string' && m.reason.length > 0, `move ${m.id} 缺 reason`);
    assert.ok(typeof m.action === 'string' && m.action.length > 0, `move ${m.id} 缺 action`);
  }
  assert.ok(b.summary && b.summary.length > 0, '缺 summary');
  assert.ok(b.checkedBy.includes('communication-brief@1.0.0'), 'checkedBy 缺本模块');
});

t('C5 空输入诚实失败，不编简报', () => {
  const b = hf.dispatch('translator.communicationBrief', '', {});
  assert.strictEqual(b.ok, false);
  assert.ok(/为空或不是字符串/.test(b.error));
  const b2 = hf.dispatch('translator.communicationBrief', null, {});
  assert.strictEqual(b2.ok, false);
});

t('C6 上游缺席时降级并标 degraded（不编造语气结论）', () => {
  const { CommunicationBrief } = require(path.join(HF, 'src/bridge/communication-brief.js'));
  const bare = new CommunicationBrief({});
  const b = bare.build('urgently need this fixed right now', {});
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.degraded, true, '上游缺席必须标 degraded');
  assert.strictEqual(b.confidence, 0, '降级时 confidence 应为 0');
  assert.strictEqual(b.tone, null, '降级时不应有 tone');
});

t('C7 路由已注册进 ALLOWED_ROUTES 与 routes() 表', () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  assert.ok(HeartFlow.ALLOWED_ROUTES.has('translator.communicationBrief'), 'ALLOWED_ROUTES 缺新路由');
  assert.ok(hf.routes().translator.includes('translator.communicationBrief'), 'routes() 表缺新路由');
});

console.log('\n[D 族] MCP 三处接线（AGENTS.md 约定 3）+ bridge_analyze 复活');

t('D1 工具定义在 src/mcp/tools-registry.js', () => {
  const reg = fs.readFileSync(path.join(HF, 'src/mcp/tools-registry.js'), 'utf8');
  assert.ok(/name:\s*'heartflow_communication_brief'/.test(reg), 'tools-registry 缺工具定义');
  assert.ok(/heartflow_communication_brief[\s\S]{0,400}?inputSchema/.test(reg), '缺 inputSchema');
});

t('D2 handler 映射 + handler 函数都在 src/mcp-server.js', () => {
  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/heartflow_communication_brief:\s*handleCommunicationBrief/.test(srv), '缺 handler 映射');
  assert.ok(/function handleCommunicationBrief\s*\(/.test(srv), '缺 handler 函数');
});

t('D3 handleBridgeAnalyze 已 require StanceDetector / ConflictResolver（修 ReferenceError）', () => {
  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  const m = srv.match(/function handleBridgeAnalyze\([\s\S]*?\n\}/);
  assert.ok(m, '未找到 handleBridgeAnalyze');
  assert.ok(/require\('\.\/bridge\/stance-detector\.js'\)/.test(m[0]), '未 require stance-detector');
  assert.ok(/require\('\.\/bridge\/conflict-resolver\.js'\)/.test(m[0]), '未 require conflict-resolver');
  // 三个新文件都在
  for (const f of ['stance-detector.js', 'conflict-resolver.js', 'value-aligner.js', 'meta-position.js', 'communication-brief.js']) {
    assert.ok(fs.existsSync(path.join(HF, 'src/bridge', f)), `缺 src/bridge/${f}`);
  }
});

t('D4 新工具端到端跑通（子进程隔离，见下方说明）', () => {
  // [r249] 为什么必须子进程：src/mcp-server.js 在模块顶层注册
  //   process.on('SIGTERM', shutdown) → shutdown() 里 process.exit(0)
  // （src/mcp-server.js:5988-5998）。run-all.js 的子进程超时（CHILD_TIMEOUT=90s）
  // 用 SIGTERM 杀进程，被这个 handler 接住后**以退出码 0 正常退出**，
  // 而 process.exit 不 flush 管道上的异步 stdout —— 于是本测试的汇总行
  // 整段丢失，run-all 判「未输出汇总行」计 1 个失败（本轮首跑实测：
  // 输出停在 [D 族] 标题、exit code 0）。并发 4 份裸跑复现不出来，
  // 只有挂上 90s 超时才会触发。故 MCP 端到端断言放独立子进程里跑，
  // 父进程绝不 require mcp-server.js。
  // [r249] 两个必须子进程 + 必须置 HF_KEEP_STDOUT_LOGS 的坑（本轮实测踩到）：
  //   坑① src/utils/stdio-guard.js 在 mcp-server.js 加载时把
  //     process.stdout.write 改道 stderr（除非 chunk 长得像 JSON-RPC 帧）。
  //     于是**任何在进程内 require mcp-server.js 的测试，其后所有 console.log
  //     （含汇总行）都流到 stderr**，而 run-all.js 只解析 res.stdout →
  //     判「未输出汇总行」计 1 个失败。本轮首跑实测：run-all 里输出停在
  //     [D 族] 标题、exit code 0、汇总行消失；单独跑却 37/37 全绿。
  //   坑② mcp-server.js 还注册了 process.on('SIGTERM', shutdown)→process.exit(0)，
  //     run-all 的 CHILD_TIMEOUT(90s) 用 SIGTERM 杀进程时会被它接成正常退出。
  //   两坑都只影响「父进程 require mcp-server.js」的测试，故端到端断言放子进程。
  const { execFileSync } = require('child_process');
  const os = require('os');
  const serverPath = path.join(HF, 'src/mcp-server.js').replace(/\\/g, '/');
  const input = BRIEF_CASES[1][0];
  // 子进程脚本落到系统临时目录，不进仓库（也不进 git status）
  const childFile = path.join(os.tmpdir(), 'hf-round-249-mcp-child.js');
  const script = [
    // 坑①的解法：显式关掉 stdio 守卫，让 console.log 留在 stdout
    "process.env.HF_KEEP_STDOUT_LOGS = '1';",
    "if (!process.env.HEARTFLOW_MCP_TOKEN) process.env.HEARTFLOW_MCP_TOKEN = 'round-249-child-token';",
    `const srv = require(${JSON.stringify(serverPath)});`,
    'srv.initHeartFlow();',
    '(async () => {',
    '  const call = (name, args) => srv.handleRequest({jsonrpc:"2.0",id:1,method:"tools/call",params:{name,arguments:args}});',
    `  const r = await call('heartflow_communication_brief', { input: ${JSON.stringify(input)} });`,
    '  const body = JSON.parse(r.content[0].text);',
    "  if (body.error) throw new Error('工具报错: ' + body.error);",
    "  if (!body.topMove || body.topMove.id !== 'clarify') throw new Error('topMove=' + JSON.stringify(body.topMove));",
    '  if (body.moves.length < 3) throw new Error("moves=" + body.moves.length);',
    "  if (!Array.isArray(body.riskFlags)) throw new Error('riskFlags 不是数组');",
    "  const list = await srv.handleRequest({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});",
    '  const names = (list.tools || []).map(x => x.name);',
    "  if (!names.includes('heartflow_communication_brief')) throw new Error('tools/list 缺新工具');",
    '  console.log("CHILD-OK topMove=" + body.topMove.id + " moves=" + body.moves.length + " tools=" + names.length);',
    '})().catch(e => { console.error("CHILD-FAIL " + e.message); process.exit(3); });',
  ].join('\n');
  fs.writeFileSync(childFile, script, 'utf8');
  let stdout = '';
  try {
    stdout = execFileSync('node', [childFile], {
      cwd: HF, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    throw new Error(`子进程失败: ${e.message}\n${(e.stdout || '').toString().slice(-500)}${(e.stderr || '').toString().slice(-500)}`);
  } finally {
    try { fs.unlinkSync(childFile); } catch (_) { /* 临时文件清理失败不影响判定 */ }
  }
  assert.ok(/CHILD-OK/.test(stdout), `子进程未报 CHILD-OK: ${stdout.slice(-300)}`);
});

console.log('\n[E 族] 回归：存量路由与入口行为没被破坏');

t('E1 checkOutput / checkInput / gate 三个招牌入口仍可用', () => {
  const hfm = require(path.join(HF, 'src/gate.js'));
  const o = hfm.checkOutput('毫无疑问这是唯一正确的方案。');
  assert.ok(o.gate && o.gate.action, 'checkOutput 无 gate.action');
  assert.strictEqual(o.gate.action, 'rewrite');
  const i = hfm.checkInput('请问今天天气怎么样？');
  assert.ok(i.gate && i.gate.action === 'pass', `checkInput action=${i.gate && i.gate.action}`);
  const g = hfm.gate('你是垃圾，滚出去');
  assert.strictEqual(g.gate.action, 'block');
});

t('E2 维度数仍是 210（本轮未加判别维度）', () => {
  // discriminate 不在 ALLOWED_ROUTES 里（它是 gate.js 的低层导出），直接调
  const d = require(path.join(HF, 'src/gate.js')).discriminate('测试句');
  assert.strictEqual(Object.keys(d.dimensions).length, 210);
});

t('E3 translator 其余七条存量路由一条不塌', () => {
  const routes = ['userToLLM', 'llmToUser', 'intentClassifier', 'entityExtractor', 'responseCompressor', 'confidenceAnnotator'];
  for (const r of routes) {
    const out = hf.dispatch('translator.' + r, '那个东西怎么用来着？比如举个例子', {});
    assert.ok(out !== undefined, `translator.${r} 返回 undefined`);
  }
});

t('E4 personaCore 其余六条存量路由一条不塌（不再抛 TypeError）', () => {
  const calls = {
    bridgeIdentity: () => hf.dispatch('personaCore.bridgeIdentity'),
    judgmentInjector: () => hf.dispatch('personaCore.judgmentInjector', {}, 'x'),
    stanceDetector: () => hf.dispatch('personaCore.stanceDetector', '今天天气不错', {}),
    agentCommentary: () => hf.dispatch('personaCore.agentCommentary', {}, {}, {}),
    personalityTone: () => hf.dispatch('personaCore.personalityTone', '文本', {}),
  };
  for (const [name, fn] of Object.entries(calls)) {
    let out;
    assert.doesNotThrow(fn, `personaCore.${name} 抛异常`);
    out = fn();
    assert.ok(out !== undefined, `personaCore.${name} 返回 undefined`);
  }
});

t('E5 agentLayer 冲突消解路由不再恒 {}', () => {
  const r = hf.dispatch('agentLayer.conflictResolver', '这个方案一定可以，但也不一定能成。', {});
  assert.ok(r && typeof r === 'object', `返回 ${JSON.stringify(r)}`);
  assert.ok(Array.isArray(r.conflicts), '缺 conflicts 数组');
  assert.ok(r.conflicts.length >= 1, '自相矛盾句未检出冲突');
  assert.ok(r.conflicts.every(c => c.kind && c.label && c.guidance), 'conflict 缺字段');
});

t('E6 引擎 _initErrors 为空（本轮没有静默失败的初始化）', () => {
  assert.deepStrictEqual(hf._initErrors, [], JSON.stringify(hf._initErrors));
});

t('E7 良性冲突句零误报（不把正常表述判成矛盾）', () => {
  const { ConflictResolver } = require(path.join(HF, 'src/bridge/conflict-resolver.js'));
  const cr = new ConflictResolver();
  const benign = [
    '我们先在小样本上验证一下，再决定是否推广。',
    '这个方案在多数场景下有效，少数场景需要额外处理。',
    '建议分两步走：先迁移读流量，再迁移写流量。',
  ];
  for (const s of benign) {
    const r = cr.resolve(s);
    assert.strictEqual(r.conflicts.length, 0, `误报: ${s} → ${JSON.stringify(r.conflicts)}`);
  }
});

t('E8 StanceDetector 对无信号输入判 neutral 而非乱猜', () => {
  const { StanceDetector } = require(path.join(HF, 'src/bridge/stance-detector.js'));
  const sd = new StanceDetector();
  for (const s of ['今天天气不错', '把文件放到 /tmp 下面', '3 加 5 等于 8']) {
    const r = sd.detect(s);
    assert.strictEqual(r.stance, 'neutral', `${s} → ${r.stance}`);
    assert.strictEqual(r.confidence, 0);
  }
});

console.log('\n[F 族] 源码锚点：stub 已换成真加载');

t('F1 两个 stub 都改成 try{require 真模块}catch{stub} 形态', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  for (const key of ['toneAnalyzer', 'implicitNeedDetector', 'valueAligner', 'metaPosition', 'stanceDetector', 'conflictResolver', 'communicationBrief']) {
    const re = new RegExp(`_lazy\\('${key}'.{0,400}?require\\('\\.\\./bridge/`);
    assert.ok(re.test(src), `_lazy('${key}') 未接真实 bridge 模块`);
  }
});

t('F2 personaCore 调用点方法名与实现一致（check / getDeclaration / detect）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  assert.ok(/valueAligner:\s*\(ctx\)\s*=>\s*va\.check\(ctx\)/.test(src), 'va.check 调用点消失');
  assert.ok(/metaPosition:\s*\(\)\s*=>\s*mp\.getDeclaration\(\)/.test(src), 'mp.getDeclaration 调用点消失');
  const va = require(path.join(HF, 'src/bridge/value-aligner.js')).ValueAligner;
  assert.strictEqual(typeof new va().check, 'function', 'ValueAligner 无 check()');
  const mp = require(path.join(HF, 'src/bridge/meta-position.js')).MetaPosition;
  assert.strictEqual(typeof new mp().getDeclaration, 'function', 'MetaPosition 无 getDeclaration()');
});

t('F3 MetaPosition 的维度数是探针实测，不是硬编码字面量', () => {
  const src = fs.readFileSync(path.join(HF, 'src/bridge/meta-position.js'), 'utf8');
  assert.ok(/probeDimensions/.test(src), '缺 probeDimensions 注入点');
  assert.ok(!/dimensions:\s*210/.test(src), 'meta-position.js 里出现了硬编码 210');
  assert.ok(!/210/.test(src), 'meta-position.js 里出现字面量 210');
});

t('F4 communicationBrief 走 translator 子系统（_modules 注册 + 常驻实例）', () => {
  assert.ok(hf._modules.translator, 'translator 未进 _modules');
  assert.strictEqual(typeof hf._modules.translator.communicationBrief, 'function', 'translator.communicationBrief 不是函数');
  // handler 用 dispatch 而非内部 new：MCP 侧经 safeDispatch 调到的就是这一个实例
  assert.strictEqual(hf._modules.translator.communicationBrief, hf.translator.communicationBrief);
});

console.log('\n[G 族] 已知未修登记（本轮刻意不做，含理由）');

t('G1 登记：agentLayer/personaCore 其余 stub（r250 已修，此处改为回归断言）', () => {
  // r249 轮初这里断言九个 bridge stub 仍是常量（'' / {} / {} / []）。
  // **r250 已把这九个全部接上真实实现**（src/bridge/ 下新建九个模块），
  // 故本断言反转为回归防线：这九条路由现在必须给出真实输出，
  // 且不能抛异常、不能退回恒值（防止将来有人把真实现改回 stub）。
  const missing = ['personality-tone.js', 'judgment-injector.js', 'bridge-identity.js', 'entity-extractor.js', 'response-compressor.js', 'translation-pipeline.js', 'quality-filter.js', 'followup-suggester.js', 'uncertainty-handler.js'];
  const absent = missing.filter(f => !fs.existsSync(path.join(HF, 'src/bridge', f)));
  assert.strictEqual(absent.length, 0, `以下文件仍不存在: ${absent.join(',')}`);

  const pt = hf.dispatch('personaCore.personalityTone', '你必须赶紧搞定，毫无疑问百分百对。', { persona: 'warm' });
  assert.ok(pt && typeof pt === 'object' && typeof pt.text === 'string' && pt.text.length > 0, 'personalityTone 应返回 {text,...} 而非空串');
  assert.ok(pt.text !== '你必须赶紧搞定，毫无疑问百分百对。', 'personalityTone 未做任何语气修订');
  const ji = hf.dispatch('personaCore.judgmentInjector', { gate: { action: 'block' }, findings: [] });
  assert.ok(ji && typeof ji === 'object' && Array.isArray(ji.internalNotes) && ji.internalNotes.length > 0, 'judgmentInjector 应给出 internalNotes 而非 {}');
  const bi = hf.dispatch('personaCore.bridgeIdentity');
  assert.ok(bi && typeof bi === 'object' && bi.type === 'heartflow-bridge', 'bridgeIdentity 应给出 type 而非 {}');
  assert.ok(Array.isArray(bi.doesNot) && bi.doesNot.length === 5, 'bridgeIdentity 的 doesNot 应是 5 条');
  for (const r of ['translator.entityExtractor', 'translator.responseCompressor', 'agentLayer.qualityFilter', 'agentLayer.followupSuggester', 'agentLayer.uncertaintyHandler']) {
    let out;
    assert.doesNotThrow(() => { out = hf.dispatch(r, '测试输入', {}); }, `${r} 抛异常`);
    assert.ok(out !== undefined && out !== null, `${r} 返回 ${JSON.stringify(out)}`);
  }
});

t('G2 登记：heartflow_translate 的 tone 字段形状变了（stub {tone,confidence} → 真四维）', () => {
  // 这是本轮的**有意行为变化**：任何按 tone.tone 读值的调用方会拿到 undefined。
  // 全仓 grep 实测无测试/源码读 translator tone 的 .tone 字段，故不构成回归；
  // 但外部调用方可能依赖，登记给下一轮做兼容层（tone.tone = tone.emotion 别名）。
  const tone = hf.dispatch('translator.toneAnalyzer', 'Thanks a lot, you are amazing!!', {});
  assert.ok(tone.emotion, '真实现应有 emotion 字段');
  assert.strictEqual(tone.tone, undefined, '真实现不产出 stub 的 tone 字段——这正是形状变化点');
});

// ─── 汇总 ───
(async () => {
  await Promise.all(asyncTests);
  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`round-249 bridge 交流层复活: ${passed} 通过, ${failed} 失败, 共 ${results.length} 个`);
  if (failed > 0) {
    console.log('失败项:');
    for (const r of results.filter(x => !x.ok)) console.log(`  - ${r.name}: ${r.err}`);
    process.exit(1);
  }
})();
