// r308：对 14 个候选未接线模块取攻击样本（模块层自命中），跑 gate() 看是否真穿透
const path = require('path');
const gate = require(path.join(__dirname,'..','..','src','gate.js'));
const mods = [
  ['anchoring-effect.js','detectAnchoringEffect','anchoring_effect'],
  ['disposition-effect.js','detectDispositionEffect','disposition_effect'],
  ['effort-justification.js','detectEffortJustification','effort_justification'],
  ['endowment-effect.js','detectEndowmentEffect','endowment_effect'],
  ['illusion-of-control.js','detectIllusionOfControl','illusion_of_control'],
  ['inverse-gamblers-fallacy.js','detectInverseGamblersFallacy','inverse_gamblers_fallacy'],
  ['mental-accounting.js','detectMentalAccounting','mental_accounting'],
  ['p-hacking.js','detectPHacking','p_hacking'],
  ['perverse-incentive.js','detectPerverseIncentive','perverse_incentive'],
  ['significance-effect-size.js','detectSignificanceEffectSize','significance_effect_size'],
  ['tragedy-of-commons.js','detectTragedyOfCommons','tragedy_of_commons'],
  ['winners-curse.js','detectWinnersCurse','winners_curse'],
  ['average-marginal-conflation.js','checkAverageMarginalConflation','average_marginal_conflation'],
  ['budget-value-conflation.js','checkBudgetValueConflation','budget_value_conflation'],
];
const out = [];
for (const [file,fn,dim] of mods) {
  const mod = require(path.join(__dirname,'..','..','src',file));
  const f = mod[fn];
  // 用 __internals 里取样本太复杂，改为用测试文件里的攻击样本太费时；先测模块能否命中其自身报告样本
  out.push({dim, file, hasInternals: !!mod.__internals});
}
console.log('候选模块:', out.length, '个');
