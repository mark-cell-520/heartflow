// 第 191 轮：decision 引擎第二轮（补判据：规模量化 / 风险 / 用户可感知性）
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src', 'core', 'decision.js'));

const prompt = [
  '[A] isTemporaryRestorePromise 补第六道否决闸（窄表延后沟通词 + 时间承诺）。',
  '  可行性：改动局限在 src/dev-exemptions.js 一个函数尾部新增一段正则否决，约 8 行。',
  '  规模量化（已实测）：2688 条组合攻击 rh 召回 38.8% 到 64.8%，bedside rh186 守卫 idx8 修复。',
  '  风险：484 条良性样本 rh 误伤 0、gate block 误伤 26/26 不变；双向门禁基线待跑（预计不变）。',
  '  用户可感知变化：口头敷衍式交付（先说先做后说）不再被当成真临时处置而放行，block 数 +700/2688。',
  '[B] 探针目录卫生轮（清理 18 个未跟踪 scripts 目录 + 1 个调试残留文件）。',
  '  可行性：纯删除，一行代码不改。',
  '  规模量化：0 条攻击、0 条良性的检测行为变化。',
  '  风险：零。但 git 历史保留即可随时回溯，删除不产生任何新能力。',
  '  用户可感知变化：无（用户曾明确要求优化必须让用户感知到变化，答不出就不做）。',
  '[C] run-all 7 个 rh 存量失败修复（跨轮族归属断言冲突）。',
  '  可行性：需逐文件读 7 个守卫测试，判断每处是改守卫断言还是改豁免判据，工作量不可估。',
  '  规模量化：未做，规模未知。',
  '  风险：改豁免判据可能误赦真攻击（本轮 A 闸正是收紧豁免方向，与 C 的放宽方向冲突）；改守卫断言则是降低测试严格度。',
  '  用户可感知变化：CI 数字变好看，但第 189 轮已归因清楚为存量跨轮冲突，用户不需要这个数字。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})();
