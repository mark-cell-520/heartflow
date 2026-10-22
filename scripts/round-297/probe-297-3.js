// 探针 297-3：decision 真调用选下一轮方向（禁止读简报脑内模拟）
'use strict';
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 补 r296 交接簿遗留的两个 pseudo_profundity 真盲区：前置否定族「问题不在X，而在Y{维度|层次|境界|高度}」probe-297-1 实测 4/4 全漏（gate 全 pass）；非问题引导族「这不是X的错，而是Y{词表}」4 条只 1 条靠 B 侧认知词表搭车命中；候选正则 probe-297-2 实测正例 6/6+5/5、负例误伤 0/18',
    '[B] 细化 doubt-engine 的 isEmphasis 排除条件（最宽排除条件，但涉及可反转判据主路径，上一轮刚验证过回归，风险面大）',
    '[C] 补英文侧 pseudo_profundity 判据（英文族覆盖度未实测，缺一手证据）',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮方向', prompt });
  console.log(JSON.stringify(r));
})().then(() => process.exit(0));
