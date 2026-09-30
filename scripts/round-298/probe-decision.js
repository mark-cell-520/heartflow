// round-298 decision 调用（用代码调 decision，不读简报脑内模拟）
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 修 PSEUDO_PHILOSOPHY_ZH 伪辩证族历史误伤：无「而是」形态的「这不是X的错，是Y，…」被旧族 8754 行吞（probe-297-11 + git worktree 差分已实测坐实在 r296 基线 ac9c1ec1 上就命中，r297 交接簿列为第1优先遗留）',
    '[B] 细化 isEmphasis（doubt-engine 最宽排除条件，连续第三轮挂账，潜在影响整个 doubt 召回族，无一手实测证据）',
    '[C] 实测英文侧 pseudo_profundity 判据覆盖度（decision 候选C，连续两轮缺一手证据，需先写探针才知道缺口在哪）',
  ].join('\n');
  const r = await d.decide({ task: '选第298轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => console.error('ERR', e && e.message));
