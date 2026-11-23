// r459 轮次测试：sparse 门控缺陷修复验证
// 真升级③：接线「已加载但 dispatch 不到」的能力——心虫裁决门禁
//          philosophyToDecision.decide 长期恒返回 module_not_active
//
// 根因（两处叠加，均在本轮修复）：
//   ① philosophyToDecision / agentPhilosophy / agentPsychology 三个模块
//      根本不在 MODULE_TIERS 任何一层。dispatch 在 _sparseMode 下按
//      MODULE_TIERS 过滤激活集，于是 sparse 模式一旦开启，无论 effort
//      档位（low/high/max）这三个模块都永远不可达。
//   ② _sparseMode/_activeModules 是实例级粘滞状态：一次显式传 effort 的
//      think() 置位后，直到下一次不带 effort 的 think() 才清除。MCP 服务
//      是长驻进程，handleThinkFast（mcp-server.js:1092）固定传 effort:20
//      触发 low 模式置位后长期驻留，期间裁决门禁恒被跳过。
// 每项断言都直接打 think()/dispatch 真实路径，不用自检糊弄。
'use strict';

const { HeartFlow } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/core/heartflow.js');

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; failures.push(name + (detail ? ' -> ' + detail : '')); console.log(`  ✗ ${name}${detail ? ' -> ' + detail : ''}`); }
}

(async () => {
  const hf = new HeartFlow({ silent: true });
  await hf.start();

  // ═══ 1. 三个裁决相关模块确实已加载（修复前提：不是缺模块，是 dispatch 不到）═══
  console.log('\n[1] 模块已加载前提验证');
  check('philosophyToDecision 已加载', !!hf._modules.philosophyToDecision);
  check('agentPhilosophy 已加载', !!hf._modules.agentPhilosophy);
  check('agentPsychology 已加载', !!hf._modules.agentPsychology);

  // ═══ 2. 各 effort 档位下裁决门禁均可达（修复① + ② 联合验证）═══
  console.log('\n[2] 裁决门禁 effort 档位可达性（回归锚：module_not_active 不得复现）');
  const ctx = { task: '验证裁决门禁可达性', intent: '确认不再被稀疏化跳过' };
  const efforts = [20, 40, 50, 75, 100];
  for (const eff of efforts) {
    await hf.think('裁决前置推理', 1, { effort: eff });
    const d = hf.dispatch('philosophyToDecision.decide', {}, {}, ctx);
    check(`effort=${eff} 后裁决不被跳过`,
      d && d.skipped !== true && d.reason !== 'module_not_active',
      JSON.stringify(d).slice(0, 120));
    check(`effort=${eff} 后裁决返回 type 字段`, !!(d && d.type), JSON.stringify(d).slice(0, 120));
  }

  // ═══ 3. think() 不跨调用污染 sparse 状态（修复② 单独验证）═══
  console.log('\n[3] sparse 粘滞状态复位');
  await hf.think('污染测试', 1, { effort: 20 });
  check('带 effort 的 think() 返回后 _sparseMode 复位为 false', hf._sparseMode === false,
    `实际 _sparseMode=${hf._sparseMode}`);
  check('_activeModules 复位为 null', hf._activeModules === null,
    `实际 _activeModules=${hf._activeModules}`);
  // 连续两次带 effort（模拟 MCP 长驻进程反复调用 handleThinkFast）
  await hf.think('第一次', 1, { effort: 20 });
  await hf.think('第二次', 1, { effort: 50 });
  const d = hf.dispatch('philosophyToDecision.decide', {}, {}, ctx);
  check('连续 effort 调用后裁决仍可达', d && d.skipped !== true && !!d.type,
    JSON.stringify(d).slice(0, 120));

  // ═══ 4. 无 effort 路径不受影响（不得把门控永久焊死）═══
  console.log('\n[4] 无 effort 路径回归');
  const r = await hf.think('普通推理', 1, {});
  check('无 effort think() 正常返回', r && typeof r === 'object', typeof r);
  const d2 = hf.dispatch('philosophyToDecision.decide', {}, {}, ctx);
  check('无 effort 后裁决可达', d2 && d2.skipped !== true && !!d2.type,
    JSON.stringify(d2).slice(0, 120));

  // ═══ 5. effort 语义仍生效（不得为修门禁而废掉 effort 特性）═══
  console.log('\n[5] effort 语义保留');
  const r20 = await hf.think('低档', 1, { effort: 20 });
  check('effort=20 时 _reasoningEffort 记录为 20', r20._reasoningEffort === 20,
    `实际=${r20._reasoningEffort}`);
  check('effort=20 时 _reasoningEffortMode 为 low', r20._reasoningEffortMode === 'low',
    `实际=${r20._reasoningEffortMode}`);
  const r90 = await hf.think('高档', 1, { effort: 90 });
  check('effort=90 时 _reasoningEffortMode 为 max', r90._reasoningEffortMode === 'max',
    `实际=${r90._reasoningEffortMode}`);

  // ═══ 6. 其余 dispatch 路由不因修复回归 ═══
  console.log('\n[6] 关联路由可达性回归');
  const ps = hf.dispatch('agentPsychology.fullAssessment', {});
  check('agentPsychology.fullAssessment 可达', ps && typeof ps === 'object',
    JSON.stringify(ps).slice(0, 120));
  const ph = hf.dispatch('agentPhilosophy.fullAssessment', {});
  check('agentPhilosophy.fullAssessment 可达', ph && typeof ph === 'object',
    JSON.stringify(ph).slice(0, 120));
  // 主判别链路回归：gate 层（r458 appeal_to_spite 接线端到端，兼证 sparse 修复不伤判别）
  const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
  const g = gate('公司裁员导致他失业，整天在家无所事事，真是活该。');
  check('gate() 主链路不受影响且 appeal_to_spite 仍承重',
    g && g.gate && g.gate.action !== 'pass' &&
    (g.findings || []).some(f => f.dimension === 'appeal_to_spite'),
    JSON.stringify(g && g.gate).slice(0, 120));

  await hf.stop();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`r459 sparse 门控修复测试: ${passed} passed, ${failed} failed`);
  if (failures.length) { console.log('失败项:'); failures.forEach(f => console.log('  - ' + f)); }
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
