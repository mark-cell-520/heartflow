// [v6.7.130 第 300 轮] decision 真调用选方向 —— 第二轮（补可行性/先例/风险判据）
// 第一轮 A=0.84 / C=0.84 并列（options_indistinguishable）。本轮补三类可区分判据：
// 可行性（是否有已实测的判别力来源）、先例（同形态是否已被实测否决过）、
// 风险（改动是否会动摇已收窄的误伤基线）。
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 修中文侧 pseudo_profundity B 侧本体论词表召回不足（r298 遗留第 3 项，正例 BASE 仅命中 1/8、漏检 7 条）。可行性：判别力来源已实测存在——EN 侧 r299 E1/E2 证明「系词否定 × B 侧本体论词表」族在中文侧已有对应骨架（8781/8792 行），只需按 probe-297/298 同款方法先实测漏检样本的 B 侧落点再定词，探针成本约 3-4 支。风险：中文侧改动只动词表，不动结构，误伤可用 r298 已归零的 18 条工程真句 + 双向守卫 302/326 基线兜底。先例：r298 同款剔词改动一次成功。',
    '[B] 修 decision.js _parseOptionsFromText 多行候选截断 bug（本轮实测两次 chosen:null + confidence 0）。可行性：正则只吃首行，根因已定位到 src/core/decision.js 单行，修改小。风险：decision 改动会影响所有后续轮选向口径，且本节若改坏无法用 pseudo_profundity 的探针体系验证，需要单独的 guard。收益是工具链正确性而非新辨别能力。',
    '[C] 实装 E3 EN 引导式族的安全变体。可行性低：r299 已投入四轮探针（probe-4 到 probe-8），裸版误伤 6/42、加严版召回 0/12 两版都实测否决，判别力来源两轮未找到。先例：中文侧 r297 前置否定族裸版 6/24 误伤同构形态已作废记账。风险：再投入一轮可能仍是否决，零 commit 概率高。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r).slice(0, 2000));
})().catch(e => console.error('ERR', e.message));
