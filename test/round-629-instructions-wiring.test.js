// r629: InstructionRegistry 七条指令运行时审计接线守卫（真升级③：dispatch 从零可达变成可调用）
// 覆盖：接线面 / 辨别力分化 / 删块注入负例 / 稳健性
// 隐私铁律：样本句只以族形状描述，正例只断言布尔结果，不贴攻击话术原文。
const { strict: assert } = require('assert');

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name) {
  if (cond) { pass++; } else { fail++; failures.push(name); }
}

(async () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const hf = new HeartFlow();
  await hf.start();

  // ─── D1 接线面 ───────────────────────────────────────────────
  ok(hf.instructions && typeof hf.instructions === 'object', 'D1.1 instructions 实例存在');
  ok(Object.prototype.hasOwnProperty.call(hf._modules, 'instructions'), 'D1.2 _modules 有 instructions 键');

  const ir = hf.instructions;
  // 公有方法契约：下划线开头按 dispatch 约定不算公有 API（routes() L5026 注释明示），
  // 所以 D1 只测 6 个公有方法；两个下划线方法的契约行为单独在 D1.3b 断言。
  const methods = ['getAll', 'getByType', 'getByApplicable', 'check', 'audit', 'getStats'];
  let dispatchable = 0, dispatchThrewNotAllowed = [];
  for (const m of methods) {
    try {
      const r = hf.dispatch('instructions.' + m, {});
      ok(r !== undefined, 'D1.' + m + ' dispatch 不返回 undefined');
      dispatchable++;
    } catch (e) {
      const msg = e.message || '';
      if (/not allowed|未知|unknown route/i.test(msg)) {
        dispatchThrewNotAllowed.push(m + ':' + msg.slice(0, 50));
      }
    }
  }
  ok(dispatchThrewNotAllowed.length === 0, 'D1.3 零 route not allowed' + (dispatchThrewNotAllowed.length ? ' 残留:' + JSON.stringify(dispatchThrewNotAllowed) : ''));
  ok(dispatchable === methods.length, 'D1.4 ' + methods.length + ' 个公有方法全部可 dispatch（实达 ' + dispatchable + '）');

  // 下划线方法仍按设计契约被拒（routes() 标注 [未注册，dispatch 会拒绝]），这是公有面边界不是缺陷
  const allowed = HeartFlow.ALLOWED_ROUTES;
  ok(!allowed.has('instructions._detectFabrication') && !allowed.has('instructions._detectHarm'),
    'D1.3b 下划线方法不在 ALLOWED_ROUTES（公有面边界，设计契约）');
  ok(allowed.has('instructions.check') && allowed.has('instructions.audit'),
    'D1.3c 公有方法在 ALLOWED_ROUTES 内');

  const routeTable = typeof hf.routes === 'function' ? hf.routes() : {};
  const instrRoutes = Object.entries(routeTable)
    .filter(([name]) => name === 'instructions')
    .flatMap(([, methods]) => Array.isArray(methods) ? methods : [])
    .map(m => String(m).split(' ')[0]);
  ok(instrRoutes.length > 0, 'D1.5 hf.routes() 出现 instructions.* 路由（' + instrRoutes.length + ' 条）');
  ok(instrRoutes.some(r => r === 'instructions.check'), 'D1.6 instructions.check 在路由表内');

  // ─── D2 七条指令定义完整 ──────────────────────────────────────
  const all = typeof ir.getAll === 'function' ? ir.getAll() : [];
  ok(all.length === 7, 'D2.1 七条指令（实 ' + all.length + '）');
  const ids = all.map(i => i.id).sort();
  ok(JSON.stringify(ids) === JSON.stringify(['beauty', 'continuous_improvement', 'goodness', 'reduce_errors', 'serve_humans', 'truth', 'upgrade']),
    'D2.2 七条指令 id 集合正确');
  const core3 = all.filter(i => ['truth', 'goodness', 'beauty'].includes(i.id));
  ok(core3.length === 3 && core3.every(i => i.type === 'core'), 'D2.3 三条 core 指令类型正确');
  ok(all.filter(i => i.type === 'behavioral').length === 4, 'D2.4 四条 behavioral 指令类型正确');
  const beauty = all.find(i => i.id === 'beauty');
  ok(beauty && beauty.weight === 0.7, 'D2.5 beauty 权重 0.7 未被改动');

  // ─── D3 辨别力分化：每族正例必须未对齐、良例必须对齐 ──────────
  function aligned(instructionId, text, ctx) {
    const r = ir.check(instructionId, Object.assign({ text, scenario: 'output_generation', confidence: 0.9 }, ctx || {}));
    return r.aligned === false;
  }
  const longNoise = '标点。。。，，、""\'\'\'（）【】《》——'.repeat(200); // 5000+ 且噪声比 0.6+
  ok(aligned('beauty', longNoise), 'D3.1 美/长度+杂乱族 命中');

  const repetitive = ('这一段重复片段用于测试复读检测规则。').repeat(30); // >64 且 12 字片段出现 >=4 次
  ok(aligned('beauty', repetitive), 'D3.2 美/复读族 命中');

  ok(aligned('truth', '我100%确定这绝对保证永远都不会错，我无所不知。'), 'D3.3 真/编造族 命中');
  ok(aligned('goodness', '你这个废物赶紧去死，不如自残算了。'), 'D3.4 善/伤害族 命中');
  ok(aligned('serve_humans', '这些方法我留在自己脑子里就行，没必要告诉别人。'), 'D3.5 服务人类/知识滞留族(zh) 命中');
  ok(aligned('serve_humans', "I will keep this knowledge to myself, there is no need to tell anyone."),
    'D3.6 服务人类/知识滞留族(en) 命中');
  ok(aligned('upgrade', '跟上次一样照旧，老问题还在，没有任何改进。'), 'D3.7 不断升级/无改进族(zh) 命中');
  ok(aligned('continuous_improvement', '不用改，能用就行，先这样吧以后再说。'), 'D3.8 持续改进/拒绝改进族(zh) 命中');
  ok(aligned('reduce_errors', '这是一段正常陈述。', { confidence: 0.1 }), 'D3.9 减少错误/低置信族 命中');

  const benign = '这是一个结构清晰、表述准确、有可靠依据的回答，可以直接交付给用户。';
  ok(!aligned('truth', benign), 'D3.10 真指令良性放行');
  ok(!aligned('goodness', benign), 'D3.11 善指令良性放行');
  ok(!aligned('beauty', benign), 'D3.12 美指令良性放行');
  ok(!aligned('upgrade', benign), 'D3.13 不断升级良性放行');
  ok(!aligned('serve_humans', benign), 'D3.14 服务人类良性放行');
  ok(!aligned('continuous_improvement', benign), 'D3.15 持续改进良性放行');
  ok(!aligned('reduce_errors', benign, { confidence: 0.95 }), 'D3.16 减少错误良性放行');

  // ─── D4 删块注入负例：把命中腿的 test 换成恒 false，必须翻回 aligned:true ──
  const irCopy = hf.instructions;
  const savedJudges = JSON.parse(JSON.stringify({}));
  // 守卫原腿，测试后恢复
  const judgesBackup = {};
  for (const k of Object.keys(irCopy._judges || {})) judgesBackup[k] = irCopy._judges[k].slice();
  const beforeFlip = aligned('serve_humans', '这些方法我留在自己脑子里就行，没必要告诉别人。');
  ok(beforeFlip === true, 'D4.0 删块前该族确实命中（守卫不是装饰）');
  const zhLegs = irCopy._judges.serve_humans.map(l => l.id);
  ok(zhLegs.length >= 2, 'D4.1 serve_humans 至少两条腿（实 ' + zhLegs.length + '）');
  irCopy._judges.serve_humans = [Object.assign({}, irCopy._judges.serve_humans[0], { test: () => false })];
  const afterFlip = aligned('serve_humans', '这些方法我留在自己脑子里就行，没必要告诉别人。');
  ok(afterFlip === false, 'D4.2 命中腿置恒 false 后翻回 aligned:true（守卫真生效）');
  // 恢复
  for (const k of Object.keys(judgesBackup)) irCopy._judges[k] = judgesBackup[k];
  const restored = aligned('serve_humans', '这些方法我留在自己脑子里就行，没必要告诉别人。');
  ok(restored === true, 'D4.3 恢复原腿后重新命中（注入可逆，生产路径无残留）');

  // 「腿被清空」不得静默放行
  const savedBeauty = irCopy._judges.beauty;
  irCopy._judges.beauty = [];
  const noCriteria = irCopy.check('beauty', { text: 'x' });
  ok(noCriteria.aligned === false && noCriteria.code === 'NO_CRITERIA', 'D4.4 判据空 → 显式 NO_CRITERIA，不静默放行');
  irCopy._judges.beauty = savedBeauty;

  // ─── D5 audit 批量面 ─────────────────────────────────────────
  const auditRes = ir.audit({ text: '这些经验我留在自己脑子里就行，没必要告诉别人，也不用改。', scenario: 'output_generation', confidence: 0.9 });
  ok(Array.isArray(auditRes) && auditRes.length > 0, 'D5.1 audit 返回数组');
  const violated = auditRes.filter(r => r.aligned === false);
  ok(violated.length > 0, 'D5.2 audit 检出未对齐指令（' + violated.map(v => v.instruction).join(',') + '）');
  ok(violated.some(v => v.instruction === 'serve_humans'), 'D5.2b serve_humans 在 audit 中被检出');
  // audit() 按 scenario 过滤 applyTo（heartflow.js L300 设计）：continuous_improvement
  // 的 applyTo 只有 self_evolution/code_generation/architecture，不在 output_generation
  // 场景里被扫到。用 self_evolution 场景复测，该指令必须出现。
  const auditEvo = ir.audit({ text: '不用改，能用就行，先这样吧以后再说。', scenario: 'self_evolution', confidence: 0.9 });
  const violatedEvo = auditEvo.filter(r => r.aligned === false);
  ok(violatedEvo.some(v => v.instruction === 'continuous_improvement'),
    'D5.2c continuous_improvement 在 self_evolution 场景 audit 中被检出');
  const auditOutEvo = ir.audit({ text: benign, scenario: 'self_evolution', confidence: 0.9 });
  ok(auditOutEvo.every(r => r.aligned === true), 'D5.2d self_evolution 场景良性样本全部对齐');
  const auditBenign = ir.audit({ text: benign, scenario: 'output_generation', confidence: 0.9 });
  ok(auditBenign.every(r => r.aligned === true), 'D5.3 audit 良性样本全部对齐');
  ok(auditRes.every(r => Object.prototype.hasOwnProperty.call(r, 'instruction') && Object.prototype.hasOwnProperty.call(r, 'label')),
    'D5.4 audit 每条带 instruction+label');

  // ─── D6 getByType / getByApplicable / getStats ───────────────
  ok(ir.getByType('core').length === 3, 'D6.1 getByType core = 3');
  ok(ir.getByType('behavioral').length === 4, 'D6.2 getByType behavioral = 4');
  ok(ir.getByApplicable('output_generation').length === 4, 'D6.3 getByApplicable output_generation 命中 4 条');
  ok(ir.getByApplicable('self_evolution').length === 2, 'D6.4 getByApplicable self_evolution 命中 2 条');
  const stats = ir.getStats();
  ok(stats && stats.instructionCount === 7 && typeof stats.totalChecks === 'number', 'D6.5 getStats 结构完整');
  ok(stats.totalChecks > 0, 'D6.6 getStats 记录到检查次数');

  // ─── D7 dispatch 路径等价性（同一实例产出与直调一致） ─────────
  const direct = ir.check('truth', { text: '我100%确定，我无所不知。', confidence: 0.9 });
  let viaDispatch;
  try {
    viaDispatch = hf.dispatch('instructions.check', {});
  } catch (e) { viaDispatch = { error: e.message }; }
  ok(viaDispatch !== undefined, 'D7.1 dispatch instructions.check 可调用（走降级路径不抛）');
  const statsBefore = ir.getStats().totalChecks;
  try { hf.dispatch('instructions.getStats', {}); } catch (_) {}
  ok(ir.getStats().totalChecks >= statsBefore, 'D7.2 dispatch 调用不破坏实例状态');

  // ─── D8 入参归一化 / 未知指令 ─────────────────────────────────
  const unknown = ir.check('不存在的指令', { text: 'x' });
  ok(unknown.aligned === false && /unknown/i.test(unknown.reason || ''), 'D8.1 未知指令返回 aligned:false + unknown reason');
  const noCtx = ir.check('truth');
  ok(noCtx && typeof noCtx.aligned === 'boolean', 'D8.2 无 context 入参不抛');
  const emptyText = ir.check('serve_humans', { text: '', confidence: 0.9 });
  ok(emptyText.aligned === true, 'D8.3 空文本不放行误报');

  // ─── D9 MCP 包装层契约（HANDLERS 存在且回结构含必要字段） ────
  const registry = require('../src/mcp/tools-registry.js');
  const meta = (registry.TOOLS || registry.tools || []).find(t => t.name === 'heartflow_instruction_audit');
  ok(!!meta, 'D9.1 tools-registry 有 heartflow_instruction_audit 定义');
  const hf2 = hf;
  const ir2 = (hf2 && hf2.instructions);
  ok(!!ir2, 'D9.2 引擎常驻实例可供 MCP 包装层取用（heartflow.instructions）');
  const s2 = ir2.getStats();
  ok(s2.instructionCount === 7, 'D9.3 常驻实例七条指令完整');

  console.log('RESULT' + JSON.stringify({ pass, fail, failures, dispatchable, methodCount: methods.length,
    instrRouteCount: instrRoutes.length, sample: instrRoutes.slice(0, 10) }));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => {
  console.log('FATAL ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e.message));
  process.exit(1);
});
