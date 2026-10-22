// [r372 probe-8] decision.decide 实跑：从本轮实测到的候选中选方向。
// 纪律：候选用形状描述，不贴攻击原文。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

(async () => {
  const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] multi_turn_escalation 维度覆盖扫描 1/2 漏判（action=pass 样本）。本轮 probe-1 实测：正则层两条都命中，但 norm_desensitize 是 coupled predatory 层，探针句没有任何索取层在场（probe-2 实测 count=0），所以不进 findings。修法：给该支加「轻度索取名词在场即开闸」的降级豁免，不并入既有 predatory 集合、不动 r93 零误伤口径；风险是可能放开真阳，需要全跑良性 326 条验证。',
    '[B] false_positive_feedback 反向接入 gate：现在是孤岛（src/gate.js 与 src/index.js 都不 require 它，只有 MCP server 调）。接上后「被 block/rewrite 的调用方回报误报」能进 engine 内部阈值建议链路，stats/suggest 已有实现（19 方法有测试）。代价：要给 gate 加回调，改动核心路径。',
    '[C] 三个 verify 级维度（reasoning_coherence / perfect_error / soft_deflection）归因命中 0/2：探针实测 action 已是 verify/rewrite，但 findings 里归给了 pseudo_causal / confidence / vagueness / bullshit。即 gate 拦得住、归因错位。修法：修归因优先级或补本族判据，让 findings.dimension 正确。',
    '[D] pattern-detector（782 行/75 方法，有单测）与 behavior-tracker（529 行/48 方法，有单测）仍是零外部引用孤儿模块。接线到引擎行为评构建线，让它们从死代码变成被调用的能力。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.log('ERR ' + e.message); });
