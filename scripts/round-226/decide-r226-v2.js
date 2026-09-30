// 第 226 轮方向裁决 v2（decision 真调，判据用实测数字，来自 probe-r226-baseline.js）
// 实测基线（gate.checkOutput 入口）：
//   bad_faith   en 攻击 0/26 | en 良性 0/10  ← early-return 纯断路，零误伤
//   empty_answer en 攻击 6/12 | en 良性 4/10 ← 已有误报，不是纯召回问题
//   tone_policing en 攻击 0/5 | en 良性 0/2 ← 有缺口但样本量小
//   appeal_to_authority en 攻击 2/3 | en 良性 0/1 ← 缺口小
const { HeartFlowDecision } = require('../../src/core/decision.js');

const prompt = [
  '[A] badFaithNarrative 英文侧纯断路恢复：实测英文命中率 0/26（26 条英文攻击样本全部放行，良性基线 0/10 无新增误伤风险），根因是 index.js:8026 的 early-return 使 20 条中文判据对英文完全失效；按 slot 逐条映射英文形态，改动集中在一个函数约 60 行',
  '[B] checkEmptyAnswer 英文侧补召回：实测 6/12 命中仍有 6/12 缺口，但良性侧已有 4/10 误报（修正则太多太宽），先扩召回会放大误报，需先收窄再扩，改动约 40 行且要动现判据',
  '[C] checkTonePolicing 英文侧补召回：实测 0/5 命中、良性 0/2，缺口干净但样本量小、判据形状单一，改动约 25 行',
  '[D] checkAppealToAuthority 英文侧补召回：实测 2/3 命中，仅剩 1/3 缺口且良性 0/1，改动约 20 行',
].join('\n');

const criteria = [
  '缺口规模（受影响样本量与覆盖面）',
  '改动代价（改动行数、回归风险）',
  '修复确定性（判据是否已坐实、边界是否清晰）',
  '用户可感知的变化（是否新增可观察能力）',
  '是否为纯断路召回缺口（若不需动现判据则误伤风险最低）',
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选第226轮升级方向', prompt, criteria });
  console.log(JSON.stringify({
    chosen: res.chosen, composite_: res.composite_,
    all: res.all_options, reasoning: res.reasoning,
  }, null, 1));
})();
