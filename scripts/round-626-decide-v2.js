// r626 方向选择 v2：第一次 decision 返回 chosen:null（options_indistinguishable）。
// 补可区分的判据：接线难度（需修判空数）+ 与已有 gate 维度的重叠度 + 接通后的可 dispatch 路由数。
// 只写形状与实测数字，不贴任何样本原文（451 纪律）。
'use strict';
const { HeartFlowDecision } = require(require('path').join(__dirname, '..', 'src', 'core', 'decision.js'));

const candidates = [
  '[A] strategicRestraint（战略克制引擎）— 推荐口径\n'
  + '接线难度=最低：7/7 方法零抛，无需修任何判空。\n'
  + '与已有 gate 维度重叠度=零：现有 93 个维度全部判「文本对不对」，本引擎判「这个提案该不该做」，'
  + '无任何现有维度覆盖「不做清单 / 战略克制」。\n'
  + '接通后可 dispatch 路由约 6 条（load/getDontList/evaluate/checkMission/addDont/removeDont/getStats）。\n'
  + '落地后调用方可直接问「这个行动方案是否违反我自己定下的克制边界」。',

  '[B] daoDecision（道决策引擎）\n'
  + '接线难度=最高：4 个方法空参即抛，需先修判空才能接通（工作量翻倍且修 bug 不算真升级）。\n'
  + '与已有维度重叠度=中：evaluate 的决策评估与 existing decision.js 的 decide 语义部分重叠。\n'
  + '接通后可 dispatch 路由约 7 条。',

  '[C] agentCard（代理身份卡）\n'
  + '接线难度=低但价值低：3 个方法，verify 与现有 agent-philosophy 维度主题重叠（都在管「我是谁」的声明）。\n'
  + '接通后可 dispatch 路由约 3 条，且辨别动词仅 1 个。',

  '[D] globalWorkspace（全局工作空间）\n'
  + '接线难度=中：11 个方法零抛，但 disc=0 辨别动词=0 —— 接通的是认知架构而非辨别能力，'
  + '不满足真升级定义①-④中的任何一个。\n'
  + '接通后可 dispatch 路由约 11 条但无判别价值。',
];

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({
    task: '选下一轮升级方向：在「接线难度最低 + 与已有能力零重叠 + 接通后有真实辨别价值」三个判据下选一个',
    prompt: candidates.join('\n\n'),
  });
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
