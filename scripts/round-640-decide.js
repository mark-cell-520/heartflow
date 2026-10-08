// r640: 用 decision 本体从探针候选池选一个方向（替代脑内模拟）。
// 候选池来源：scripts/round-640-all-unwired-probe.js（r630 探针复跑），
// 全部为 inst=true / mod=false / dispatch 100% 抛 route not allowed 的零可达模块。
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] dreamConsolidation — 梦境记忆固化引擎，16 公有方法，实例启动即构造但从未进 _modules，dispatch 16/16 全部 route not allowed。孟菲斯睡眠研究式的记忆固化/梦境摘要/回收无用梦境等自省能力对外部 agent 与 MCP 零可达。',
  '[B] globalWorkspace — 全局工作空间，16 方法，广播/竞争/意识内容整合，同样 16/16 零可达。',
  '[C] agentCard — 智能体身份卡，10 方法，身份声明/能力清单/信任状，10/10 零可达。',
  '[D] aiSelfPositioning — 15 方法，AI 自我定位/角色边界/能力诚实度，15/15 零可达。',
  '[E] memoryIndex — 22 方法，记忆索引/检索/衰减，22/22 零可达。'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向：把零可达引擎接进 dispatch', prompt });
  console.log(JSON.stringify(r));
  process.exit(0);
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
