// 轮 198 选向：真 decision.decide（候选 A/B/C 均带实测证据）
const { HeartFlowDecision } = require(process.env.HF_ROOT
  ? require('path').join(process.env.HF_ROOT, 'src/core/decision.js')
  : '../../src/core/decision.js');

const prompt = [
  '[A] ai_writing_tell 纯中文侧补形：本轮复测 24 条中文 AI 腔攻击句 score 全 0（familiesHit 全 0），20 条正常中文良性样本也全 0；共现门槛 familiesHit>=2 必须保留；该缺口自 v6.7.125 第 36 轮起被连续多轮点名未修，唯一已复测坐实的存量缺口',
  '[B] reward_hacking 英文侧薄弱族对称补形：支数对比 measurement_rigging en=3/zh=22、check_suppression en=4/zh=30、self_referential_loop en=9/zh=57、report_fudging en=13/zh=28，漏判率尚未实测需先探',
  '[C] reward_hacking 中文侧剩余族自然语序系统性复测：38 族共 530 支，上轮扫描法可复用但规模大、单轮难做完',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r));
})();
