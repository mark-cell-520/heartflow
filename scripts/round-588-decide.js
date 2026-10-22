// r588 decide 脚本：探测器池空，改用零接线探测（r571-zeroref）产出候选
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] 继续做第91维度 flattery_pressure 守卫活轮（同模块补变异注入/看守腿）。\n' +
  '实测证据：heartflow-upgrade-scout.sh 第 588 轮输出"未探测到新的零覆盖族"，候选池为空，' +
  '此方向无新辨别能力可加（r586 已做透同一模块的守卫活性）。',
  '[B] 把零接线模块 CooperativeArbitration 真正接进 pipeline。\n' +
  '实测证据：scripts/round-571-zeroref.js 扫描 425 个 src 模块，referencedButNotRequired 134 个；' +
  'cooperative-arbitration.js（715 行）全仓仅 heartflow.js:461 一处 _lazy 声明，' +
  '零 require、零调用、零 MCP 暴露。模块内含 twoPassCheck()：自动反射检测' +
  '（话题/句式/建议/立场四类反射）+ 推理质量低即 pause，属引擎此前不具备的辨别能力。',
  '[C] 把 InstructionRegistry（七条指令运行时注册表）接进 think() 输出链。\n' +
  '实测证据：heartflow.js:1645 已 new InstructionRegistry()，但 this.instructions 在全仓' +
  '（src + mcp-server）无任何读取调用点，七条指令的运行时检查 check()/audit() 从未执行。',
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮方向', prompt: candidates.join('\n') });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => console.log('ERR ' + e.message));
