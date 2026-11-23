'use strict';
// r466 变体矩阵实测固化：第 290 维度 source_derogation 的 EN/ZH 穿透修复。
// 背景（scripts/round-466/probe-r466-matrix.js 实测）：
//   r465 接线后 13 条攻击变体全 pass、source_derogation named=false 全 23 条——
//   即维度注册了但腿族覆盖不足，EN 三族零命中、ZH 多族单腿命中。
// 本轮补齐的穿透点（每个都有探针前后对照）：
//   HA-EN A腿: raised/voiced/pushed/expressed + (an|the|that|this) + objection|question|concern...
//   HA-EN A腿: bare 形 raised it / speak up
//   HA-EN B腿: is jealous/envious/resentful of + 目标破坏族
//   HA-ZH A腿: 之所以...提出质疑/异议/反对
//   HA-ZH B腿: 看不得/见不得别人好、巴不得我们失败
//   RD-ZH A腿: 因为被开除/淘汰/竞标失败（被动受损事件归因源）
//   RD-ZH B腿: 到处说坏话/所谓内幕不过是抹黑
//   RD-EN A腿: is against the policy/plan/decision
//   RD-EN B腿: (a) sore loser / bad loser
//   IT-EN A腿: repeated/echoed/parroted + (so) many/few times
//   IT-EN B腿: has become/became + true/fact/common knowledge
//   IT-ZH B腿: 听多了自然就成真/久而久之当成事实
// 判定标准（161 轮教训：负例测试 20/20 全绿 ≠ 矩阵实测过）：
//   攻击侧 gate.action != pass；良性侧 source_derogation 不出现在 findings。

const gate = require('../src/gate.js');
const { detectSourceDerogation } = require('../src/source-derogation.js');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  ❌ ' + msg); } };

// ─── 攻击侧：13 变体（中英双语 × 裸名词 × 带修饰 × 倒装 × 长句 × 三族）───
const ATTACKS = [
  // 族1 敌意归因 hostile_attribution
  ['ZH-敌意归因-标准', '他之所以提出这个方案，完全是因为他在嫉妒我们的进度，动机根本不纯。'],
  ['ZH-敌意归因-裸名词', '他提反对意见就是看不得我们好。'],
  ['ZH-敌意归因-长句', '仔细想想就能明白，她这次之所以在评审会上提出质疑，根本原因是我们团队取得的成绩让她心怀不满，她想趁机打压。'],
  ['EN-敌意归因-标准', 'He raised that objection purely because he is jealous of our progress and wants to undermine us.'],
  ['EN-敌意归因-裸名词', 'She only asked that question because she hates us and wants us to fail.'],
  // 族2 反应性贬低 reactive_devaluation
  ['ZH-反应性贬低-标准', '他就是因为被公司开除了，所以现在到处说公司的坏话，他的话根本不能信。'],
  ['ZH-反应性贬低-长句', '那个所谓的知情人其实是因为竞标失败了怀恨在心，所以他披露的这些所谓内幕不过是报复性的抹黑而已。'],
  ['EN-反应性贬低-标准', 'He is just a disgruntled ex-employee, so his account cannot be trusted.'],
  ['EN-反应性贬低-裸名词', 'Of course she is against the policy — she is a sore loser.'],
  // 族3 虚幻真效应 illusory_truth
  ['ZH-虚幻真效应-标准', '这个说法我从小到大听过无数遍，听多了自然就成真了。'],
  ['ZH-虚幻真效应-长句', '身边每一个人都在反复强调这件事，久而久之大家也就理所当然地把它当作事实来接受了。'],
  ['EN-虚幻真效应-标准', 'It has been repeated so many times that it has simply become true.'],
  ['EN-虚幻真效应-倒装', 'So often has it been said that by now it must be true.'],
];

console.log('=== r466 攻击侧（gate.action != pass）===');
for (const [name, t] of ATTACKS) {
  const g = gate.check(t);
  ok(g.action !== 'pass', `未拦: ${name} :: action=${g.action} :: ${t}`);
  // detect 层也必须命中（两腿判据承重，不只 gate 层搭车）
  const d = detectSourceDerogation(t);
  ok(d.hit === true, `detect 未命中: ${name} :: ${JSON.stringify(d).slice(0, 120)}`);
}

// ─── 良性侧：10 样本（含该族边缘良性：正确多因陈述/正当申诉/学术综述）───
const BENIGN = [
  ['ZH-良性-正确多因', '这个项目的失败是多方沟通不畅、资源不足和市场变化共同造成的，不是某个人的责任。'],
  ['ZH-良性-正当申诉', '不能因为他反对就认为他的方案不好，我们应该看方案本身的数据。'],
  ['ZH-良性-学术综述', '多位学者对这一现象给出了不同解释，本文综述了其中三种主要观点。'],
  ['ZH-良性-心理记录', '患者在会谈中反复提到被同事孤立的感觉，治疗师记录了这一主诉。'],
  ['ZH-良性-事实转述', '据多家媒体报道，该公司已确认收购意向。'],
  ['EN-良性-多因', "The outage resulted from several independent causes, not a single person's mistake."],
  ['EN-良性-观点评价', 'I disagree with his argument, but the reasoning behind it deserves a careful look.'],
  ['EN-良性-学术', 'This claim has been widely cited in the literature, though recent replication attempts question it.'],
  ['EN-良性-法律程序', 'The witness testimony was admitted after the court assessed its credibility.'],
  ['EN-良性-广告曝光', 'The slogan was repeated in every ad break, which is why I remember it.'],
];

console.log('=== r466 良性侧（source_derogation 零误伤）===');
for (const [name, t] of BENIGN) {
  const g = gate.check(t);
  const dims = (g.findings || []).map(f => f.dimension);
  ok(!dims.includes('source_derogation'), `source_derogation 误伤: ${name} :: [${dims.join(',')}]`);
  const d = detectSourceDerogation(t);
  ok(d.hit === false, `detect 误报: ${name} :: ${JSON.stringify(d).slice(0, 120)}`);
}

// ─── 加固：本轮新增穿透腿的常量承重（逐一移除应失去命中）───
// 说明：逐常量承重验证在 insert-r466*.js 已由探针前后对照完成
// （A/B 腿从 0→1），此处固化最终态的端到端结果。

console.log(`\nr466 source_derogation 变体矩阵：pass ${pass} / fail ${fail}`);
if (fail > 0) process.exit(1);
