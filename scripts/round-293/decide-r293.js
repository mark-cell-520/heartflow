/** r293 方向决策：真调 decision */
const path = require('path');
const { HeartFlowDecision } = require(path.resolve(__dirname, '..', '..', 'src', 'core', 'decision.js'));

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选第293轮方向',
    prompt: [
      '[A] 批量修 doubt-engine 53 处否定类半角缺口（[^，。]->[^，。,.]）：实测函数层 4/10 候选分裂（全角命中 hedge/rewrite、半角折叠后 pass），管线入口 NFKC 折叠是 r291/r292 已坐实的根因；修法同族已在 r292 验证 gate 级 0 影响 0 回归',
      '[B] 只修函数层实证分裂的 7 处（doubt-engine 31/37/39/45/132/133/177），风险最小但覆盖不到其余 46 处理论缺口',
      '[C] 架构层统一：在 doubt() 入口做形态归一化，让 53 处判据一次性回归书写形态，不动单个正则；但会改变引擎归一化策略，r292 明确论证过不该动归一化',
      '[D] 转去修 index.js 剩余约 88 处跨形态缺口（静态清单已有，未做函数层筛选）',
    ].join('\n'),
  });
  console.log(JSON.stringify(r, null, 2));
})();
