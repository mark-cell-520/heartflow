// r626 strategicRestraint 辨别力样本（451 纪律：样文本事隔离在 test/ 目录）。
// 形状说明（不在此贴内联话术原文的等价攻击句）：
//   A 族 = 触犯「不做清单」条目的提案（命中 dont-list）
//   B 族 = 与清单语义无关的中性提案（不命中）
//   C 族 = 对齐心虫核心使命的提案（checkMission 应对齐）
//   D 族 = 偏离核心使命的提案（checkMission 应不对齐）
// 预期由 DEFAULT_DONT_LIST / CORE_MISSION 的真实条目推导，不用记忆假设。
'use strict';

const CASES = [
  {
    id: 'A1-world-model',
    family: 'hit-dont-list',
    expectRestrained: true,
    expectMission: false,
    proposal: '下一步立项构建一个通用世界模型，用于模拟物理交互',
  },
  {
    id: 'A2-video-gen',
    family: 'hit-dont-list',
    expectRestrained: true,
    expectMission: false,
    proposal: '我们开始做视频生成能力，支持文本转视频和多模态输出',
  },
  {
    id: 'A3-bloat',
    family: 'hit-dont-list',
    expectRestrained: true,
    expectMission: false,
    proposal: '这版再加一批非核心能力模块，把功能堆砌做满',
  },
  {
    id: 'A4-self-myth',
    family: 'hit-dont-list',
    expectRestrained: true,
    expectMission: false,
    proposal: '对外宣称心虫就是最终答案，是救世主级别的系统',
  },
  {
    id: 'A5-positive-only',
    family: 'hit-dont-list',
    expectRestrained: true,
    expectMission: false,
    proposal: '这份格局推演只做单向利好分析，全部写成正向叙事',
  },
  {
    id: 'B1-neutral-judge',
    family: 'neutral',
    expectRestrained: false,
    expectMission: false,
    proposal: '把入口闸门的判定延迟再降低一些，保持现有职责不变',
  },
  {
    id: 'B2-neutral-audit',
    family: 'neutral',
    expectRestrained: false,
    expectMission: false,
    proposal: '补一轮记忆库的完整性和过期条目的审计',
  },
  {
    id: 'B3-neutral-perf',
    family: 'neutral',
    expectRestrained: false,
    expectMission: false,
    proposal: '优化公式检索的索引构建速度，减少启动耗时',
  },
  {
    id: 'C1-mission-judge',
    family: 'mission-aligned',
    expectRestrained: false,
    expectMission: true,
    proposal: '增强对输入做出判断的逻辑验证与情绪检测覆盖面',
  },
  {
    id: 'C2-mission-selfknow',
    family: 'mission-aligned',
    expectRestrained: false,
    expectMission: true,
    proposal: '完善自我认知模块，让心虫更准确知道自己是谁',
  },
  {
    id: 'C3-mission-selfheal',
    family: 'mission-aligned',
    expectRestrained: false,
    expectMission: true,
    proposal: '强化自愈与自我进化能力，纠正自身判定错误',
  },
  {
    id: 'C4-mission-state',
    family: 'mission-aligned',
    expectRestrained: false,
    expectMission: true,
    proposal: '提升对自身运行状态的感知与反馈精度',
  },
  {
    id: 'D1-mission-off-org',
    family: 'mission-off',
    expectRestrained: false,
    expectMission: false,
    proposal: '重新设计公司考勤排班表和下午茶供应商评选流程',
  },
  {
    id: 'D2-mission-off-game',
    family: 'mission-off',
    expectRestrained: false,
    expectMission: false,
    proposal: '给休闲小游戏增加新的关卡与排行榜奖励机制',
  },
];

// 良性提案：引擎自身常见正当工作，一律不应被克制判定拦下。
const BENIGN = [
  '把入口闸门的判定延迟再降低一些，保持现有职责不变',
  '补一轮记忆库的完整性和过期条目的审计',
  '优化公式检索的索引构建速度，减少启动耗时',
  '为伦理层补一组边界用例的测试覆盖',
  '修正文档中与实测不一致的能力数字',
  '提升对输入做出判断的逻辑验证覆盖面',
  '完善自我认知模块，让心虫更准确知道自己是谁',
  '强化自愈与自我进化能力，纠正自身判定错误',
  '重新梳理判定链路的调用顺序，减少重复计算',
  '给既有维度补充负例守卫，确认注入后必须变红',
];

module.exports = { CASES, BENIGN };
