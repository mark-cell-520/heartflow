#!/usr/bin/env node
/** 第 219 轮 decision 真调第二轮：补可区判据（blast radius × 可验证性 × 单轮可收尾性） */
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 接线 _selfVerification/_reflectionLoopClosed 到 gate-verdict 与 MCP/报告透传',
  '  判据：blast radius = 窄（只增 VERIFY_SIGNALS 两条 + 透传字段表两条，不动既有 5 条语义）；',
  '    可验证性 = 高（注入假 sv.failed=true 必须变 verify、假 passed 必须不触发，负例可写）；',
  '    单轮可收尾 = 是（约 100 行，改动集中 3 文件）；',
  '    用户可感知变化 = 有（MCP/report 首次能看到自验证失败原因）。',
  '',
  '[B] 扫假绿测试并改成真断言',
  '  判据：blast radius = 无（只动测试文件，不改 src 行为）；',
  '    可验证性 = 高；单轮可收尾 = 是（约 60 行）；',
  '    用户可感知变化 = 无（测试是防线不是能力，用户感知不到）。',
  '',
  '[C] 零引用模块接线重过',
  '  判据：blast radius = 宽（可能复活 1400-1700 行陌生链路）；',
  '    可验证性 = 低（没有先验判据知道它是否真有用）；',
  '    单轮可收尾 = 否（审计+接线两阶段，218 轮单方向就吃掉整轮）。',
  '',
  '[D] 扩 gate-verdict 信号覆盖面',
  '  判据：blast radius = 中（每加一条都可能改变 verify/pass 分布，误拦基线 301/326 有上行风险）；',
  '    可验证性 = 中（要逐字段做注入-删条）；',
  '    单轮可收尾 = 否（多字段逐个验证，超 60 次调用预算风险高）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第219轮升级方向（补判据二轮）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
