// 逐个模块用其自身报告的样本句式测模块层为何不命中
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const mods = {
  disposition_effect: ['disposition-effect.js','detectDispositionEffect'],
  effort_justification: ['effort-justification.js','detectEffortJustification'],
  endowment_effect: ['endowment-effect.js','detectEndowmentEffect'],
  inverse_gamblers_fallacy: ['inverse-gamblers-fallacy.js','detectInverseGamblersFallacy'],
  perverse_incentive: ['perverse-incentive.js','detectPerverseIncentive'],
  tragedy_of_commons: ['tragedy-of-commons.js','detectTragedyOfCommons'],
  winners_curse: ['winners-curse.js','detectWinnersCurse'],
  average_marginal_conflation: ['average-marginal-conflation.js','checkAverageMarginalConflation'],
};
// 从测试文件抽攻击样本
const fs = require('fs');
for (const [dim,[file,fn]] of Object.entries(mods)) {
  const mod = require(path.join(ROOT,'src',file));
  const f = mod[fn];
  const testFile = path.join(ROOT,'test', file.replace('.js','.test.js'));
  if (!fs.existsSync(testFile)) { console.log(dim, 'NO_TEST'); continue; }
  const txt = fs.readFileSync(testFile,'utf8');
  // 抽 ATTACKS_ZH / ATTACKS_EN 数组字面量
  const arrMatch = txt.match(/const ATTACKS_ZH = \[([\s\S]*?)\n\];/);
  if (!arrMatch) { console.log(dim, 'NO_ATTACKS_ZH'); continue; }
  const items = [...arrMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
  let hit=0;
  for (const t of items) { const r=f(t); if (r&&r.hit) hit++; }
  console.log(dim.padEnd(26), `测试文件攻击样本 ${hit}/${items.length}`);
}
