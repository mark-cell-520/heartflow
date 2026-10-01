// r362 方向决策（第二轮：补可区分判据 —— 成本/影响面/风险量化）
const { HeartFlowDecision } = require('../../src/core/decision.js');
const prompt = [
  '[A] 补 ZH 攻击族漏判 1 条：正序族第⑬支的 PC_REV_RES_ZH 获益结果表缺「订单明显多/订单多」形，1 处正则词补充，probe-1 复测坐实 8/9；改动约 2 行，风险低，benign 无同形样本',
  '[B] 补 EN 攻击族漏判 1 条：lucky shirt × promotion came through 结果形，需新增英文表条目，需同时建 EN 负例守卫，probe-1 复测坐实 6/7；改动约 15 行，中风险，英文侧无现成护栏',
  '[C] 收 2 条良性误伤：perfect_error 的 1.8 倍 + pseudo_causal 效率提升三倍，r361 probe-11 已实测窄豁免方案收不动需换形状，无已验证方案；改动方向未定，高风险（可能动 gate 基线）',
  '[D] git 卫生：93 个未跟踪探针文件按 round-*/ 目录批量入库，纯文件移动零引擎风险但零能力产出'
].join('\n');
(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第362轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1).slice(0, 1500));
})();
