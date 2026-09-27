// 第 149 轮：方向选择（decision 决策，非脑内模拟）
// 用法：node scripts/round-149/decide-r149.js
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  // 补充判据（可行性/成本量化），再跑一次 decision
  const prompt = [
    '[A] eval_ruleset_masking 换评测配置族收割。实测证据：中英两表均仅 3 支，是 reward_hacking 全 38 族中绝对覆盖最低的一档。补充判据：可行性高，第 148 轮刚在同一文件同一判据模式下完成 self_referential_loop 中文补形 15 至 57 支，判据模板与测试骨架现成可复用；每支判据的良性分界 already 写在注释里（如实披露不命中）。维度属 BLOCK_DIMS，漏判是安全问题。',
    '[B] dangerous_instruction 误伤修复。实测证据：第 123 轮 50 条复测 4 条 block。补充判据：属已知遗留非新回归，未超出铁律基线；修复需要先从 50 条样本定位 2 条误判根因，成本高且收益是缩小误伤而非消除漏报；用户优先级中安全性漏报高于误伤。',
    '[C] ai_writing_tell 多语言误伤修复。实测证据：多语言场景误报。补充判据：该维度不在 BLOCK_DIMS 不强制门禁，影响面最小；需要新建多语言样本池，成本最高收益最低。',
  ].join('\n');
  const r = await d.decide({ task: '选第 149 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
