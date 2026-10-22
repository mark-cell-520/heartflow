#!/usr/bin/env node
/** 第 219 轮 decision 真调第三轮：显式 key=value 判据（走 num() 直读通道，不靠词表推断） */
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] 接线 _selfVerification/_reflectionLoopClosed 到 gate-verdict + MCP/报告透传',
  '  feasibility=0.95 risk=0.2 prior=0.9 confidence=0.85',
  '  依据：两字段实测 4/4 落地但 src 读取点 0；gate-verdict VERIFY_SIGNALS 5 条不含它们；',
  '  MCP 透传表与 report-generator 都拿不到；改动集中 3 文件约 100 行，单轮可收尾。',
  '',
  '[B] 扫假绿测试改成真断言',
  '  feasibility=0.99 risk=0.15 prior=0.35 confidence=0.9',
  '  依据：全仓实测只 1 处 doesNotThrow(()=>try{}catch{})（decision-router.test.js:22）；',
  '  只动测试文件不改 src 行为，用户不可感知，收益面窄。',
  '',
  '[C] 零引用模块接线重过',
  '  feasibility=0.4 risk=0.8 prior=0.5 confidence=0.4',
  '  依据：候选 thought-chain.js 1457 行 / triality-memory.js 1670 行，无先验判据；',
  '  审计+接线两阶段，单轮难收尾。',
  '',
  '[D] 扩 gate-verdict 信号覆盖面',
  '  feasibility=0.7 risk=0.45 prior=0.5 confidence=0.5',
  '  依据：每加一条都可能改变 verify/pass 分布，误拦基线 301/326 有上行风险；',
  '  逐字段注入-删条验证，超单轮调用预算。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第219轮升级方向（显式判据三轮）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
