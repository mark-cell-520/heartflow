/**
 * round-251-stub-accountability.test.js
 *
 * r251 轮测试：模块健康自检对占位子系统失明 + 三个被静默吞掉的 TypeError 调用点
 *
 * 轮初实测（scripts/tmp-251-probe.js，轮末已删）：
 *   A. src/core/heartflow.js 的 _stubFactory 产出 31 个「无条件占位」子系统
 *      （另 17 个是 try-require fallback，有真实文件）。其中 26 个实例挂在引擎
 *      顶层属性上、从不进 _modules，ModuleHealthChecker.check() 只遍历
 *      _modules → 结构性看不见它们。
 *   B. checkModule() 只查 destroy/getStats 接口存在性，而 stub 两个方法都有
 *      → 即使进了 _modules 的 8 个也判 healthy。
 *   C. checkModule() 从不调用模块自报的 healthCheck()，stub 喊的
 *      {ok:false, stub:true} 没人听。
 *   D. 三个有真实调用方的占位子系统调不存在的方法，每次抛 TypeError 被
 *      `catch(e) { /* 非关键 *\/ }` 吞掉 → 静默失效：
 *        taskUrgencyEstimator.estimate()  engine-reasoner.js:278
 *        learningPulse.beat()             engine-reasoner.js:1106 / think-pipeline.js:163
 *        learningOrchestrator.status()    self-diagnosis.js:67 / what-learned.js:113
 *
 * 本轮落地：moduleHealth 诚实记账（healthScore 100→84、31 个 stub 可见）+ 三个
 * 子系统接真实实现 + 新 MCP 工具 heartflow_module_stubs（约定 3 三处接线）。
 *
 * 运行：node test/round-251-stub-accountability.test.js
 */

'use strict';

