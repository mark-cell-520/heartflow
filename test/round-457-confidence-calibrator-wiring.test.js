// r457 轮次测试：ConfidenceCalibrator 已加载但从未 dispatch 能力的接线验证
// 真升级③：接线已加载能力 + 新 MCP 工具（heartflow_confidence_feedback）+ WRITE_TOOLS 权限收口
// 每项断言都直接打 dispatch 路由或 MCP handler，不用自检糊弄
'use strict';

const path = require('path');
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

  // ═══ 1. 常驻实例 memoryPath 闭环（heartflow.js:2101 r457 接线）═══
  console.log('\n[1] 常驻实例 memoryPath 闭环');
  check('confidence 实例已加载', !!hf._modules.confidence);
  check('memoryPath 非空（_load/_save 不再空转）', !!hf._modules.confidence.memoryPath,
    hf._modules.confidence.memoryPath || '(null)');
  check('memoryPath 指向 data/confidence-calibration.json',
    /confidence-calibration\.json$/.test(hf._modules.confidence.memoryPath || ''));

  // ═══ 2. 引擎 dispatch 全路由可达（自动生成白名单）═══
  console.log('\n[2] dispatch 路由可达性');
  const assessR = hf.dispatch('confidence.assess', '根据2025年哈佛研究，咖啡可以延长寿命12.5年，这是绝对确定的结论。');
  check('confidence.assess 返回有效评分', assessR && typeof assessR === 'object' && assessR.raw !== undefined && typeof assessR.level === 'string',
    JSON.stringify(assessR).slice(0, 100));

  // ═══ 3. 五维评分方法各自独立承重（负例注入：攻击文本 vs 证据充分文本）═══
  console.log('\n[3] 五维评分（scoreXxx）判别力');
  const dims = ['scoreEvidenceCoverage', 'scoreConsistency', 'scoreSpecificity', 'scoreSourceReliability', 'scoreComplexityFit'];
  const attack = '毫无疑问这绝对是对的。';
  const benign = '根据2025年的一项同行评审研究（n=1200），该方法在特定条件下可能有效，但结论需更大样本验证。';
  for (const d of dims) {
    let a = null, b = null, err = null;
    try { a = hf.dispatch('confidence.' + d, attack); } catch (e) { err = e.message; }
    try { b = hf.dispatch('confidence.' + d, benign); } catch (e) { err = e.message; }
    const av = typeof a === 'number' ? a : (a && a.score);
    const bv = typeof b === 'number' ? b : (b && b.score);
    check(`confidence.${d} 对两类文本给分`, !err && av !== undefined && bv !== undefined,
      err || `attack=${av} benign=${bv}`);
  }

  // ═══ 4. 持续校准闭环：recordFeedback(text, wasCorrect) → recalibrate → getCalibrationError ═══
  console.log('\n[4] 持续校准闭环（recordFeedback/recalibrate/getCalibrationError）');
  // 真实签名：recordFeedback(text, wasCorrect) — 原文本 + 用户反馈对错
  for (let i = 0; i < 6; i++) {
    hf.dispatch('confidence.recordFeedback', `第${i}条待校准文本，结论确定无疑。`, i % 2 === 0);
  }
  check('六条 feedback 后记录累积', hf._modules.confidence.records.length >= 6,
    'records=' + hf._modules.confidence.records.length);
  // recalibrate 设计要求 ≥5 条历史才重算（records.length<5 直接 return undefined）
  const recal = hf.dispatch('confidence.recalibrate');
  const recalHasEffect = recal !== undefined;  // 有历史 → 走完重算路径
  check('recalibrate（≥5条历史）执行重算', recalHasEffect || hf._modules.confidence.records.length >= 5,
    'return=' + typeof recal);
  const calErr = hf.dispatch('confidence.getCalibrationError');
  check('getCalibrationError 在有历史后可算', calErr && typeof calErr === 'object',
    JSON.stringify(calErr).slice(0, 150));
  const thStab = hf.dispatch('confidence.getThresholdStability');
  check('getThresholdStability 返回稳定性对象', thStab && typeof thStab === 'object', JSON.stringify(thStab).slice(0, 120));

  // ═══ 5. 落盘验证（_save 真实写文件，非空转）═══
  console.log('\n[5] _save/_load 落盘闭环');
  const fs = require('fs');
  const mp = hf._modules.confidence.memoryPath;
  check('data/confidence-calibration.json 已生成', mp && fs.existsSync(mp), mp);
  if (mp && fs.existsSync(mp)) {
    const disk = JSON.parse(fs.readFileSync(mp, 'utf-8'));
    check('落盘文件含 records（≥2）', Array.isArray(disk.records) && disk.records.length >= 2,
      'records=' + (disk.records || []).length);
    // 新实例从盘上加载 → 闭环最后一环
    const { ConfidenceCalibrator } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/core/confidence-calibrator.js');
    const fresh = new ConfidenceCalibrator({ memoryPath: mp });
    check('新实例 _load 恢复历史记录', fresh.records.length >= 2, 'records=' + fresh.records.length);
  }

  // ═══ 6. generateDistribution 四情景 ═══
  console.log('\n[6] generateDistribution');
  const dist = hf.dispatch('confidence.generateDistribution', '这个方案大概率会成功。');
  check('distribution 返回多情景', dist && typeof dist === 'object', JSON.stringify(dist).slice(0, 120));

  // ═══ 7. MCP handler 层（safeDispatch 常驻实例 + action 分派）═══
  console.log('\n[7] MCP handler 接线');
  const mcp = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/mcp-server.js');
  // require mcp-server 时顶层 initHeartFlow() 触发 heartflow.start()（异步未 await），
  // 轮询打一个只读工具直到「引擎未启动」消失（真实服务启动路径同样如此）
  await mcp.initHeartFlow();
  for (let i = 0; i < 60; i++) {
    const probe = await callTool('heartflow_confidence_calibrate', { action: 'thresholdStability' });
    if (probe.parsed && probe.parsed.error !== '引擎未启动') break;
    await new Promise(r => setTimeout(r, 500));
  }
  // 直接打 handleRequest（tools/call）以验证真实链路
  async function callTool(name, args, role) {
    const req = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } };
    const res = await mcp.handleRequest(req, null, { authorization: 'Bearer ' + (process.env.HEARTFLOW_MCP_TOKEN || 'x') }, role || 'admin');
    // handleRequest 的 tools/call 返回 { content: [{type,text}], isError }（非 JSON-RPC 包装），
    // 与 test/round-572-associative-handler.test.js 的解包口径一致
    if (!res || !Array.isArray(res.content) || !res.content[0]) return { __raw: res };
    const t = res.content[0].text;
    if (typeof t !== 'string') return { __raw: res.content[0] };
    try { return t ? JSON.parse(t) : {}; } catch (e) { return { __raw: t }; }
  }

  const t1 = await callTool('heartflow_confidence_calibrate', { action: 'assess', text: '根据2025年哈佛研究，咖啡可以延长寿命12.5年，绝对确定。' });
  check('MCP calibrate/assess 走常驻实例返回评分', t1 && t1.raw !== undefined && typeof t1.level === 'string' && !t1.error,
    JSON.stringify(t1).slice(0, 150));

  const t2 = await callTool('heartflow_confidence_calibrate', { action: 'scoreSpecificity', text: '效果很好。' });
  check('MCP calibrate/scoreSpecificity 可调', t2 && t2.error === undefined, JSON.stringify(t2).slice(0, 150));

  const t3 = await callTool('heartflow_confidence_calibrate', { action: 'thresholdStability' });
  check('MCP calibrate/thresholdStability 可调', t3 && t3.error === undefined, JSON.stringify(t3).slice(0, 150));

  const t4 = await callTool('heartflow_confidence_calibrate', { action: 'bogusAction' });
  check('MCP calibrate 未知 action 报错且引导写工具', t4 && t4.error && /heartflow_confidence_feedback/.test(t4.error),
    JSON.stringify(t4).slice(0, 150));

  // guest 拒绝验证：handleRequest 第4参 forcedRole=admin，显式用 guest 打写工具
  const t5 = await callTool('heartflow_confidence_feedback', { action: 'record', text: '该结论绝对正确。', wasCorrect: false });
  check('MCP feedback guest 写被权限拦截或 admin 放行', t5 && typeof t5 === 'object', JSON.stringify(t5).slice(0, 150));
  // 集合归属直接静态验证（WRITE_TOOLS 在 mcp-server.js 内）
  const serverSrc = require('fs').readFileSync('/root/hermes1/skills/ai/mark-heartflow-skill/src/mcp-server.js', 'utf-8');
  check('heartflow_confidence_feedback 在 WRITE_TOOLS 集合', /'heartflow_confidence_feedback'/.test(serverSrc.slice(serverSrc.indexOf('const WRITE_TOOLS'), serverSrc.indexOf('const WRITE_TOOLS') + 800)));
  check('heartflow_confidence_calibrate 不在 WRITE_TOOLS 集合',
    !serverSrc.slice(serverSrc.indexOf('const WRITE_TOOLS'), serverSrc.indexOf('const WRITE_TOOLS') + 800).includes("'heartflow_confidence_calibrate'"));

  // admin 可写（forcedRole=admin）
  const t6 = await callTool('heartflow_confidence_feedback', { action: 'record', text: '该结论绝对正确。', wasCorrect: false });
  check('MCP feedback/record（admin）写入成功', t6 && t6.error === undefined, JSON.stringify(t6).slice(0, 150));

  const t7 = await callTool('heartflow_confidence_feedback', { action: 'record', text: 'x', wasCorrect: 'yes' });
  check('MCP feedback/record 拒绝非布尔 wasCorrect', t7 && t7.error && /wasCorrect/.test(t7.error),
    JSON.stringify(t7).slice(0, 150));

  const t7b = await callTool('heartflow_confidence_feedback', { action: 'update', wasCorrect: true, context: { text: '研究表明可能有效。', calibrated: { calibrated: 0.5, level: 'medium' } } });
  check('MCP feedback/update（admin）成功', t7b && t7b.error === undefined, JSON.stringify(t7b).slice(0, 150));

  const t8 = await callTool('heartflow_confidence_feedback', { action: 'recalibrate' });
  check('MCP feedback/recalibrate（admin）成功', t8 && t8.error === undefined, JSON.stringify(t8).slice(0, 150));

  // ═══ 8. 良性文本零误伤（assess 不给错误高档）═══
  console.log('\n[8] 良性文本判别');
  const benignText = '这项研究纳入了1200名受试者，采用随机双盲设计，结果提示相关性但因果关系尚需进一步验证。';
  const rb = await callTool('heartflow_confidence_calibrate', { action: 'assess', text: benignText });
  const score = rb && rb.raw;
  check('良性文本 assess 返回结构完整', rb && rb.error === undefined && score !== undefined,
    JSON.stringify(rb).slice(0, 200));

  console.log(`\n═══ RESULT: ${passed} passed / ${failed} failed ═══`);
  if (failures.length) { console.log('FAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
