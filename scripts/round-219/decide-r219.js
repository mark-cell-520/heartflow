#!/usr/bin/env node
/** 第 219 轮 decision 真调：四候选裁决 */
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 接线 _selfVerification/_reflectionLoopClosed 到 gate-verdict 与 MCP 透传',
  '  实测：两字段 100% 落地（4/4 think 全产出）但 src 侧读取点 0；gate-verdict 的',
  '  VERIFY_SIGNALS 5 条里没有它们；MCP 透传字段表也没有；report-generator 拿不到。',
  '  影响：心虫已判出的自验证问题（passed=false/issues=1）没有任何下游能听见。',
  '  工作量：改 gate-verdict 信号表 + report/mcp 两处透传 + 负例守卫，约 100 行。',
  '',
  '[B] 扫假绿测试并改成真断言',
  '  实测：全仓只 1 处 doesNotThrow(()=>try{}catch{})=test/decision-router.test.js:22，',
  '  该文件 0 断言覆盖规则匹配；218 轮已修掉它守护的那条恒崩。',
  '  影响：把崩溃当天预期的测试仍存在，但只剩 1 处。',
  '  工作量：补 5-8 条真断言，约 60 行。',
  '',
  '[C] 零引用模块接线重过',
  '  候选 thought-chain.js（1457 行）/ triality-memory.js（1670 行），216 轮口径 369 个。',
  '  影响：可能是大能力复活，也可能是死代码。',
  '  工作量：先审计后接线，单轮难收尾，有超时风险。',
  '',
  '[D] 扩 gate-verdict 信号覆盖面',
  '  实测 VERIFY_SIGNALS 5 条；think() 还有 _metacognitiveMonitor/_driftCorrected/',
  '  _languageHonesty 等已产出未聚合字段。',
  '  影响：更多信号可执行化，但每条都要判真伪、可能引入误拦。',
  '  工作量：逐字段验证，约 150 行。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第219轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
