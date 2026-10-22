// r588 decide 二判：补可区分判据（实测可行性 + 影响面 + 当前缺陷证据）
'use strict';
const { HeartFlowDecision } = require('../src/core/decision.js');
const { CooperativeArbitration } = require('../src/core/cooperative-arbitration.js');

// 实测 1：模块当前能力是否真的可用（中英文输入）
const ca = new CooperativeArbitration();
const zhHot = '我和父母的关系让我很崩溃，总是这样';
const enHot = 'my relationship with my parents makes me break down, always';
const zhOut = ca.twoPassCheck(zhHot);
const enOut = ca.twoPassCheck(enHot);

const candidates = [
  '[A] 第91维度继续做守卫活轮。\n' +
  '实测证据：探测器池空（第588轮输出"未探测到新的零覆盖族"）；r586 已把同一模块的' +
  '变异注入钩子 + 看守腿做透（6腿置空翻向实测成立）。再做的边际辨别能力为 0。',

  '[B] 真接 CooperativeArbitration.twoPassCheck 进判别链。\n' +
  '实测证据：全仓零 require / 零调用 / 零 MCP 暴露（r571-zeroref 扫描 425 模块）；' +
  '本轮实测该模块自带缺陷——中文输入 lowercased 后中文话题词永不命中' +
  '（zhHot topic-reflex 期望命中，实测 ' + JSON.stringify(zhOut.action) + '/' + (zhOut.reason || 'null') + '；' +
  'enHot 实测 ' + JSON.stringify(enOut.action) + '/' + (enOut.reason || 'null') + '），' +
  '即接线本身就要求先修中文失明。修好后新增一个此前不具备的输入族辨别能力：' +
  '四类"自动反射"（话题套框架 / 句式升华 / 短句催建议 / 找谁对谁错）+ 推理质量低即暂停。',

  '[C] 真接 InstructionRegistry.check/audit 进 think() 输出链。\n' +
  '实测证据：heartflow.js:1645 已实例化但全仓零读取点；check() 只覆盖 4/7 条指令' +
  '（truth/goodness/beauty/reduce_errors 有规则，upgrade/serve_humans/continuous_improvement' +
  ' 落到 default 恒 aligned:true——无规则可判），规则深度浅。',
];

(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({ task: '选下一轮方向', prompt: candidates.join('\n') });
  console.log(JSON.stringify(res, null, 2));
})().catch(e => console.log('ERR ' + e.message));
