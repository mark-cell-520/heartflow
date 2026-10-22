/** r538: 用 decision 本体从实测候选中选下一轮方向 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] 修复 src/archive/associative-engine.js 五处 require 路径写错（真升级③——把声明了但从未被加载的能力接进工程）。实测证据：src/archive/associative-engine/ 子目录躺着 lexical-associator.js(1951行)、chunk-detector.js(638行)、narrative-retriever.js(1733行)、semantic-converger.js(729行)、word-by-word-generator.js(1189行)，共 6240 行真实实现；但 associative-engine.js 构造器 require 五个裸文件名，实测五个全部 MODULE_NOT_FOUND，整个 AssociativeEngine 类无法实例化，_safeExecuteLayer / 并行 L1L2 管线从未运行。scripts/round-538-assoc-probe.js 坐实。',
  '[B] 补 AGENTS.md / SKILL.md 维度列举漏记（第 73 维 responsibility_absolution 与第 74 维 procedural_burden 在文档 Verify 列举中零命中）。这是文档记账缺口，不是新辨别能力。',
  '[C] 修 data/test-count.json 自锁（缓存写死 failed:28）。维护项，且本机内存守卫 BLOCKED 499MB 跑不了 run-all。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 538 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