// [r249 坑①] src/mcp-server.js 加载时会把 process.stdout.write 改道 stderr
// （src/utils/stdio-guard.js），进程内 require 它会让后面的 console.log（含汇总行）
// 全流到 stderr，run-all.js 只解析 res.stdout → 判「未输出汇总行」计 1 个失败。
// 故 E 族的 MCP 端到端断言放独立子进程里跑。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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
    results.push({ name, ok: true }); console.log(`  ✅ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message }); console.log(`  ❌ ${name}\n     ${e.message}`);
  }
}

let hf = null;
let engineError = null;
try {
  const { createHeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  hf = createHeartFlow();
  hf.start();
} catch (e) { engineError = e.message; }

// ─── A 族：31 个已声明占位子系统从「不可见」变「如实列名」 ───
console.log('\n[A 族] 占位子系统诚实记账');

t('A1 getStubModules：31 个已声明子系统全部有交代，无一漏报', () => {
  assert.ok(hf, '引擎未启动: ' + engineError);
  const s = hf.moduleHealth.getStubModules();
  assert.strictEqual(s.declared, 31, `已声明应为 31，实际 ${s.declared}`);
  assert.strictEqual(s.stubCount + s.overriddenCount + s.uninstantiatedCount, 31,
    '三态必须覆盖全部 31 个（stub+overridden+uninstantiated）');
  for (const x of s.stubs) {
    assert.ok(x.name && x.resolvedFrom && x.via && x.reason, `stub 条目字段不全: ${JSON.stringify(x)}`);
  }
});

t('A2 本轮复活的三个子系统从 stub 移到 overridden（有真实实现了）', () => {
  const s = hf.moduleHealth.getStubModules();
  const names = s.overridden.map(o => o.name).sort();
  assert.deepStrictEqual(names, ['learningOrchestrator', 'learningPulse', 'taskUrgency'],
    'overridden 应恰为这三个');
  assert.ok(!s.stubs.some(x => ['learningOrchestrator', 'learningPulse', 'taskUrgency'].includes(x.name)),
    '三个已复活子系统不应再出现在 stub 清单里');
});

t('A3 stub 清单带检测途径：marker / class_marker / self_report 三选一', () => {
  const s = hf.moduleHealth.getStubModules();
  const vias = new Set(s.stubs.map(x => x.via));
  for (const v of vias) {
    assert.ok(['marker', 'class_marker', 'self_report'].includes(v), `未知检测途径 ${v}`);
  }
  // worldLandscape / processRewardModel 有文件但自报无实现，应走 self_report
  const wl = s.stubs.find(x => x.name === 'worldLandscape');
  assert.ok(wl && wl.via === 'self_report', 'worldLandscape 应经 self_report 识别');
});

t('A4 check() 报 stub 档位：healthScore 从假的 100 降为真实值', () => {
  const r = hf.moduleHealth.check();
  assert.strictEqual(r.totalModules, 162, 'totalModules 应保持 162（原有口径不变）');
  assert.ok(r.stubCount >= 8, `_modules 内应有 ≥8 个 stub 被判出来，实际 ${r.stubCount}`);
  assert.ok(r.healthy < 162, 'healthy 应小于 162——stub 不再冒充 healthy');
  const sum = hf.moduleHealth.getSummary();
  assert.ok(sum.healthScore < 100, `healthScore 应 <100，实际 ${sum.healthScore}`);
  assert.ok(sum.declaredStubSubsystems === 31, 'summary 应带 31 个已声明占位子系统');
  assert.ok(typeof sum.implementedRatio === 'number', 'summary 应带真实实现占比');
  assert.ok(/healthScore/.test(sum.honestNote || ''), 'honestNote 应说明 healthScore 的覆盖范围');
});

t('A5 getProblematicModules() 现在能列出占位模块（此前恒 []）', () => {
  const r = hf.moduleHealth.check();
  const prob = hf.moduleHealth.getProblematicModules();
  assert.ok(prob.length > 0, '此前恒为 []，现在应能列出占位模块');
  assert.ok(prob.some(p => p.health === 'stub'), '应有 health==="stub" 的条目');
  const names = new Set(prob.map(p => p.name));
  assert.ok(names.has('sufferingResilience'), '进过 _modules 的占位（sufferingResilience）应被识别');
});

t('A6 stub 不触发 __disabled —— 诚实记账不能把运行路径禁掉', () => {
  const r = hf.moduleHealth.check();
  const stubsInModules = r.details.filter(d => d.health === 'stub');
  assert.ok(stubsInModules.length > 0, '应有 stub 条目');
  for (const d of stubsInModules) {
    const mod = hf._modules[d.name];
    assert.ok(!(mod && mod.__disabled), `${d.name} 被误置 __disabled——占位不该被禁用`);
  }
  assert.strictEqual(hf.moduleHealth.getDisabled().length, 0, 'disabledModules 应为空');
});

// ─── B 族：三个子系统从 TypeError 变真实工作 ───
console.log('\n[B 族] 三个调用点的 TypeError 修复');

t('B1 taskUrgencyEstimator.estimate：从抛 TypeError 到分级输出', () => {
  const tu = hf.taskUrgencyEstimator;
  assert.strictEqual(typeof tu.estimate, 'function', 'estimate 方法应存在');
  const r = tu.estimate('紧急！线上系统挂了，赶紧修复', { previousUrgency: null });
  assert.ok(typeof r.urgency === 'number' && r.urgency >= 0 && r.urgency <= 1, 'urgency 应在 0~1');
  assert.strictEqual(r.level, 'critical', `紧急句应判 critical，实际 ${r.level}`);
  assert.ok(Array.isArray(r.signals) && r.signals.length > 0, 'signals 应可审计');
  for (const s of r.signals) assert.ok(typeof s.tag === 'string' && typeof s.weight === 'number', 'signal 字段不全');
});

t('B2 taskUrgencyEstimator：良性句零误报（不被判成高紧迫）', () => {
  const tu = hf.taskUrgencyEstimator;
  for (const s of ['今天天气不错', 'hello', '随便了解一下', '帮我看下这个文档，不急，慢慢来']) {
    const r = tu.estimate(s, { previousUrgency: null });
    assert.ok(['minimal', 'low'].includes(r.level), `"${s}" 应判 minimal/low，实际 ${r.level}`);
    assert.strictEqual(r.inferred, 'baseline_only', `"${s}" 无信号应标 baseline_only`);
  }
});

t('B3 taskUrgencyEstimator：惯性平滑 + 强反向信号不被抹平', () => {
  const tu = hf.taskUrgencyEstimator;
  const a = tu.estimate('紧急！！', { previousUrgency: null });
  const b = tu.estimate('嗯', { previousUrgency: a.urgency });
  assert.strictEqual(b.smoothed, true, '有历史值应平滑');
  assert.ok(b.urgency < a.urgency && b.urgency > 0, `平滑应介于 0 与上次之间：${a.urgency}→${b.urgency}`);
  const c = tu.estimate('不急，慢慢来', { previousUrgency: 0.95 });
  assert.strictEqual(c.smoothed, false, '强反向信号不应被惯性抹平');
  assert.ok(c.urgency < 0.3, `反向信号应把紧迫度压下来，实际 ${c.urgency}`);
});

t('B4 learningPulse.beat：从抛 TypeError 到记账 + 有据可依的调度建议', () => {
  const p = hf.learningPulse;
  assert.strictEqual(typeof p.beat, 'function', 'beat 方法应存在');
  p.beat({ type: 'qa', confidence: 0.4, output: 'x', thoughtChain: [1, 2] });
  const r = p.beat({ type: 'qa', confidence: 0.3, output: '', thoughtChain: [1] });
  assert.strictEqual(r.recorded, true, '应登记这一拍');
  const sug = p.suggest();
  assert.ok(sug && sug.target === 'qa', '低置信度聚集应指向 qa');
  assert.ok(/低置信度占比/.test(sug.reason), '建议理由应可审计');
  assert.strictEqual(sug.priority, 'high', '100% 低置信度应判 high');
});

t('B5 learningPulse：拍子不够时不硬编建议', () => {
  const { LearningPulse } = require(path.join(HF, 'src/cortex/learning-pulse.js'));
  const p = new LearningPulse();
  assert.strictEqual(p.suggest(), null, '零拍子应返回 null 而不是编一个');
  p.beat({ type: 'x', confidence: 0.9, output: 'ok' });
  assert.strictEqual(p.suggest(), null, '单拍数据不足仍应返回 null');
});

t('B6 learningOrchestrator.status：从抛 TypeError 到三段循环真实计数', () => {
  const lo = hf.learningOrchestrator;
  assert.strictEqual(typeof lo.status, 'function', 'status 方法应存在');
  const st = lo.status();
  assert.ok(st.learningLoop && typeof st.learningLoop === 'object', 'learningLoop 应存在');
  for (const k of ['detect', 'explore', 'absorb']) {
    assert.ok(k in st.learningLoop, `learningLoop.${k} 应存在（what-learned.js:117 读它）`);
  }
  assert.ok(st.linkage && typeof st.linkage.learnerToExplorer === 'boolean', 'linkage.learnerToExplorer 应为布尔');
  assert.ok(st.healthScore === null || (st.healthScore >= 0 && st.healthScore <= 1), 'healthScore 应为 null 或 0~1');
  assert.strictEqual(st.implemented, true, '应标注 implemented');
});

t('B7 learningOrchestrator：子系统缺失时字段为 null 而不是编数', () => {
  const { LearningOrchestrator } = require(path.join(HF, 'src/cortex/learning-orchestrator.js'));
  const st = new LearningOrchestrator(null).status();
  assert.strictEqual(st.learningLoop.detect, null, '未绑引擎时 detect 应为 null');
  assert.strictEqual(st.healthScore, null, '未绑引擎时 healthScore 应为 null');
  assert.ok(/no_engine_bound/.test(st.note || ''), '应如实标注未绑定引擎');
});

t('B8 三个模块的 healthCheck 都自报 implemented:true（不再冒充健康）', () => {
  for (const [k, mod] of [['taskUrgencyEstimator', hf.taskUrgencyEstimator], ['learningPulse', hf.learningPulse], ['learningOrchestrator', hf.learningOrchestrator]]) {
    const h = mod.healthCheck();
    assert.strictEqual(h.ok, true, `${k}.healthCheck().ok 应为 true`);
    assert.strictEqual(h.implemented, true, `${k} 应自报 implemented`);
  }
});

// ─── C 族：真实调用链路端到端不再静默失效 ───
console.log('\n[C 族] 真实调用链路端到端');

t('C1 engine-reasoner 的紧迫性估计路径：hf._urgencyEstimate 不再恒 undefined', () => {
  assert.ok(hf, '引擎未启动: ' + engineError);
  // 直接走调用点同款调用序列
  const prev = hf._lastUrgency || null;
  hf._urgencyEstimate = hf.taskUrgencyEstimator.estimate('紧急！数据库挂了', { previousUrgency: prev });
  hf._lastUrgency = hf._urgencyEstimate.urgency;
  assert.ok(hf._urgencyEstimate && typeof hf._urgencyEstimate.urgency === 'number', '_urgencyEstimate 应被真实赋值');
  assert.ok(typeof hf._lastUrgency === 'number', '_lastUrgency 应被真实赋值');
});

t('C2 what-learned 的 status() 契约字段全部可读（此前整段报告恒不出现）', () => {
  const status = hf.learningOrchestrator.status();
  const loop = status.learningLoop;
  const linkage = status.linkage;
  // what-learned.js:117-124 的读法逐个复现
  assert.doesNotThrow(() => {
    if (status.healthScore !== null) { (status.healthScore * 100).toFixed(0); }
    `检测${loop.detect}次 → 探索${loop.explore}次 → 吸收${loop.absorb}次`;
    if (linkage.learnerToExplorer) { /* 已联通 */ }
  }, 'what-learned.js 的读法应全部可用');
});

t('C3 self-diagnosis 的 getStats()/status() 读法不抛', () => {
  assert.doesNotThrow(() => {
    const a = hf.learningPulse.getStats();
    assert.ok(typeof a.beatCount === 'number', 'pulseStats.beatCount 应为数字');
    const b = hf.learningOrchestrator.status();
    assert.ok(b.learningLoop, 'orchestratorStatus.learningLoop 应存在');
  });
});

// ─── D 族：回归防线 ───
console.log('\n[D 族] 回归防线');

t('D1 三招牌入口不回归', () => {
  const { checkInput, checkOutput, checkDraft } = require(path.join(HF, 'src/gate.js'));
  for (const [name, fn] of [['checkInput', checkInput], ['checkOutput', checkOutput], ['checkDraft', checkDraft]]) {
    assert.strictEqual(typeof fn, 'function', `${name} 应为函数`);
    const r = fn('You are so selfish if you disagree');
    assert.ok(r && r.gate && typeof r.gate.action === 'string', `${name} 应返回 gate.action`);
  }
});

t('D2 判别维度仍 210，判别引擎未被动过', () => {
  const d = require(path.join(HF, 'src/gate.js')).discriminate('测试句');
  assert.strictEqual(Object.keys(d.dimensions).length, 210, 'dimensions 键应仍为 210');
});

t('D3 _stubFactory 的 __heartflowStub 标记不可伪装且不破坏 fallback 语义', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  assert.ok(/__heartflowStub = true/.test(src), '应打实例级标记');
  assert.ok(/__heartflowStubClass = true/.test(src), '应打类级标记');
  assert.ok(/_STUB_SUBSYSTEM_KEYS/.test(src), '应导出占位子系统清单');
  assert.ok(/require\('\.\.\/cortex\/task-urgency-estimator\.js'\)/.test(src), 'taskUrgency 应真加载');
  assert.ok(/require\('\.\.\/cortex\/learning-pulse\.js'\)/.test(src), 'learningPulse 应真加载');
  assert.ok(/require\('\.\.\/cortex\/learning-orchestrator\.js'\)/.test(src), 'learningOrchestrator 应真加载');
});

t('D4 引擎启动零新增 _initErrors', () => {
  const errs = (hf._initErrors || []).filter(e => /urgency|learning|stub/i.test(e.module || ''));
  assert.strictEqual(errs.length, 0, '三个复活模块不应进 _initErrors: ' + JSON.stringify(errs));
});

t('D5 兄弟路由不受影响：bridge 九条路由仍给出真实输出', () => {
  const D = (route, ...args) => hf.dispatch(route, ...args);
  const ents = D('translator.entityExtractor', '请联系张三，电话 13812345678，邮箱 zhangsan@example.com');
  assert.ok(Array.isArray(ents) && ents.length >= 2, 'entityExtractor 应仍抽出实体');
  assert.ok(ents.some(e => e.sensitive), 'PII 应仍被标敏感');
  const id = D('personaCore.bridgeIdentity');
  assert.ok(id && id.type === 'heartflow-bridge', 'bridgeIdentity 应仍真实输出');
});

t('D6 MCP 三处接线齐全（约定 3）', () => {
  const reg = fs.readFileSync(path.join(HF, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/name: 'heartflow_module_stubs'/.test(reg), 'tools-registry 应含工具定义');
  assert.ok(/heartflow_module_stubs: handleModuleStubs/.test(srv), 'mcp-server 应有 handler 映射');
  assert.ok(/function handleModuleStubs/.test(srv), 'mcp-server 应有 handler 函数');
});

// ─── E 族：MCP 端到端（独立子进程，避开 stdio-guard 改道 stdout） ───
console.log('\n[E 族] MCP 端到端（子进程）');

t('E1 tools/list 含新工具 + 两个健康工具端到端可用', () => {
  // 直接 require 工具注册表验证（tools-registry.js 导出时已 concat extended-tools.js）
  const { TOOLS } = require(path.join(HF, 'src/mcp/tools-registry.js'));
  const names = TOOLS.map(t => t.name);
  assert.ok(names.includes('heartflow_module_stubs'), '工具定义应含 heartflow_module_stubs');
  assert.ok(names.includes('heartflow_module_health'), 'heartflow_module_health 不应丢');
  // [r255] 原断言写死 TOOLS.length === 187——工具数每加一个就假失败一次（r255 加了
  // wiring_check / active_inference 两个，实测 actual=189）。改为守卫本意：没被悄悄
  // 删掉 + 与注册表去重计数一致。
  assert.ok(TOOLS.length >= 187, `工具总数不应低于 r251 时的 187，实际 ${TOOLS.length}`);
  assert.strictEqual(TOOLS.length, new Set(names).size, `工具表不应有重名（去重 ${new Set(names).size} / 原 ${TOOLS.length}）`);
  const def = TOOLS.find(t => t.name === 'heartflow_module_stubs');
  assert.ok(def.description && def.inputSchema, '新工具应有 description 与 inputSchema');
  assert.ok(def.inputSchema.properties.includeOverridden, '应有 includeOverridden 参数');

  const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  assert.ok(/heartflow_module_stubs: handleModuleStubs/.test(srv), '应有 handler 映射');
  assert.ok(/function handleModuleStubs/.test(srv), '应有 handler 函数');
});

t('E2 handleModuleStubs 逻辑端到端（独立子进程，避开 stdio-guard 改道 stdout）', () => {
  const out = execFileSync(process.execPath, ['-e', `
const path = ${JSON.stringify(HF)};
const { createHeartFlow } = require(path + '/src/core/heartflow.js');
const hf = createHeartFlow(); hf.start();
// 复刻 mcp-server.js handleModuleStubs 的读法：优先读引擎常驻实例
const mh = hf.moduleHealth;
const stubs = mh.getStubModules();
const out = {
  declared: stubs.declared, stubCount: stubs.stubCount,
  overriddenCount: stubs.overriddenCount, uninstantiatedCount: stubs.uninstantiatedCount,
  implementedRatio: Math.round((stubs.overridden.length / stubs.declared) * 100)
};
console.log('RESULT:' + JSON.stringify(out));
`], { encoding: 'utf8', cwd: HF });
  const line = out.trim().split('\n').filter(l => l.startsWith('RESULT:')).pop();
  const r = JSON.parse(line.slice(7));
  assert.strictEqual(r.declared, 31, 'declared 应为 31');
  assert.strictEqual(r.stubCount, 28, `stubCount 应为 28，实际 ${r.stubCount}`);
  assert.strictEqual(r.overriddenCount, 3, 'overriddenCount 应为 3');
  assert.strictEqual(r.uninstantiatedCount, 0, 'uninstantiatedCount 应为 0');
  assert.strictEqual(r.implementedRatio, 10, `真实实现占比应为 10%，实际 ${r.implementedRatio}%`);
});

// ─── 汇总 ───
(async () => {
  if (asyncTests.length) await Promise.all(asyncTests);
  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`round-251 占位子系统诚实记账：${pass} 通过, ${fail} 失败（共 ${results.length}）`);
  if (fail > 0) {
    console.log('失败项：');
    for (const r of results.filter(x => !x.ok)) console.log(`  ❌ ${r.name}\n     ${r.err}`);
    process.exit(1);
  }
  process.exit(0);
})();
