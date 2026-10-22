// r627 诊断：dr-dont-self-myth 误伤根因量化。只输出数字与 matchId，不贴样本原文（451 纪律）。
'use strict';
const fs = require('fs');
const path = require('path');
const { StrategicRestraint } = require(path.join(__dirname, '..', 'src', 'cortex', 'strategic-restraint.js'));
const SAMPLES = require(path.join(__dirname, '..', 'test', 'round-626-strategic-restraint-samples.js'));

console.log('CONFIG_FILE_exists=' + fs.existsSync(path.join(__dirname, '..', 'data', 'strategic-restraint.json')));

const stop2Grams = new Set(['能力', '模块', '生成', '构建', '模型', '输出', '语言', '分析', '系统', '功能', '一个']);
const sr = new StrategicRestraint();
sr.load();

function detail(proposal) {
  const proposalLower = proposal.toLowerCase();
  const proposalClean = proposalLower.replace(/["「」『』]/g, '');
  const proposal2grams = new Set(sr._extractKeywords(proposal));
  const out = [];
  for (const item of sr._dontList) {
    if (item.expiringAt && item.expiringAt < Date.now()) continue;
    const subItems = item.item.split(/[/，,、]/).filter(s => s.trim().length >= 2).map(s => s.trim().toLowerCase().replace(/["「」『』]/g, ''));
    const subItemMatch = subItems.some(sub => proposalClean.includes(sub));
    const subItem2grams = [...new Set(subItems.flatMap(s => sr._extractKeywords(s)))];
    const hits = subItem2grams.filter(k => proposal2grams.has(k) || proposalLower.includes(k));
    const hitRatio = subItem2grams.length > 0 ? hits.length / subItem2grams.length : 0;
    const itemCore = sr._extractKeywords(item.item).filter(k => !(k.length === 2 && stop2Grams.has(k)));
    const coreOverlap = itemCore.filter(k => proposal2grams.has(k));
    const coreScore = itemCore.length > 0 ? (coreOverlap.length / Math.max(itemCore.length, 1)) * 0.65 : 0;
    const anyHitKw = subItem2grams.filter(k => k.length >= 2 && !stop2Grams.has(k) && (proposal2grams.has(k) || proposalClean.includes(k)));
    const anyHit = anyHitKw.length > 0;
    out.push({
      matchId: item.id,
      subItemMatch,
      hitRatio: +hitRatio.toFixed(3),
      hits,
      coreOverlap,
      coreScore: +coreScore.toFixed(3),
      anyHitKw,
      anyHitScore: anyHit ? item.strength * 0.2 : 0,
    });
  }
  return out.filter(o => o.subItemMatch || o.hitRatio >= 0.3 || o.coreScore > 0 || o.anyHit);
}

const ids = ['A4-self-myth', 'C2-mission-selfknow', 'C3-mission-selfheal', 'C4-mission-state', 'B1-neutral-judge'];
for (const c of SAMPLES.CASES) {
  if (!ids.includes(c.id)) continue;
  const ev = sr.evaluate(c.proposal);
  console.log('\n=== ' + c.id + ' restrained=' + ev.restrained + ' score=' + ev.score + ' top=' + (ev.matches[0] ? ev.matches[0].matchId : null));
  for (const d of detail(c.proposal)) console.log('   ' + JSON.stringify(d));
}
console.log('\nDONE');
