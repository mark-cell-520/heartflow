'use strict';
/**
 * test/round-220-average-marginal-conflation.test.js — 第 214 维度
 * 「平均≠边际」检测器测试（r220，agent-4 起草，8 处接线交 1 号）。
 *
 * 载入 src/average-marginal-conflation.js，四层结构：
 *   一、攻击样本命中（26 条：F-1 推断链 / F-2a 增量决策 / F-2b 扩产
 *      建议 / F-3 反问 / F-4 反向归因，中英双语）
 *   二、良性样本放行（27 条：教学转述/正确响应/对冲/单腿/疑问句/
 *      新闻转述，含 r220 探针 D 族良性对照原样）
 *   三、边界与结构（单腿/腿序/承重函数与常量存在性/分数与计数）
 *   四、注入承重（24 条）：腿①×2、腿②×2、推断词×2、增量腿×2、
 *      成本侧结论×2、收益侧结论×2、F-2b×2、F-3×2、F-4×2、教学豁免
 *      ×2、正确响应豁免×2、否定守卫×2
 *   五、分工边界锁（4 条）：沉没成本/生态谬误/统计比例/辛普森归
 *      各自维度，本模块不收
 *
 * 负例口径：注入常量后指定守卫/形必须变红（该样本不再命中），否则
 * 说明该常量没有承重，守卫形同虚设。
 */
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const { execFileSync } = require('child_process');

const MOD = path.join(__dirname, '..', 'src', 'average-marginal-conflation.js');
const { checkAverageMarginalConflation } = require(MOD);
const I = require(MOD).__internals();

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  ❌ ' + msg); }
}

// ─── 一、攻击样本：必须命中 ────────────────────────────────────────
const ATTACK = [
  // F-1 推断链形（腿① → 推断词 → 边际参照 → 边际侧结论）
  '单台成本已经压到这么低了，说明再生产一台更便宜。',
  '平均成本持续下降，所以下一台的边际成本也会更低。',
  '摊到每件商品上的成本越来越低，所以再多做一件花不了多少钱。',
  '平均成本持续下降，所以边际成本也会跟着降。',
  '单位成本已经摊得很薄，这说明新增一批的物料成本可以忽略。',
  'Average cost has fallen so far that the next unit is cheaper to produce.',
  'Since our average cost per unit keeps dropping, the marginal cost of one more unit is surely lower.',
  'Average cost keeps falling, so marginal cost will also fall.',
  'Our per-unit cost is already thin, so producing one more batch costs almost nothing.',
  // F-2a 增量决策形（平均值 × 增量动作/量化参照 × 收益侧结论）
  '平均每个产品能赚不少，产量继续往上加，利润只会越滚越多。',
  '目前摊薄后单台还有利润，这时候扩产就是在增厚利润。',
  '平均利润率摆在这里，扩产就是在增厚利润。',
  '每台成本均摊下来不到十块钱，再多造几台也没什么成本。',
  '平均收益还不错，放量之后收入只会更高。',
  '单均产值摆在这，加大产量利润自然更厚。',
  '平均每个用户都付费，新增用户也会付费。',
  'Each unit earns a healthy margin on average, so pushing volume higher will keep raising profit.',
  'The average unit is profitable, which means adding more units adds more profit.',
  'The average user pays, so the next user will pay too.',
  'Average margin looks healthy, so ramping up production will only thicken profit.',
  // F-2b 扩产建议形（平均值直接给增量行动背书）
  '平均每个产品能赚不少，值得扩产。',
  'The average unit earns well, so it is worth expanding output.',
  // F-3 反问形（问号包装的断言）
  '平均成本都降到这个地步了，再多生产一台还能贵到哪去？',
  'Average cost is already this low — how expensive can one more unit be?',
  // F-4 反向归因形（先给边际结论再拿平均值当归因）
  '下一台的成本肯定更低，因为平均成本一直在降。',
  'One more unit is cheaper because the average cost keeps falling.',
];

console.log('一、攻击样本命中（' + ATTACK.length + ' 条）');
for (const s of ATTACK) {
  const r = checkAverageMarginalConflation(s);
  ok(r.hit, '攻击未命中: ' + s + ' → ' + JSON.stringify(r));
}
console.log('  命中 ' + (ATTACK.length - failed) + '/' + ATTACK.length + '（累计失败 ' + failed + '）');

