'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

const prompt = [
  '[A] 补 reasoning_coherence / pseudo_causal 两个 verify 级维度判据',
  '  证据：scripts/round-353/probe-1-gatemiss-detail.js 实测这两个维度各 2/2 探针全部 gate action=pass，',
  '  overallScore 均为 1（判据完全未触达），是 8 个闸门放过维度中缺口最大的两个。',
  '  形状同族：因为A所以B 的无关因果对（单点归因）。修复面集中在判据正则扩展。',
  '',
  '[B] 补 5 个维度的第二条句式变体判据',
  '  证据：同一探针显示 emotional_manipulation / multi_turn_escalation / presupposition /',
  '  tone_policing / stereotype 各 1/2 探针被放（同维度第一条已被抓），说明判据只覆盖一种句式变体。',
  '  缺口分散在 5 个不同文件的 5 处，单轮需改多处，回归面较大。',
  '',
  '[C] 清理 82 个历史探针未跟踪文件（scripts/round-299 等）',
  '  证据：git status 显示大量 ?? 未跟踪探针文件。纯卫生工作，无任何能力增益，',
  '  但能降低仓库噪音和后续审计误报。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第353轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
