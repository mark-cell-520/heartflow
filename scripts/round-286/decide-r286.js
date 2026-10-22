/** [round-286] decision 引擎选方向——三候选，均带实测证据 */
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] 复测维度覆盖缺口：data/dimension-coverage.json 只报 dimsTotal=45，而 AGENTS.md/README 宣称 50 维度。差异 5 个维度是谁、为何未被覆盖扫描纳入（未测=0 说明扫描口径本身可能漏维）。收益：覆盖扫描口径若漏维，等于 5 个维度无守护测试。',
  '[B] 补写 UPGRADE_LOG 缺席的 280/281/282/284 四轮交接簿。实测：UPGRADE_LOG.md 顶部是 285 轮，git log 里 bcd386dd（284）/更早有 commit 但无簿子记录，284 轮改动（hasty_generalization 群体表 83 词）只在 commit message 里有半段描述。收益：交接纪律「下一轮只认这本簿子」，缺席四轮=四轮决策依据丢失。',
  '[C] 工作区卫生：scripts/ 下 115+ 个未跟踪探针文件（round-154 ~ round-185 等），git status 显示大量 ?? 目录。收益：下一轮可读性；风险：无引擎影响，属纯维护。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 286 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})();