// ─── 二、良性样本：必须放行 ────────────────────────────────────────
const BENIGN = [
  // 正确响应形（把平均与边际分开）
  '平均成本下降不代表边际成本下降，多生产一台的额外成本可能更高。',
  '扩产前要先算边际成本和边际收益，不能只看摊薄后的平均值。',
  '平均成本已经低于售价，但边际成本正在快速上升，盲目扩产有风险。',
  '算过边际账后，平均成本有优势，值得扩产。',
  'Falling average cost does not imply falling marginal cost; the next unit can cost more.',
  'Before expanding output we should compare marginal cost with marginal revenue, not the average.',
  'We ran the marginal numbers; with average cost this low, expansion is justified.',
  // 教学/概念转述
  '边际成本曲线通常呈U型。',
  '经济学教材指出，平均成本和边际成本是两个不同的概念。',
  'The marginal cost curve is typically U-shaped.',
  'Economics textbooks distinguish average cost from marginal cost.',
  // 对冲
  '平均成本降了，下一台可能更便宜，但还要看产能利用率。',
  'Average cost fell, and the next unit might be cheaper, but capacity matters.',
  // 只有平均值 / 事实并陈
  '我们的平均成本是每件12元。',
  '按平均成本定价是我们的惯例。',
  '平均成本下降，边际成本也下降。',
  'Our average cost per unit is 12 yuan.',
  'We price at average cost as a matter of policy.',
  'Average cost fell and marginal cost fell too.',
  // 疑问句（真问题非反问）
  '平均成本和边际成本有什么区别？',
  'What is the difference between average cost and marginal cost?',
  // 新闻转述/只报事实
  '这个季度单台利润转正，公司宣布扩产。',
  'Unit profit turned positive this quarter and the company announced expansion.',
  // 有平均值有增量但无结论腿
  '平均每个用户都付费，新增用户的获取成本要单独核算。',
  'The average customer pays, but acquisition cost for new customers must be assessed separately.',
  // 非本族统计/会计陈述
  '设备摊销按五年直线法计算。',
  '上一轮平均耗时三小时，这一轮也是三小时。',
];

console.log('二、良性样本放行（' + BENIGN.length + ' 条）');
const benignBefore = failed;
for (const s of BENIGN) {
  const r = checkAverageMarginalConflation(s);
  ok(!r.hit, '良性被误判: ' + s + ' → ' + r.detail);
}
console.log('  放行 ' + (BENIGN.length - (failed - benignBefore)) + '/' + BENIGN.length);

// ─── 三、边界与结构 ────────────────────────────────────────────────
console.log('三、边界与结构');
// 单腿：只有腿①（无边际参照无结论）
ok(!checkAverageMarginalConflation('我们的平均成本是每件12元。').hit, '边界：只有腿①不应命中');
// 单腿：只有腿②（无平均值）
ok(!checkAverageMarginalConflation('扩产计划下个月启动。').hit, '边界：只有腿②不应命中');
// 单腿：只有腿③（无平均值无边际参照）
ok(!checkAverageMarginalConflation('利润越滚越多。').hit, '边界：只有腿③不应命中');
// 腿序：腿②在腿①之前（「扩产前要先算边际成本，不能只看摊薄后的平均值」）
ok(!checkAverageMarginalConflation('扩产前要先算边际成本，不能只看摊薄后的平均值。').hit, '边界：腿②先于腿①不应命中');
// 承重函数与常量存在性
ok(typeof checkAverageMarginalConflation === 'function', '结构：checkAverageMarginalConflation 必须是函数');
ok(I.AVG_COST_ZH.length >= 1 && I.MARG_ZH.length >= 1 && I.INCR_ZH.length >= 1, '结构：腿常量必须非空');
ok(I.AVG_COST_EN.length >= 1 && I.MARG_EN.length >= 1 && I.INCR_EN.length >= 1, '结构：EN 腿常量必须非空');
ok(I.F2B_ZH instanceof RegExp && I.F3_ZH instanceof RegExp && I.F4_ZH instanceof RegExp, '结构：ZH 三形正则必须存在');
ok(I.F2B_EN instanceof RegExp && I.F3_EN instanceof RegExp && I.F4_EN instanceof RegExp, '结构：EN 三形正则必须存在');
ok(I.EXEMPT_META_ZH.length >= 1 && I.EXEMPT_CORRECT_ZH.length >= 1, '结构：ZH 豁免常量必须非空');
ok(I.EXEMPT_META_EN.length >= 1 && I.EXEMPT_CORRECT_EN.length >= 1, '结构：EN 豁免常量必须非空');
ok(I.NEG_ZH instanceof RegExp && I.NEG_EN instanceof RegExp, '结构：否定守卫必须存在');
// 分数与计数（VERIFY 级 0.6；r219 同口径：单句可能是省略语境的正当陈述）
const hitSample = checkAverageMarginalConflation(ATTACK[0]);
ok(hitSample.score === 0.6, '分数：命中样本 score 必须为 0.6（VERIFY 级），实得 ' + hitSample.score);
ok(hitSample.count >= 1, '计数：命中样本 count 必须 >= 1');
ok(hitSample.detail.length > 0, '详情：命中样本 detail 必须非空');
const missSample = checkAverageMarginalConflation('我们的平均成本是每件12元。');
ok(missSample.hit === false && missSample.score === 0 && missSample.count === 0, '未命中：hit=false 时 score/count 必须为 0');
// 注入对象缺省可用
ok(checkAverageMarginalConflation(ATTACK[0], {}).hit === true, '注入：空注入对象不得破坏默认行为');

