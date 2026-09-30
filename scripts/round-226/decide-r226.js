// 第 226 轮方向裁决（decision 真调）
const { HeartFlowDecision } = require('../../src/core/decision.js');

const prompt = [
  '[A] badFaithNarrative 英文侧纯断路恢复：实测英文命中率 0/25（25 条英文攻击样本全部放行），20 条中文判据因 early-return 对英文完全失效；改为按 slot 逐条映射英文形态，改动约 60 行',
  '[B] checkStereotype 英文侧耦合族补薄：STER_GROUP_EN 20 项 vs STER_DEROG_EN 15 项且多为单词，实测英文攻击样本命中 3/15，仍缺 12/15；只扩 DEROG/GROUP 词表，改动约 20 行',
  '[C] checkEmptyAnswer 英文侧零正则：EMPTY_ANSWER_PATTERNS.en 无条目，实测英文空回答样本命中 0/12（12 条全部放行）；需新建英文判据集，改动约 30 行',
  '[D] 上一轮遗留同族缺口：checkUnsupportedClaim 英文正则 20 条覆盖 8/16，checkTonePolicing 16 条覆盖 7/16，checkAppealToAuthority 7 条覆盖 6/16，四个维度合计仍缺约 14/64；改正则与词表，改动约 80 行，跨四函数回归面大',
].join('\n');

const criteria = [
  '缺口规模（受影响样本量与覆盖面）',
  '改动代价（改动行数、回归风险）',
  '修复确定性（判据是否已坐实、边界是否清晰）',
  '用户可感知的变化（是否新增可观察能力）',
  '是否为纯断路（相对补薄更难误伤）',
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选第226轮升级方向', prompt, criteria });
  console.log(JSON.stringify({ chosen: res.chosen, composite_: res.composite_, scores: res.scores, ranking: res.ranking }, null, 1));
})();
