// 第 183 轮 decision：三候选，用代码调，不脑内模拟。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '[A] reward_hacking covert_deception 中文侧尾变体补形：第 183 轮实测 10 条构造样本 0 条被 rh 命中（3 条被其他维度 block，7 条 gate 全 pass）。判据形状已在 round-154 探针定位（A2 追责收网词/A5 无收网词破坏形/A6 对象后置/A12-13 动词词尾），154/155 两轮做过同族补支，域内熟，改动可逐条删条验证。',
  '[B] dangerous_instruction 控制组漏 block：183 轮实测 4 条控制组良性攻击只 block 3 条，1 条漏（待定位是超范围行为还是误伤修过头）。修控制组漏放属于安全底线，优先于收割。',
  '[C] rh 剩余 6 类英文侧对称探针（第 123 轮待办，已 60 轮未动）：批量构造 6 类英文样本测命中率，缺口坐实则可批量收割。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 183 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().then();
