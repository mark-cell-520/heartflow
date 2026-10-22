// r636: decision 本体选方向 v5 —— 候选全部来自本轮实测（round-636-final-check.js）
// 铁律③：把「声明了但从未被 dispatch 调用过」的能力真正接进 pipeline，单选不双做。
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] ruleGrowth 判断生长引擎接线 —— 7 方法。实测：实例在 heartflow.js L2836 一直在构造、已学规则在 L2839 注入 decisionRouter.addRule，但 _modules 无 ruleGrowth 键、ALLOWED_ROUTES 0 条命中、hf.routes() 零命中、dispatch 7/7 全部抛 route not allowed（round-636-final-check.js 实测）。可接管能力：observe（观察一次判断信号，>=3 次固化成规则）、evaluate（对输入返回匹配的已学规则）、toDecisionRouterRules、getStats、_load/_save。新增辨别力=「心虫的判断规则本身可从反馈里生长并再次被检视」——这是辨别者的自我改进腿，此前对任何 dispatch 调用方不可达。feasibility=0.95 consequence_value=0.8 risk=0.3 confidence=0.85',
  '[B] postTraining 异步后训练引擎接线 —— 10 方法。实测：实例在 L2828 构造、pipeline 调用点=0、dispatch 10/10 全抛 route not allowed、MCP 零命中。能力：schedule/_drain/_processBatch/_assessQuality（决策质量 retrospective 评分 0-1）、_extractPatterns（重复决策/低置信度聚类）、_adjustWeights（规则权重微调，带 MAX_RULES_PER_BATCH 与 delta cap）、getStats/getLastBatch/clear。性质=决策质量回溯，属元认知而非辨别对错。feasibility=0.9 consequence_value=0.6 risk=0.4 confidence=0.8',
  '[C] agentCard 数字身份卡接线 —— 10 方法。实测：L1639 构造并 loadOrCreate，但 _modules 无键、ALLOWED_ROUTES 0 条、dispatch 10/10 全抛、pipeline 调用点=0、MCP 零命中。能力：loadOrCreate/_computeIdentityCode/_computeSelfHash/_buildCapabilityManifest/_buildToolSchema/_generate/_persist/getCard/verify。性质=身份与能力清单自述+校验，verify 有一定辨别力（篡改检测）但主体是身份管理。feasibility=0.88 consequence_value=0.5 risk=0.45 confidence=0.75',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮真升级方向（铁律③：零通告声明能力接进 dispatch，单选不双做）', prompt: candidates });
  console.log('R636_DECIDE_V5');
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
