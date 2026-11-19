// r407 负例删条探针：逐模式删掉本轮每个新模式，断言守卫必须变红（模块层停命中）
// 同时检查：新样本不经过路由①/② 命中（删条才能归因到路由③）
'use strict';
const { checkAppealToNature } = require('/data/home/heartflow/src/appeal-to-nature.js');

const NEVER = /(?!x)x/; // 永不匹配

// 每个新模式 → 专属样本（该样本仅依赖此模式命中，删条后必须停）
const PER_BRANCH = [
  ['v1_evolved_body', 'EVOLVE_ZH_BRANCHES', '人类几十万年进化出来的身体，根本不是为精制糖设计的'],
  ['v2_genes_stuck', 'EVOLVE_ZH_BRANCHES', '我们的基因还停留在采集时代，根本消化不了工业化生产的食品'],
  ['v3_natural_state', 'EVOLVE_ZH_BRANCHES', '自然状态下本来就是优胜劣汰，医疗干预太多反而让人类退化'],
  ['v4_innate', 'EVOLVE_ZH_BRANCHES', '人天生就该日出而作日落而息，熬夜加班本身就有违天道'],
  ['v5_tiandao', 'EVOLVE_ZH_BRANCHES', '人应当顺应天理，违背自然节奏身体会退化'],
  ['m1_not_designed_for', 'MISFIT_ZH_BRANCHES', '人类几十万年进化出来的身体，根本不是为精制糖设计的'],
  ['m2_cannot_process', 'MISFIT_ZH_BRANCHES', '我们的基因还停留在采集时代，根本消化不了工业化生产的食品'],
  ['m3_against_nature', 'MISFIT_ZH_BRANCHES', '人天生就该日出而作日落而息，熬夜加班本身就有违天道'],
  ['m4_degenerate', 'MISFIT_ZH_BRANCHES', '自然状态下本来就是优胜劣汰，医疗干预太多反而让人类退化'],
  ['m5_natural_illness', 'MISFIT_ZH_BRANCHES', '人的身体天生就离不开自然环境，一旦脱离自然状态就会生病'],
  ['x1_evolution', 'EVOLVE_EN_BRANCHES', 'Evolution designed our digestive systems for whole foods, not processed snacks.'],
  ['x2_genes', 'EVOLVE_EN_BRANCHES', 'Human genes are unchanged for a hundred thousand years, so we cannot process refined sugar.'],
  ['x3_era', 'EVOLVE_EN_BRANCHES', 'For hundreds of thousands of years we ate wild food, and refined food makes us sick.'],
  ['x4_nature_intended', 'EVOLVE_EN_BRANCHES', 'Nature intended animals to roam free; factory farming goes against their design.'],
  ['x5_innate', 'EVOLVE_EN_BRANCHES', 'We are born to move; sitting at a desk goes against our nature.'],
  ['y0_designed_for', 'MISFIT_EN_BRANCHES', 'Evolution designed our digestive systems for whole foods, not processed snacks.'],
  ['y1_not_adapted', 'MISFIT_EN_BRANCHES', 'Stone Age brains are not suited to modern life.'],
  ['y2_cannot_process', 'MISFIT_EN_BRANCHES', 'Human genes are unchanged for a hundred thousand years, so we cannot process refined sugar.'],
  ['y3_against_nature', 'MISFIT_EN_BRANCHES', 'Nature intended animals to roam free; factory farming goes against their design.'],
  ['y4_make_sick_degenerate', 'MISFIT_EN_BRANCHES', 'For hundreds of thousands of years we ate wild food, and refined food makes us sick.'],
];

let red = 0, notRed = 0;
for (const [branch, table, sample] of PER_BRANCH) {
  const base = checkAppealToNature(sample);
  if (!base.hit) { console.log(`[BASELINE-MISS] ${branch} | ${sample.slice(0, 40)}`); notRed++; continue; }
  // 只删这一个分支（同组其他分支保留）
  const mod = require('/data/home/heartflow/src/appeal-to-nature.js').__internals();
  const orig = mod[table][branch];
  mod[table][branch] = NEVER;
  const after = checkAppealToNature(sample);
  mod[table][branch] = orig;
  if (after.hit === false) { red++; console.log(`[RED] ${branch} → 停命中 | ${sample.slice(0, 36)}`); }
  else { notRed++; console.log(`[NOT-RED] ${branch} → 仍命中(detail=${after.detail}) | ${sample.slice(0, 36)}`); }
}
console.log(`\nr407 负例删条: ${PER_BRANCH.length} 注入 → ${red} 变红 / ${notRed} 未变红`);
process.exit(notRed ? 1 : 0);
