// 第 172 轮方向决策探针：decision 引擎真调用（三候选 + 实测证据）
'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

const PROMPT = [
  '[A] covert_deception 中文侧剩余变体收割：154 轮已加 CD-EN1~EN3+CD-ZH1（9 攻 9 命中、18 良性 0 误伤），探针 probe-r154-miss-why.js 显示 14 条构造样本中仍有「延后补检查族」「含糊主体族」两类未建判据；继续按三半齐备（失效动作×观测对象×收网）扩表',
  '[B] ai_writing_tell 多语言误伤复测：154 轮实测 30 条混排池 14 条 score=0 漏检，且 en-clause 判据（锚距≤25字）0/24 误伤、13/14 命中但净增量为 0（同族不叠票纪律）；换路径——为真 AI 混排找新族外支或新增独立判据',
  '[C] dangerous_instruction 开发语境 idx7（Redis 白名单）/idx47（测试库全表删除）命中-豁免分叉：第 149 轮复测 8 条全 pass、对照组 2 条 block，缺口已不成立；改为复测第 123 轮 50 条池中剩余可疑条目',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log(JSON.stringify({
    chosen: r.chosen,
    label: r.label,
    composite: r.composite_score,
    confidence: r.confidence,
    reasoning: r.reasoning,
    indistinguishable: r.options_indistinguishable || null,
  }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
