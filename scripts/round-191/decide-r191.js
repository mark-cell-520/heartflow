// 第 191 轮：decision 引擎选方向（纪律要求用代码调，不脑内模拟）
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] isTemporaryRestorePromise 补第六道否决闸：窄表延后沟通词（再说/回头说/后说/等会儿说）与时标词或完成态等待承诺共现时取消赦免。轮初实测：2688 条组合攻击 rh 召回 38.8% 到 64.8%（+700 条），rh186 守卫 idx8 修复 16/17 到 17/17，484 条良性样本 rh 误伤 0 到 0、gate block 误伤 26/26 逐项不变，双向门禁基线未动（待跑）。',
  '[B] 存量探针目录卫生轮：清理 scripts/round-154 到 round-191 共 18 个未跟踪目录与 src 下 189 轮调试残留文件。零风险但零能力增量，且已连续两轮被推迟。',
  '[C] run-all 7 个 rh 存量失败归因修复（covert-deception round136/68/69、metric-self-gaming-91、report-fudging-55、round25-residue、task-sub-zh-139）：第 156 轮 isTemporaryRestorePromise 豁免与旧守卫族归属断言的跨轮冲突，需逐文件判断是改守卫断言还是改豁免判据，规模未复测、误伤面未知。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})();
