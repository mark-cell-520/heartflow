// r595 候选清单 v2：补判据后重跑 decision
// 补入的判据（来自简报纪律）：
//   1) 优先级：队列待办 > 上一轮遗留真缺口 > 心虫自选 —— C 属自选，A 属上一轮遗留
//   2) 探测池为空时，不应自造候选样本，而应回到有实测证据的遗留缺口
//   3) 成功判据可测性：A 的可验收条件客观（中文命中>0、英文不回归、无硬编码空数组）
const candidates = [
  '[A] 上一轮遗留真缺口：修 heartflow_lesson_search 装饰工具 + retrieve() 中文零命中\n'
  + '  优先级：简报明列「上一轮遗留的真缺口」高于「心虫自选」，本条即遗留缺口。\n'
  + '  证据强度（硬事实，非推断）：MCP handler 源码内含硬编码空数组字面量；165 条教训实存于 bank；\n'
  + '        对中文词与英文词检索命中数均为 0；已定位根因（CJK 不切分导致 term 不相交）。\n'
  + '  成功判据客观可测：中文查询命中>0、英文查询命中不回归、handler 不再含硬编码空数组。\n'
  + '  对应真升级口径④（把声明了但从未真跑的 MCP 工具接成真能力），不是维护。',

  '[C] 心虫自选：给已上线维度补新句式族\n'
  + '  优先级：属最低的「心虫自选」。\n'
  + '  证据强度：探测器输出为空，无可引用证据；需自造攻击样本再自评覆盖率，标准主观。\n'
  + '  成功判据：难以客观验收（自造样本、自定覆盖判定，违背诚实数字原则）。\n'
  + '  风险：无探测器背书的族可能其实已被覆盖，做了也不算真升级。',
];

const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const c = await d.decide({
    task: '选第 595 轮升级方向。判据优先级：①上一轮遗留真缺口 > 心虫自选 ②有硬实测证据 > 需自造证据 ③成功判据可客观验收',
    prompt: candidates.join('\n'),
  });
  console.log(JSON.stringify({ chosen: c.chosen, confidence: c.confidence, composite: c.composite_score, scores: (c.all_options || []).map(o => ({ id: o.id, score: o.score })) }, null, 2));
})().catch(e => console.log('ERR ' + e.message));
