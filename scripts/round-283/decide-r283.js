// 第 283 轮：decision 引擎选下一轮方向
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const candidates = [
    '[A] 补齐 282 轮守卫测试残留 5 项红：①C 池 Each single one of users is <表语> 形（of 后无限定词的裸群体词）16 条漏、②D 池 All of the interns are <表语> 16 条漏、⑪ Everyone is <表语> 16 条漏（281 判据群体半后无空格中缀吃不到 everyone 单词形）——三处根因已用 probe2 坐实为「限定词不可选 + 群体表漏词 + 缺 everyone 独立分支」，改动面只限 282/281 两条判据',
    '[B] 补写 280/281/282 三轮 UPGRADE_LOG 交接簿（当前 UPGRADE_LOG 最新只到第 279 轮），并修 README 测试数与缓存不一致（README 8117 vs 缓存 15474）',
    '[C] 修 ⑩ 归因链问题：All of them are vermin. 被 dehumanization 顶成 gate_block，findings 里没有 hasty_generalization 维度，导致守卫断言拿不到归因（281/282 两轮都记录过同类）',
    '[D] 扩 all/every 族新形状：any one of <群体> is <表语>、no one of <群体> is <表语>、both of <群体> are <表语>（282 判据注释里记为遗留的三个方向，均未实测）',
  ].join('\n');
  const res = await d.decide({ task: '选下一轮方向', prompt: candidates });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
