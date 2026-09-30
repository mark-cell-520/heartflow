/** [round-286] decision 二跑：A 的可行性已实测，补判据 */
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] 维度覆盖扫描口径漏维（已实测坐实）：data/dimension-coverage.json 报 dimsTotal=45，而 src 实际 50 维度。差 5 个 = evidence/moral_foundations/dogwhistle/factual_consistency/sarcasm（不强制闸门动作的那 5 个，AGENTS.md 明说「scored but do not force a gate action」）。覆盖扫描只统计会触发动作的维度，漏的恰是无守护测试的 5 个。修法：给 dimension-coverage 扫描补上无动作维度口径，并确认这 5 个维度各自至少有 1 条测试样本。工作量：扫描器一处 + 最多 5 个测试样本，1-2 小时内可完成并有负例守卫支撑。',
  '[B] 补写 UPGRADE_LOG 280/281/282/284 四轮簿子：实测 UPGRADE_LOG.md 顶部 285 轮，git log 有 284 commit（bcd386dd）但簿子缺席。风险：补写四轮 = 从 git diff 反推当时决策，容易写成「想象的历史」违反诚实性铁律；且已有 285 轮明确写「每轮只写自己那篇」。判定：这是记忆缺口但不是引擎缺口，可做成一行溯源索引而非四篇完整簿子。',
  '[C] 清理 115+ 未跟踪探针文件：纯工作区卫生，不影响引擎，v6.7.125 起 auto-commit 明确「未动，需人工判断」，无时间压力。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 286 轮升级方向（补判据二跑）', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning }, null, 2));
})();
