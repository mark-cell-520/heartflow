// r408 负例删条探针：逐模式删掉本轮每个新模式，断言守卫必须变红（模块层停命中）
// 每个新模式配专属样本（该样本仅依赖此模式命中，删条后必须停）
'use strict';
const mod = require('/data/home/heartflow/src/appeal-tradition.js');
const { checkAppealToTradition } = mod;

const NEVER = /(?!x)x/; // 永不匹配

// [branch, table, 专属样本]
const PER_BRANCH = [
  // 腿① 中文：sv1 存续时段（样本腿①仅命中 sv1——两百年/流传了四百年不在旧表）
  ['sv1_survived', 'SURVIVE_ZH_BRANCHES', '这套拳法流传了四百年，要是没用早就失传了'],
  // 腿② 中文：sc1 反事实消亡（刻意避开 sc2 的「没X早就Y」替代支，用「要是害人早就亡了」）
  ['sc1_counterfactual_death', 'SURVCONCL_ZH_BRANCHES', '祖宗传下来的规矩用了上千年，要是害人早就亡了'],
  // 腿② 中文：sc2 时间检验结论（反问形）
  ['sc2_proven_worth', 'SURVCONCL_ZH_BRANCHES', '这道菜的做法传了五百年，能不好吃吗'],
  // 腿① 英文：sv1 survived + 时段
  ['sv1_survived', 'SURVIVE_EN_BRANCHES', 'A remedy that has survived a thousand years cannot be useless.'],
  // 腿① 英文：sv2 has stood + 时段
  ['sv2_stood', 'SURVIVE_EN_BRANCHES', 'The temple has stood here for eight centuries; if the site were cursed, it would have collapsed.'],
  // 腿② 英文：sc1 would have disappeared（旧腿① the old way 在场，删 sc1 后旧路由不接）
  ['sc1_would_have', 'SURVCONCL_EN_BRANCHES', 'If the old way were wrong, it would have disappeared by now.'],
  // 腿② 英文：sc2 cannot be useless
  ['sc2_cannot_be', 'SURVCONCL_EN_BRANCHES', 'A remedy that has survived a thousand years cannot be useless.'],
  // 腿② 英文：sc3 that alone proves its worth
  ['sc3_proves_worth', 'SURVCONCL_EN_BRANCHES', 'This technique has been passed down for centuries — that alone proves its worth.'],
];

let red = 0, notRed = 0;
for (const [branch, table, sample] of PER_BRANCH) {
  const base = checkAppealToTradition(sample);
  if (!base.hit) { console.log(`[BASELINE-MISS] ${branch} | ${sample.slice(0, 40)}`); notRed++; continue; }
  const orig = mod.__internals()[table][branch];
  mod.__internals()[table][branch] = NEVER;
  const after = checkAppealToTradition(sample);
  mod.__internals()[table][branch] = orig;
  if (after.hit === false) { red++; console.log(`[RED] ${branch} → 停命中 | ${sample.slice(0, 36)}`); }
  else { notRed++; console.log(`[NOT-RED] ${branch} → 仍命中(detail=${after.detail}) | ${sample.slice(0, 36)}`); }
}
console.log(`\nr408 负例删条: ${PER_BRANCH.length} 注入 → ${red} 变红 / ${notRed} 未变红`);
process.exit(notRed ? 1 : 0);
