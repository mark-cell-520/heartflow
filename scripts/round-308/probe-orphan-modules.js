// r308 对 17 个孤儿 provisional 维度模块做模块层直调，确认功能可用 + 基准漏判
const path = require('path');
const gate = require(path.join(__dirname,'..','..','src','gate.js'));
const mods = {
  'anchoring_effect': ['anchoring-effect.js','detectAnchoringEffect'],
  'average_marginal_conflation': ['average-marginal-conflation.js','detectAverageMarginalConflation'],
  'budget_value_conflation': ['budget-value-conflation.js','detectBudgetValueConflation'],
  'disposition_effect': ['disposition-effect.js','detectDispositionEffect'],
  'effort_justification': ['effort-justification.js','detectEffortJustification'],
  'endowment_effect': ['endowment-effect.js','detectEndowmentEffect'],
  'illusion_of_control': ['illusion-of-control.js','detectIllusionOfControl'],
  'inverse_gamblers_fallacy': ['inverse-gamblers-fallacy.js','detectInverseGamblersFallacy'],
  'mental_accounting': ['mental-accounting.js','detectMentalAccounting'],
  'p_hacking': ['p-hacking.js','detectPHacking'],
  'peak_end_rule': ['peak-end-rule.js','detectPeakEndRule'],
  'perverse_incentive': ['perverse-incentive.js','detectPerverseIncentive'],
  'present_bias': ['present-bias.js','detectPresentBias'],
  'significance_effect_size': ['significance-effect-size.js','detectSignificanceEffectSize'],
  'tragedy_of_commons': ['tragedy-of-commons.js','detectTragedyOfCommons'],
  'winners_curse': ['winners-curse.js','detectWinnersCurse'],
};
for (const [dim,[file,fn]] of Object.entries(mods)) {
  let mod;
  try { mod = require(path.join(__dirname,'..','..','src',file)); }
  catch(e){ console.log(dim.padEnd(28), 'LOAD_FAIL', e.message.slice(0,50)); continue; }
  const f = mod[fn];
  if (typeof f !== 'function') { console.log(dim.padEnd(28), 'NO_FN', Object.keys(mod).join('/')); continue; }
  // 模块头注释里的样本句提取：取前几条「·」或编号样本
  console.log(dim.padEnd(28), 'OK  exports=', Object.keys(mod).join('/'));
}
