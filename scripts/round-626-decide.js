// r626 方向选择：从当前真实未接线实例里选一个接进 pipeline。
// 候选来自 scripts/round-604-unwired-probe.js 实测（/tmp/r626-unwired-raw.txt）。
// 只写形状与实测数字，不贴任何样本原文（451 纪律）。
'use strict';
const { HeartFlowDecision } = require(require('path').join(__dirname, '..', 'src', 'core', 'decision.js'));

const candidates = [
  '[A] strategicRestraint（战略克制引擎）\n'
  + '实测（round-604-unwired-probe v3，本轮复跑）：n=7 方法，zeroThrow=7/7 全零抛，mcp=0 处引用，src=11 处源码引用，'
  + 'disc=2(zero:2) 辨别动词=[evaluate, checkMission]，另有 getDontList/addDont/removeDont/load/checkMission。\n'
  + '能力形状：加载「不做清单」+ 评估一个提案是否触犯清单 + 任务使命核对。对辨别者是「该不该做」的判别层，'
  + '与现有 gate 的「这段文本对不对」正交。',

  '[B] daoDecision（道决策引擎）\n'
  + '实测：n=7 方法，zeroThrow=3，throw=4（半数方法空参会抛），mcp=4 处引用，src=0 处引用，'
  + 'disc=5(zero:1) 辨别动词=[evaluate, check, assess, resolve 等]，零抛的辨别方法仅 1 个。\n'
  + '能力形状：evaluate 决策评估 + 统计与重置。接通需先修 4 处判空。',

  '[C] agentCard（代理身份卡）\n'
  + '实测：n=3 方法，zeroThrow=3/3，mcp=0，src=0，disc=1(zero:1) 辨别动词=[verify]，另有 loadOrCreate/getCard。\n'
  + '能力形状：身份卡加载/创建/校验。与现有 agent-philosophy 维度主题相邻，可能重叠。',

  '[D] globalWorkspace（全局工作空间）\n'
  + '实测：n=11 方法，zeroThrow=11/11，mcp=0，src=1，disc=0 辨别动词=0。\n'
  + '能力形状：多代理广播竞争 + 整合思想 + 共识摘要。属认知架构层，无直接辨别动词。',
];

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({
    task: '选下一轮升级方向：把一个声明了但从未被 dispatch 调用过的能力真正接进 pipeline',
    prompt: candidates.join('\n\n'),
  });
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
