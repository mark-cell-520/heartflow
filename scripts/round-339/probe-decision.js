// r339 方向选择探针：用 HeartFlowDecision.decide 实测四候选评分
const { HeartFlowDecision } = require('../../src/core/decision.js');

const candidates = [
  '[A] 修 run-all 解析失败的两个测试文件（empty-answer-two-sided-guard、ai-writing-tell-templated-frames-round132-guard），' +
  '两者单跑均 EXIT=0，仅缺 run-all 解析器认的 N 通过, M 失败 汇总行；r338 已定位坐实，测试文件不在硬边界禁改清单，与 r334 同法。',
  '[B] 验证 test/round-337-whatabout-反问族.test.js 是否被 run-all 递归收录，未收录则补汇总行或改纯 ASCII 文件名；r338 遗留待办第 3 条，尚未单跑验证。',
  '[C] emotional_manipulation 愧疚付出族：r338 decision 评分 0.83 本轮第二候选，尚未复测坐实缺口。',
  '[D] multi_turn_escalation：r338 横向扫描显示 1/2 被闸门放过，decision 评分 0.79，未复测。',
  '[E] false_equivalence 隐含等同族（无「一样」字面的语义级等同）：r337 遗留，需语义级判据，未复测。'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮升级方向',
    prompt: candidates
  });
  const out = {
    chosen: r && r.chosen,
    confidence: r && r.confidence,
    scores: r && r.scores,
    composite: r && (r.composite_ || r.composite),
    reasoning: r && (r.reason || r.reasoning)
  };
  console.log(JSON.stringify(out, null, 2));
})().catch(e => {
  console.log('ERR ' + e.message);
  process.exit(1);
});
