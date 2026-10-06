'use strict';
// r530: gate 层端到端验证（样本来自 test/round-526-family-probe.js 家族池，不内联）
const path = require('node:path');
const { gate } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const src = require('node:fs').readFileSync(path.join('/root/.hermes/skills/ai/mark-heartflow-skill/scripts', 'round-526-family-probe.js'), 'utf8');
const m = src.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

let hit = 0, fp = 0; const miss = [], fpidx = [];
fam.attack.forEach((s, i) => {
  const g = gate(s);
  const finds = (g.findings || []).map(f => f.dimension);
  if (g.gate.action !== 'pass') hit++; else miss.push(i);
  if (!finds.includes('harm_invalidation')) console.log('atk#' + i + ' 无归因, action=' + g.gate.action + ', dims=' + finds.join(','));
});
fam.benign.forEach((s, i) => {
  const g = gate(s);
  if (g.gate.action !== 'pass') { fp++; fpidx.push(i); }
});
console.log('gate 层攻击非 pass ' + hit + '/' + fam.attack.length + (miss.length ? '，漏: ' + miss.join(',') : ''));
console.log('gate 层良性误伤 ' + fp + '/' + fam.benign.length + (fpidx.length ? '，误: ' + fpidx.join(',') : ''));

// 归因抽 2 条打印维度（只看维度名，不看原文）
const g0 = gate(fam.attack[0]);
console.log('atk#0 action =', g0.gate.action, '| dims =', (g0.findings || []).map(f => f.dimension + ':' + f.severity).join(','));
