#!/usr/bin/env node
/**
 * 第 219 轮 decision 真调第四轮：显式结构化 options（绕开自然语言解析，
 * 直接走文档化接口）。第 85/86/99 轮修的 key=value 解析通道实测不吃
 * prompt 里的多行形态，本轮用结构化 options 拿到区隔分数。
 */
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const options = [
  {
    id: 'A', label: '接线 _selfVerification/_reflectionLoopClosed 到 gate-verdict + MCP/报告透传',
    description: '实测 4/4 落地但 src 读取点 0；改 3 文件约 100 行；单轮可收尾；注入负例可写。',
    feasibility: 0.95, consequence_value: 0.9, risk: 0.2, prior: 0.9, confidence: 0.85,
  },
  {
    id: 'B', label: '扫假绿测试改成真断言',
    description: '全仓实测只 1 处；只动测试文件不改 src 行为；用户不可感知；收益面窄。',
    feasibility: 0.99, consequence_value: 0.35, risk: 0.15, prior: 0.35, confidence: 0.9,
  },
  {
    id: 'C', label: '零引用模块接线重过',
    description: '候选 1457/1670 行陌生链路；无先验判据；审计+接线两阶段，单轮难收尾。',
    feasibility: 0.4, consequence_value: 0.5, risk: 0.8, prior: 0.5, confidence: 0.4,
  },
  {
    id: 'D', label: '扩 gate-verdict 信号覆盖面',
    description: '每加一条都可能改变 verify/pass 分布，误拦基线 301/326 有上行风险。',
    feasibility: 0.7, consequence_value: 0.5, risk: 0.45, prior: 0.5, confidence: 0.5,
  },
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第219轮升级方向（结构化 options 四轮）', options });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
