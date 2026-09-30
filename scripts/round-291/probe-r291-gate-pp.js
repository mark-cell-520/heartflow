/**
 * 第 291 轮探针 2：gate.checkOutput vs discriminate 分歧定位
 * 样本：度量辩证族（见 test/pseudo-profundity-subtype-zh-r290.test.js 第 62 行）
 * 只打印数字与结构，不贴样本原文。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));

const SAMPLES = [
  ['度量辩证(失败项)', '幸福不是拥有得多，而是计较得少。'],
  ['主语域偏正(通过项)', '生命的意义不在于长短，而在于我们如何度过。'],
  ['明喻胜出(通过项)', '沉默是最深沉的告别，胜过千言万语。'],
];

for (const [name, s] of SAMPLES) {
  console.log(`== ${name} ==`);
  const r = gateMod.checkOutput(s);
  console.log('  action  =', r.gate && r.gate.action);
  console.log('  verdict =', r.verdict);
  console.log('  findings=', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, sev: f.severity, sc: f.score }))));
  console.log('  layers  =', JSON.stringify((r.checked_by || []).map(c => `${c.layer}:${c.action !== undefined ? c.action : c.score}`)));
  const d = idx.discriminate(s);
  console.log('  disc.findings=', JSON.stringify((d.findings || []).map(f => ({ d: f.dimension, sev: f.severity }))));
  const ds = d.dimensionScores || d.dimensions;
  if (ds) {
    const pp = Array.isArray(ds) ? ds.find(x => x.dimension === 'pseudo_profundity') : ds.pseudo_profundity;
    console.log('  disc.pp =', JSON.stringify(pp && { score: pp.score, count: pp.count, sev: pp.severity }));
  }
  // checkDraft / gate 别名
  for (const fn of ['gate', 'check', 'checkDraft']) {
    if (typeof gateMod[fn] === 'function') {
      try {
        const g = gateMod[fn](s);
        console.log(`  ${fn}.action =`, g.gate && g.gate.action, 'own=', (g.findings || []).some(f => f.dimension === 'pseudo_profundity'));
      } catch (e) { console.log(`  ${fn} err`, e.message); }
    }
  }
}