// ─── 四、注入承重 ─────────────────────────────────────────────────
console.log('四、注入承重（24 项）');
const NEVER = /(?!x)x/;   // 永假正则

// 腿①：AVG_COST_ZH 空 → 单台成本链断（F-1/F-2a 同时断）
ok(!checkAverageMarginalConflation('单台成本已经压到这么低了，说明再生产一台更便宜。', { AVG_COST_ZH: [] }).hit,
  '注入 AVG_COST_ZH=[] 后「单台成本→更便宜」必须不再命中');
// 腿①：AVG_COST_EN 空 → EN 链断
ok(!checkAverageMarginalConflation('Average cost has fallen so far that the next unit is cheaper to produce.', { AVG_COST_EN: [] }).hit,
  '注入 AVG_COST_EN=[] 后 EN 攻击必须不再命中');
// 腿②：MARG_ZH 空 → F-1 推断链断（F-2a 专用增量腿仍在，故靶样本取 F-1 独有形）
ok(!checkAverageMarginalConflation('平均成本持续下降，所以边际成本也会跟着降。', { MARG_ZH: [] }).hit,
  '注入 MARG_ZH=[] 后 F-1 推断链必须断');
// 腿②：MARG_EN 空
ok(!checkAverageMarginalConflation('Average cost keeps falling, so marginal cost will also fall.', { MARG_EN: [] }).hit,
  '注入 MARG_EN=[] 后 F-1 EN 推断链必须断');
// 推断词：INFER_ZH 永假 → F-1 死（F-2a 无推断词仍活）
ok(!checkAverageMarginalConflation('平均成本持续下降，所以边际成本也会跟着降。', { INFER_ZH: NEVER }).hit,
  '注入 INFER_ZH=永假 后 F-1 独有形必须不再命中');
// 推断词：INFER_EN 永假
ok(!checkAverageMarginalConflation('Average cost keeps falling, so marginal cost will also fall.', { INFER_EN: NEVER }).hit,
  '注入 INFER_EN=永假 后 F-1 EN 独有形必须不再命中');
// 增量腿：INCR_ZH 空 → F-2a 死（靶样本为 F-2a 独有形）
ok(!checkAverageMarginalConflation('平均每个产品能赚不少，产量继续往上加，利润只会越滚越多。', { INCR_ZH: [] }).hit,
  '注入 INCR_ZH=[] 后 F-2a 必须断');
// 增量腿：INCR_EN 空
ok(!checkAverageMarginalConflation('The average unit is profitable, which means adding more units adds more profit.', { INCR_EN: [] }).hit,
  '注入 INCR_EN=[] 后 F-2a EN 必须断');
// 成本侧结论：CHEAP_ZH 空 → 便宜/更低链断
ok(!checkAverageMarginalConflation('单台成本已经压到这么低了，说明再生产一台更便宜。', { CHEAP_ZH: [] }).hit,
  '注入 CHEAP_ZH=[] 后成本侧结论链必须断');
// 成本侧结论：CHEAP_EN 空
ok(!checkAverageMarginalConflation('Average cost has fallen so far that the next unit is cheaper to produce.', { CHEAP_EN: [] }).hit,
  '注入 CHEAP_EN=[] 后 EN 成本侧结论链必须断');
// 收益侧结论：PROFIT_ZH 空 → 增厚利润链断
ok(!checkAverageMarginalConflation('目前摊薄后单台还有利润，这时候扩产就是在增厚利润。', { PROFIT_ZH: [] }).hit,
  '注入 PROFIT_ZH=[] 后收益侧结论链必须断');
// 收益侧结论：PROFIT_EN 空
ok(!checkAverageMarginalConflation('Each unit earns a healthy margin on average, so pushing volume higher will keep raising profit.', { PROFIT_EN: [] }).hit,
  '注入 PROFIT_EN=[] 后 EN 收益侧结论链必须断');
// F-2b 形
ok(!checkAverageMarginalConflation('平均每个产品能赚不少，值得扩产。', { F2B_ZH: NEVER }).hit,
  '注入 F2B_ZH=永假 后扩产建议形 ZH 必须不再命中');
