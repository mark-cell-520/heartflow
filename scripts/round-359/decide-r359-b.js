// r359 decision 第二次：补可区分判据（可行性/后果/风险）后重跑
// 第一次返回 chosen=null + confidence=0（A 0.81 / C 0.82 / B 0.74 分不出高下）
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 补跑上一轮（r358）遗留的 7 项验证并收尾其半成品负例守卫。可行性=高（脚本全部在位，probe-14 已实测坐实完美精确修有对应触发支，守卫 4 个置假点中 P1/P3/P4 已实测 RED，只需补 P2 独立失效面样本）；后果=闭环一处未验证即交接的引擎改动，但零新能力、纯收尾；风险=低（只补验证不改引擎，若发现回归必须回滚 r358 提交）。',
    '[B] 收口 104 个未跟踪文件的 git 卫生。可行性=高（一条 git add scripts/round-*/ 批量命令）；后果=仓库卫生，零能力变化；风险=极低但也没有任何能力收益。',
    '[C] 修 reasoning_coherence 的 2 条漏检。可行性=中（根因已定位一半但修法要动结构评分基线，可能引发双向误拦回归，需要重跑 326 条良性全部）；后果=真正的新辨别能力（伪归因句不再被判优良）；风险=高，可能破坏既有 benign 基线，需具备回滚手段。',
  ].join('\n');

  const r = await d.decide({ task: '选下一轮升级方向（补判据重跑）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
