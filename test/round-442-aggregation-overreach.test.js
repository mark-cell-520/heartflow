// round-442: aggregation_overreach（第 281 维度）负例注入测试
// 判据三腿共现：腿① AGG 聚合量词 × 腿② UNI 全称越界断言 × 腿③ SEAL
// 缝合连接，四组豁免 + ZH 腿间约束，缺一不判。
'use strict';
const assert = require('assert');
const {
  checkAggregationOverreach,
  __internals,
} = require('../src/aggregation-overreach.js');

let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', name); }
}

// ============ 攻击池（核心攻击样本，期望全部 hit）============
const ATTACKS = [
  ['ZH 多数→全体', '大多数网民支持这个政策，可见全体网民一致支持。'],
  ['ZH 过半→所有', '过半网友点赞了这条视频，说明所有观众都喜欢它。'],
  ['ZH 几个→所有', '我见过几个程序员都穿连帽衫，所以所有程序员都穿连帽衫。'],
  ['ZH 部分→每个', '大部分调查对象点了同意，足以证明每个用户都认可条款。'],
  ['ZH 不少→所有', '不少的哥都绕路了，可见所有司机都在宰客。'],
  ['ZH 一部分→人人', '相当一部分读者买了这本书，所以人人都说它好。'],
  ['ZH 多数→全体2', '多数员工投了赞成票，足以说明全体同事一致同意。'],
  ['ZH 部分→所有', '部分买家给了差评，可见所有顾客都不满意。'],
  ['EN most→all', 'Most voters support the bill, so all voters support it.'],
  ['EN some→all', 'I met some developers who wear hoodies, so all developers wear hoodies.'],
  ['EN several→every', 'Several fans caused trouble, therefore every fan is a thug.'],
  ['EN a few→every', 'A few students skipped class, which proves that every student is lazy.'],
];

for (const [name, s] of ATTACKS) {
  const r = checkAggregationOverreach(s);
  ok(r.hit === true, `攻击应命中: ${name} | got hit=${r.hit}`);
  ok(r.count >= 1, `攻击 count>=1: ${name}`);
}

// ============ 良性池（期望全部不命中）============
const BENIGNS = [
  ['限定表述', '大多数网民支持这个政策，但仍有反对声音。'],
  ['纪律语言', '我见过几个程序员穿连帽衫，但这不能推广到所有程序员。'],
  ['EN 限定', 'Most voters support the bill, though some oppose it.'],
  ['纯全称', '所有金属都导电。'],
  ['统计纪律', '调查显示多数用户支持，样本量两千。'],
  ['抽样限定', '据调查，过半受访者满意，但这只是抽样结果。'],
  ['教学转述', '从全称推不出存在，这是逻辑学常见错误。'],
  ['无推论缝合', '有些措施取得了成效，全部计划仍在推进中。'],
  ['EN 限定2', 'Several fans caused trouble, but most fans are peaceful.'],
  ['疑问句', '大多数用户都点同意了吗，能说明所有用户都认可吗？'],
  ['对冲', '多数员工投了赞成票，或许足以说明全体同事同意。'],
  ['定义语境', '所有人都会死，这是公理性的定义。'],
];

for (const [name, s] of BENIGNS) {
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, `良性不应命中: ${name} | got hit=${r.hit} detail=${r.detail}`);
}

// ============ 逐常量承重验证（腿①/②/③各自抽掉即失效）============
const I = __internals();
const CORE_ZH = '大多数网民支持这个政策，可见全体网民一致支持。';
const CORE_EN = 'Most voters support the bill, so all voters support it.';

// 抽掉腿① AGG_ZH（全称句但无聚合量词）→ 应失效
{
  const r = checkAggregationOverreach(CORE_ZH, { AGG_ZH: /(?!x)x/ });
  ok(r.hit === false, '抽 AGG_ZH 后 ZH 核心句失效');
}
// 抽掉腿② UNI_ZH → 应失效
{
  const r = checkAggregationOverreach(CORE_ZH, { UNI_ZH: /(?!x)x/ });
  ok(r.hit === false, '抽 UNI_ZH 后 ZH 核心句失效');
}
// 抽掉腿③ SEAL_ZH → 应失效
{
  const r = checkAggregationOverreach(CORE_ZH, { SEAL_ZH: /(?!x)x/ });
  ok(r.hit === false, '抽 SEAL_ZH 后 ZH 核心句失效');
}
// 抽掉腿① AGG_EN → 应失效
{
  const r = checkAggregationOverreach(CORE_EN, { AGG_EN: /(?!x)x/ });
  ok(r.hit === false, '抽 AGG_EN 后 EN 核心句失效');
}
// 抽掉腿② UNI_EN → 应失效
{
  const r = checkAggregationOverreach(CORE_EN, { UNI_EN: /(?!x)x/ });
  ok(r.hit === false, '抽 UNI_EN 后 EN 核心句失效');
}
// 抽掉腿③ SEAL_EN → 应失效
{
  const r = checkAggregationOverreach(CORE_EN, { SEAL_EN: /(?!x)x/ });
  ok(r.hit === false, '抽 SEAL_EN 后 EN 核心句失效');
}

// ============ 豁免组承重验证（各组在场即全句豁免）============
// ① 纪律语言豁免
{
  const s = '大多数网民支持这个政策，可见全体网民一致支持。但抽样样本只有两百人，不能推广。';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '纪律语言豁免生效（不能推广）');
}
{
  const s = 'Most voters support the bill, so all voters support it, according to a representative survey with confidence intervals.';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '纪律语言豁免生效（EN confidence intervals）');
}
// ② 教学转述豁免
{
  const s = '大多数网民支持这个政策，可见全体网民一致支持——这是典型的逻辑谬误案例。';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '教学转述豁免生效（谬误案例）');
}
// ③ 对冲豁免
{
  const s = '大多数网民支持这个政策，或许可见全体网民一致支持？';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '对冲豁免生效（或许+问号）');
}
// ④ 定义语境豁免
{
  const s = '按照定义，大多数人会老去，所有人都是如此。';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '定义语境豁免生效（按照定义）');
}

// ============ 裸名词形自查（161 轮教训）============
// 同族词去掉宾语/助词后仍独立命中
ok(I.AGG_ZH.test('大多数'), 'AGG_ZH 收裸「大多数」');
ok(I.AGG_ZH.test('过半'), 'AGG_ZH 收裸「过半」');
ok(I.UNI_ZH.test('全部'), 'UNI_ZH 收裸「全部」');
ok(I.UNI_ZH.test('无一例外'), 'UNI_ZH 收裸「无一例外」');
ok(I.AGG_EN.test('most people'), 'AGG_EN 收裸 most');
ok(I.UNI_EN.test('every one'), 'UNI_EN 收裸 every');

// ============ 腿间约束承重（ZH）============
// 跨句不共链 → 失效
{
  const s = '大多数网民支持这个政策。所有咖啡馆都卖咖啡，这是巧合。';
  const r = checkAggregationOverreach(s);
  ok(r.hit === false, '腿间约束：AGG 与 UNI 被句号隔开则失效');
}

console.log(`\nround-442-aggregation-overreach: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
