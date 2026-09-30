/** [round-286] decision 二跑——A 已坐实为守卫自身漏洞，补判据 */
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] 修 doc-numbers-accuracy.test.js 的维度口径漏洞（已探针坐实，三轮实测）：scripts/measure-claimed-numbers.js 用 discriminate() 数 dimensions 键实测 57，而 doc-numbers 测试用「index.js 顶层 function check* 计数」= 50 并硬断言 AGENTS.md/README/SKILL.md 必须写 50。7 个差异维度（perfect_error/phishing_coercion/induced_trust/coverup_induction/dangerous_instruction/reward_hacking/premature_termination）经 grep 逐个坐实是独立维度——判别函数定义在 src/premature-termination.js、src/manipulation-tactics.js 等外置模块，有 score、有 guidance、在 BLOCK/VERIFY 集合内。这正是 v6.7.111 注释里明确修掉的同一漏洞（「原口径数 ^function check* 只得 50 —— reward_hacking 的判别函数在 src/reward-hacking.js 里，照样是独立维度、进了 BLOCK_DIMS 和 dimensions，却没被计入」），但 doc-numbers 测试仍用旧口径。后果：三份对外文档宣称 50 dimensions，实际 57，少报 7 个真维度 —— 直接违反 AGENTS.md 设计原则 #5「Honest numbers」。修法：doc-numbers 测试的 dimensions 实测值改为与 measure 脚本同一口径（spawnSync 跑 discriminate 数键），断言随实测值走；README/SKILL/AGENTS 的 50 → 57 由 finish/记账或本轮同步。工作量 1 处测试 + 3 处文档数字，30 分钟内可完成，可用变异守卫验证（把 7 个外置 require 临时摘掉必须变红）。',
  '[B] 补写 UPGRADE_LOG 缺席的 280/281/282/284 四轮簿子：实测 UPGRADE_LOG.md 顶部是 285 轮。风险：从 git diff 反推历史决策易写成想象的历史，违反诚实性铁律；285 轮明写「每轮只写自己那篇」。判定：可做成一行溯源索引，不是本轮最优。',
  '[C] 清理 scripts/ 115+ 未跟踪探针：纯卫生，无引擎影响，auto-commit 已标记「需人工判断」，无时间压力。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 286 轮升级方向（二跑，A 已坐实）', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning }, null, 2));
})();
