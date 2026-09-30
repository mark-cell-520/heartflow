// 第 283 轮二跑：补判据（可行性/后果/风险）后的 decision
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const candidates = [
    '[A] 补 282 判据群体表 intern 等漏词 + C 判据限定词可选化 + 281 判据加 everyone/everybody 直连系动词独立分支；可行性：probe2/probe3 已逐条坐实三处正则缺口，改动限两条判据、约 4 处小改，风险：可能新增良性误伤，需跑 326 条门禁基线核对（上限 302）；后果：82 守卫测试 15 组全绿、282 轮真正收口',
    '[B] 先补 280/281/282 三轮 UPGRADE_LOG 交接簿 + 同步 README 测试数；可行性：纯写文档，零引擎风险，但撞硬边界「不写 README.md」——README 数字只能由 upgrade-engine 记账自动改，本轮改不动；后果：交接恢复连续，但 283 轮本身产出仍是零 commit',
    '[C] 修 ⑩ 归因链（All of them are vermin. 被 dehumanization 顶成 gate_block 后 findings 无 hasty 维度）；可行性：需动 gate 归因合并逻辑，属既有架构问题非本轮回归，撞「超出范围写遗留」硬边界；风险：动归因链可能影响全部门禁基线；后果：单条测试断言放宽即可绕开，投入产出比最差',
    '[D] 扩 all/every 新形状 any/both of <群体> is/are <表语>；可行性：282 判据注释记为遗留但未实测，本轮已花 12 次调用；风险：新形状可能引入 any 歧义（any one of them 在疑问/条件句大量良性出现）；后果：与 A 同池但改动面更大',
    '[E] 把 282 测试里 ⑫ 组 2 条本就是良性的样本（All users receive the notice / All users are not affected）从「必须命中」拆到「必须 pass」组，不改引擎；可行性：零引擎风险单文件测试改动；后果：红测试减 2 项但真实缺口仍在，属掩盖不是修复',
  ].join('\n');
  const res = await d.decide({ task: '选下一轮方向', prompt: candidates });
  console.log(JSON.stringify({ chosen: res.chosen, confidence: res.confidence, reason: res.reasoning }, null, 2));
  console.log('composites:', res.all_options.map(o => o.id + '=' + o.composite).join(', '));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