ok(!checkAverageMarginalConflation('The average unit earns well, so it is worth expanding output.', { F2B_EN: NEVER }).hit,
  '注入 F2B_EN=永假 后扩产建议形 EN 必须不再命中');
// F-3 反问形
ok(!checkAverageMarginalConflation('平均成本都降到这个地步了，再多生产一台还能贵到哪去？', { F3_ZH: NEVER }).hit,
  '注入 F3_ZH=永假 后反问形 ZH 必须不再命中');
ok(!checkAverageMarginalConflation('Average cost is already this low — how expensive can one more unit be?', { F3_EN: NEVER }).hit,
  '注入 F3_EN=永假 后反问形 EN 必须不再命中');
// F-4 反向归因形
ok(!checkAverageMarginalConflation('下一台的成本肯定更低，因为平均成本一直在降。', { F4_ZH: NEVER }).hit,
  '注入 F4_ZH=永假 后反向归因形 ZH 必须不再命中');
ok(!checkAverageMarginalConflation('One more unit is cheaper because the average cost keeps falling.', { F4_EN: NEVER }).hit,
  '注入 F4_EN=永假 后反向归因形 EN 必须不再命中');
// 豁免一：教学转述
ok(checkAverageMarginalConflation('教材里提到，平均成本下降说明再生产一台更便宜，这是一种认知偏误。', { EXEMPT_META_ZH: [] }).hit,
  '注入 EXEMPT_META_ZH=[] 后教学转述陷阱必须变红');
ok(checkAverageMarginalConflation('Economics textbooks explain that when average cost falls, the next unit is cheaper — a classic misconception.', { EXEMPT_META_EN: [] }).hit,
  '注入 EXEMPT_META_EN=[] 后 EN 教学转述陷阱必须变红');
// 豁免二：正确响应形
ok(checkAverageMarginalConflation('平均成本有优势，但这不代表值得扩产，边际账还没算。', { EXEMPT_CORRECT_ZH: [] }).hit,
  '注入 EXEMPT_CORRECT_ZH=[] 后正确响应陷阱必须变红');
ok(checkAverageMarginalConflation("The average margin is strong, but that doesn't mean we should scale up — check the marginal cost first.", { EXEMPT_CORRECT_EN: [] }).hit,
  '注入 EXEMPT_CORRECT_EN=[] 后 EN 正确响应陷阱必须变红');
// 否定守卫：跨度否定（「并不说明」）
ok(checkAverageMarginalConflation('平均成本确实在降，但这并不说明再生产一台会更便宜。', { NEG_ZH: NEVER }).hit,
  '注入 NEG_ZH=永假 后否定陷阱必须变红');
ok(checkAverageMarginalConflation("Average cost is falling, but the next unit won't be cheaper.", { NEG_EN: NEVER }).hit,
  '注入 NEG_EN=永假 后 EN 否定陷阱必须变红');

// ─── 五、分工边界锁（其他维度家族，本模块不收）────────────────────
console.log('五、分工边界锁（4 项）');
// 沉没成本（已投入×必须继续）归 sunk_cost_coercion，不归本模块
ok(!checkAverageMarginalConflation('设备已经买了，所以再生产一台只是材料钱。').hit,
  '边界锁：沉没成本形不得命中（归 sunk_cost_coercion）');
// 生态谬误（群体→个体）归 ecological_fallacy
ok(!checkAverageMarginalConflation('这个团队平均智商高，所以每个成员都聪明。').hit,
  '边界锁：生态谬误形不得命中（归 ecological_fallacy）');
// 小基数比例归 statistical_misleading
ok(!checkAverageMarginalConflation('抽样里5个用户有4个说好，所以好评率80%。').hit,
  '边界锁：小基数比例形不得命中（归 statistical_misleading）');
// 辛普森悖论（子群趋势）归 simpsons_paradox
ok(!checkAverageMarginalConflation('整体合格率上升，但每个子组的合格率都在下降。').hit,
  '边界锁：辛普森形不得命中（归 simpsons_paradox）');

// ─── 汇总 ─────────────────────────────────────────────────────────
try {
  console.log('\nround-220-average-marginal-conflation: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('❌ round-220-average-marginal-conflation FAILED（' + failed + '）');
    process.exit(1);
  }
  console.log('✅ round-220-average-marginal-conflation PASS');
} finally {
  // 清理（测试脚本最后一行必须是清理）
  try { fs.unlinkSync(MOD + '.tmp-probe'); } catch (_) {}
  try { fs.unlinkSync(path.join(__dirname, '..', 'coverage', 'round-220.tmp')); } catch (_) {}
}
