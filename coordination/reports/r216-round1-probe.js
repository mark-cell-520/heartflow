// r216 修复轮实测：agent-2 r214-round2 报告 §3/§4 样本逐条复现
// 基线：r215 (875e7dad) + r216 本地修复（未提交）
// 判定口径：目标维度声称覆盖的攻击族，变体必须 hit=true 且该维度承重
'use strict';
const col = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/collider-bias.js');
const med = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/mediator-confusion.js');

const attacks = [
  // §3.1 统计族豁免洗白（collider 模块层）— F1-F7 + A4
  ['F1', 'col', '从统计学看，只收录存活样本的公司估值更高，所以存活公司经验更丰富。'],
  ['F2', 'col', '用统计方法分析，在留下来的员工里加班少的反而绩效更高，所以加班会拖累绩效。'],
  ['F3', 'col', '统计分析显示，只看活过三年的创业公司，创始人行业经验越少公司估值越高，可见经验会拖累公司。'],
  ['F4', 'col', '统计表明，在这家医院住院的病人中，接受强化治疗的人死亡率更低，说明强化治疗很有效。'],
  ['F5', 'col', '统计显示，在入选决赛的选手里，训练时间短的排名反而更高，因此训练时间越短成绩越好。'],
  ['F6', 'col', '统计推断告诉我们，在留下来的员工里加班少的反而绩效更高，所以加班少导致绩效高。'],
  ['F7', 'col', '数据统计发现，只看活过三年的创业公司，创始人的行业经验越少公司估值越高，可见经验会拖累公司。'],
  ['A4', 'col', '只统计了存活样本，所以加班少导致绩效高。'],
  // §3.2 collider 疑问豁免未同步（r216 目标修复）
  ['R5', 'col', '在留下来的员工里，加班少的反而绩效更高，这岂不是说明高配合度会削弱队伍存活率吗？'],
  ['R6', 'col', '在留下来的员工里，加班少的反而绩效更高，又何尝不说明高配合度会削弱队伍存活率呢？'],
  ['R12', 'col', 'Once you control for income, doesn\'t education have no effect on health?'],
  // §3.3 NULL_EN 名词-动词相邻缺口（mediator 模块层）
  ['D4', 'med', 'The effect of exercise on health disappears once you account for sleep.'],
  // §3.4 NULL_ZH 缺词（mediator 模块层）
  ['C5', 'med', '控制了止痛药之后，疼痛和骨折的关系就消失了。'],
  ['C6', 'med', '控制了中介变量之后，炎症和发烧互不相关。'],
  ['C7', 'med', '控制了消炎药用量之后，原来的效应再也观测不到。'],
  ['R8', 'med', '控制了中介变量之后，那个效应化为乌有。'],
  ['F16', 'med', '把中介变量控制掉之后，两者互不相关。'],
  // §3.7 真·无标记疑问维持豁免（期望不命中，放良性侧）
];

const benigns = [
  // agent-2 V1b 正当统计句（G 组）— 期望 collider 层 0 命中
  ['G1', 'col', '统计学教材指出，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高。'],
  ['G2', 'col', '统计表明，只收录存活样本会得出错误结论，不能据此说加班少导致绩效高'],
  ['G5', 'col', '从统计学看，筛选后的相关可能是伪相关，需要回到全样本再下结论'],
  ['G6', 'col', '统计推断告诉我们，条件筛选会制造伪相关，不足以证明因果关系'],
  // 概念/教学转述
  ['M1', 'col', '对撞偏差是指条件筛选后子样本内的相关被误当作总体因果结论的谬误。'],
  ['M2', 'med', '中介变量是指因果链上位于原因与结果之间的传递环节。'],
  // 正确响应形
  ['C1', 'col', '只看存活样本不能推广，需要筛选前的全样本数据。'],
  ['C2', 'med', '不能控制中介变量，控制它会切断因果通道，需要估计直接效应。'],
  // 混杂控制形（正当去偏）
  ['CF', 'med', '年龄同时影响运动与心脏病发病率，控制年龄这个混杂因素是正确的去偏。'],
  // 真·无标记疑问（agent-2 §3.7 观察项：维持豁免是正确设计权衡）
  ['R1', 'med', '控制了中介变量之后，效应真的没有影响吗？'],
  ['R3', 'med', 'Once you control for income, education has no effect on health, right?'],
  // 中性统计陈述（无攻击结构）
  ['S1', 'col', '统计显示今年参与调查的人数比去年多了三成。'],
  ['S2', 'med', '统计报告列出了各组的平均值与标准差。'],
];

function run() {
  let pass = 0, fail = 0;
  console.log('=== 攻击样本（期望命中）===');
  for (const [id, mod, text] of attacks) {
    const r = mod === 'col' ? col.checkColliderBias(text) : med.checkMediatorConfusion(text);
    const ok = r.hit === true;
    ok ? pass++ : fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${id} [${mod}] hit=${r.hit} score=${r.score} ${r.detail}`);
  }
  console.log('\n=== 良性样本（期望不命中）===');
  for (const [id, mod, text] of benigns) {
    const r = mod === 'col' ? col.checkColliderBias(text) : med.checkMediatorConfusion(text);
    const ok = r.hit === false;
    ok ? pass++ : fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${id} [${mod}] hit=${r.hit} ${r.detail}`);
  }
  console.log(`\n合计: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}
run();
