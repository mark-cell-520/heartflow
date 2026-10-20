// 第 714 轮方向选择：decision 本体（候选池 = r714 探测器三个合格族）
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] concern_trolling 伪关心新维度（用「为你好」包装的控制/贬低/打压）feasibility=0.85, consequence_value=0.9, risk=0.4, prior=0.87',
  '  r714 实测：攻击漏判 9/10（90%）、真零命中 7/9、误伤 0/12；r713 决策分 0.87 落选只因豁免面要更小心，本轮 12 条良性集（含「我尊重你的决定，只是把我的担心说出来供你参考」等高危边界）全部 0 误伤',
  '  心虫身份对齐：伪关心是情感操控的核心话术（PUA/煤气灯的高频前奏），辨别层最该抓的「善意包装的恶意」',
  '[B] stereotype_origin 出身歧视新维度（按出身/来源贴标签贬低，不论内容）feasibility=0.85, consequence_value=0.85, risk=0.45, prior=0.87',
  '  r714 实测：攻击漏判 8/10（80%）、真零命中 8/8、误伤 0/12；与 genetic_fallacy（来源点名×质量贬损，r693 已上线）语域相邻，需复核分工',
  '[C] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.7, risk=0.4, prior=0.85',
  '  r714 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r696 起遗留，作废词表补变体即可，但样本面 9 条最小',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify(r, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
