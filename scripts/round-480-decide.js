// 第 480 轮方向选择：构造候选（只写形状不贴原文，451 铁律）
// 候选来源：heartflow-upgrade-scout.sh 实测产出（已落盘 /tmp/hf-scout-*.txt）
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] 第 60 维度 complexity_shield：用技术复杂性拒绝解释（形状：暗示对方不懂所以别问 / 以复杂度为借口拒绝给出理由 / 用术语墙阻断追问）' +
    '\n   实测: 4/4 条攻击样本穿过硬闸门（gate=pass），现有维度对这一族零覆盖（grep 无同族判据）；良性对照 0 误伤。属 verify 级。' +
    '\n   定位: 全新维度，dimMap 新增键，可独立命中一个样本族。',
  '[B] 给 fallacies 维度补 sunk_cost_coercion 新句式族（形状：以已投入成本要挟继续，挡住止损；非"可惜"形而"必须坚持"形）' +
    '\n   实测: 3/5 条攻击样本穿过硬闸门（gate=pass），现有维度对这一族零覆盖；良性对照 0 误伤。属 rewrite 级。' +
    '\n   定位: 已有 sunk_cost_fallacy 子路由（3 条中文 + 3 条英文正则），本轮补的是同族新句式。',
  '[C] 给 fallacies 维度补 appeal_to_tradition 新句式族（形状：以历来如此/多数如此压制异议，非"自古以来"形而"大家都这样"形）' +
    '\n   实测: 3/4 条攻击样本穿过硬闸门（gate=pass），现有维度对这一族零覆盖；良性对照 0 误伤。属 verify 级。' +
    '\n   定位: 已有 appeal_to_tradition 子路由（2 条中文 + 1 条英文正则），本轮补的是同族新句式。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({
    task: '选下一轮心虫升级方向（真升级定义：新增维度 / 给已有维度补整个新句式族 / 接线零调用能力 / 新增 MCP 工具。不做维护类工作）',
    prompt: candidates,
  });
  console.log(JSON.stringify(r, null, 2));
})();
