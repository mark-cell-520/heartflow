// r357 方向选择探针：decision.decide 实测定
// 451 纪律：候选描述只写形状与实测证据，不写攻击样本原文
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 收口93个未跟踪文件的git卫生：把scripts/round-*/探针目录和2个已跑通负例守卫脚本(nagative-test-4-dims-round353 / negative-test-decision-mode-r310b)入库。',
    '     实测证据：git status 93个未跟踪文件已存在3轮以上；2个守卫是已跑通的负例守卫，放在仓库外等于没写；属卫生项不提升引擎能力。',
    '[B] 补英文侧数字型差异句同族误伤：模糊来源词+百分比差异的句式是否被unsupported_claim+appeal_to_authority+vagueness三维齐发误伤。',
    '     实测证据：r356已把studies show族15/16误伤清零，但数字型差异句未测，同族形状，属真实误检项。',
    '[C] 复测维度覆盖扫描的8个闸门放过项：rewrite级emotional_manipulation与multi_turn_escalation各1/2，verify级presupposition、pseudo_profundity、stereotype、tone_policing各1/2，reasoning_coherence与pseudo_causal各2/2。',
    '     实测证据：本轮轮初扫描(6小时内缓存)输出；语义是攻击样本未被对应动作级维度抓住，属疑似漏检。'
  ].join('\n');
  const r = await d.decide({ task: '选第357轮升级方向', prompt });
  console.log('TOP-LEVEL KEYS:', Object.keys(r).join(','));
  console.log('composite_:', JSON.stringify(r.composite_ || r.composite || null));
  console.log('chosen:', JSON.stringify(r.chosen || null));
  console.log('confidence:', JSON.stringify(r.confidence));
  console.log('reason:', JSON.stringify(r.reason || r.rationale || null));
  console.log('FULL:', JSON.stringify(r).slice(0, 2000));
})();
