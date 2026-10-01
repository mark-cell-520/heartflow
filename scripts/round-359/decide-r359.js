// r359 decision：选下一轮方向（候选描述带实测证据）
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 补跑上一轮（r358）遗留的 7 项验证：该轮 2 处引擎修复（GROUP_FACT_DIFF_EN.verb 名词形 + findings 循环 perfect_error 单信号豁免）从未经过任何验证就交接，负例守卫 negative-test-en-numeric-diff-r358.js 处于施工中状态、P2 置假点无失效面、probe-14 刚实测坐实 S1 假精确是 probe-1 #2 的真实触发支（fixed [] vs old [S1_false_precision]）',
    '[B] 收口 104 个未跟踪文件的 git 卫生：scripts/round-299/301/327/328/330/331/335/353/358 等多轮探针目录 + 2 个已跑通但未入库的负例守卫（negative-test-4-dims-round353.js / negative-test-decision-mode-r310b.js）+ 本轮 r358 的 12 个探针和半成品守卫，连续五轮（r355-r359）移交未动',
    '[C] 修 reasoning_coherence 的 2 条漏检（r357 遗留第 1 条、r358 候选 A 0.74 分）：伪归因句被判「完整推理链 0.9」优良、结构性漏检各 1 条，probe-1/2 已复现，修法方向已定位（pseudo_causal 命中时不授予完整推理链高分 / 加前提到结论语义跨度判据），但改它要动结构评分基线',
  ].join('\n');

  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
