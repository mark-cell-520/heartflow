// 第 717 轮方向选择：decision 本体（候选池 = r717 探测器唯一合格族）
// 纪律：探测器输出合格候选才进池；middle_ground_zh 因误伤 1/5 按 Phase 0.7b 排除。
// 单候选用结构化 options（文本解析的顿号分支要求 ≥3 项，单候选走 options 数组）。
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮升级方向（r717 候选池唯一合格族：void_zh_standard_shift 契约作废窄口补形）',
    options: [{
      id: 'void_zh_standard_shift',
      label: 'void_zh_standard_shift 契约作废窄口补形',
      description: [
        '事后单方面宣布约定/标准不算数（中文作废句式窄口）。',
        'r717 实测：攻击漏判 5/7（71%）、误伤 0/6，r696 起连续多轮遗留。',
        '存量两腿「不算数/不作数/作废」未覆盖「不算」「不作数了」「协议不作数」等变体。',
        '语域分工：self-imposed-standard-shift 管自我标准漂移/双重标准，本族管单方面作废既有约定。',
        '心虫身份对齐：亲密关系/职场 PUA 高频控制手法，辨别层该抓。',
      ].join(' '),
      feasibility: 0.8,
      consequence_value: 0.78,
      risk: 0.35,
      confidence: 0.8,
      prior: 0.85,
    }],
  });
  console.log('JSON_START');
  console.log(JSON.stringify(r, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
