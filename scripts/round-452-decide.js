// r452 方向选择：decision 本体（3 候选，全部单行内联 key=value 数值判据）
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '[A] 修 r446 presupposed_premature_admission 守卫测试失效：守卫 7 个 BRANCHES locator 全部是 r446 旧版承认动词形，②b 同位支（为…负责/担责/担起）无 locator 守卫。 feasibility=0.95 consequence_value=0.85 risk=0.05 confidence=0.9',
  '[B] 跑完 run-all 全量刷新 data/test-count.json：上一轮后台被 143 终止，failed=77 脏值导致 doc-numbers 19/21。 feasibility=0.4 consequence_value=0.7 risk=0.15 confidence=0.85',
  '[C] 清 157 个未跟踪探针脚本与 test/_tmp_*.js：纯工程债，不影响能力判定。 feasibility=0.9 consequence_value=0.3 risk=0.05 confidence=0.8',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(out, null, 2));
})();
