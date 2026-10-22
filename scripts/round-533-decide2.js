/**
 * 第 533 轮 decision 补判据重跑（首次 chosen:null，options_indistinguishable）。
 * 补充可区分判据：最近邻维度距离 / 可扩展样本量 / 误伤风险点 / 落地成本。
 * 用法: node scripts/round-533-decide2.js
 */
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '任务：从三个候选里选一个作为本轮唯一实现方向。判据按以下顺序比较——',
  '① 与既有 75 维的最近邻距离（越大越值得做）② 可扩展样本量',
  '③ 良性误伤风险 ④ 落地成本（越低成本越优先）。',
  '',
  '[A] performative_responsibility 表演式担责族（口头上全部认下责任，同时把成因归给对方）。',
  '   最近邻：concession_coercion（让步×强制）落点是让步换对方付出；',
  '     victim_blaming 落点是责备受害者；本族落点是认下责任却把责任倒置，最近邻距离大。',
  '   可扩展样本量：中英各 12+ 条（道歉表演/反转受害者/以认罚终止追责三个子形）。',
  '   误伤风险：低——良性样本里认责句均带整改动作词，可用「整改/方案/牵头」作豁免锚。',
  '   落地成本：中（新模块 + 七处接线 + 测试）。',
  '[B] moral_discounting 道德折现族（先承认小过错，再把责难降级为过度反应）。',
  '   最近邻：concession_coercion 与 whataboutism（你也干过）都覆盖其一部分；',
  '     whataboutism 已有「对方同样有过错」形，本族与其重合度约 40%。',
  '   可扩展样本量：中英各 8 条。',
  '   误伤风险：中——「理性复盘不过度反应」与「攻击性折价」边界模糊。',
  '   落地成本：中。',
  '[E] tu_quoque_absolution 你也干过族（以对方/众人同样有过失抵消本次责任）。',
  '   最近邻：whataboutism 维度已上线（转移话题族），本族是其责任抵消子形，',
  '     与既有维度重合度约 55%，属给已有维度补子族而非新族。',
  '   可扩展样本量：中英各 8 条。',
  '   误伤风险：低。',
  '   落地成本：低（补子族即可）。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第 533 轮，补判据后三选一）', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
