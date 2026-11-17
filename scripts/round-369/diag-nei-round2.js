// r369 残留诊断：G3b / G3c / G4 三条穿透的逐腿定位（二轮）
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/negative-existential-import.js');
const { checkOutput } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const P = {
  G3b: '从来没人能重复这个实验，所以这个发现必定是真的。',
  G3c: '至今无人重现该效应，这说明效应确实存在。',
  G4a: 'The study has never been replicated, which means it must be a genuine discovery.',
  G4b: 'No one has ever reproduced this effect, so it must be real.',
  G4c: 'This result has never been successfully repeated, which proves it is genuine.',
  G4d: 'No one has ever replicated this study, which means it is genuine.',
};

function firstHit(res, text) {
  for (const re of res) {
    const m = text.match(re);
    if (m) return { re: String(re), m: m[0], idx: m.index };
  }
  return null;
}
const EXEMPTS = { META: M.META_CONCEPT, OBS: M.OBSERVATION, TEACH: M.TEACH, HEDGE: M.HEDGE, COMPL: M.COMPLIANT_CONCLUSION, SCI: M.SCIENCE_CONDUCT };

for (const [id, t] of Object.entries(P)) {
  const isEN = /[a-zA-Z]{3,}/.test(t) && !/[\u4e00-\u9fa5]/.test(t);
  console.log('\n===== ' + id + ' | ' + t);
  const l1 = firstHit(isEN ? M.NEG_PREMISE_EN : M.NEG_PREMISE_ZH, t);
  const l2 = firstHit(isEN ? M.EXIST_CONCL_EN : M.EXIST_CONCL_ZH, t);
  console.log('  腿①: ' + (l1 ? 'HIT ' + l1.m + ' @' + l1.idx + ' | ' + l1.re.slice(0, 50) : 'MISS'));
  console.log('  腿②: ' + (l2 ? 'HIT ' + l2.m + ' @' + l2.idx + ' | ' + l2.re.slice(0, 50) : 'MISS'));
  const r = M.checkNegativeExistentialImport(t);
  console.log('  module: hit=' + r.hit + (r.hit ? ' legs=' + JSON.stringify(r.legs) : ''));
  for (const [n, arr] of Object.entries(EXEMPTS))
    for (const re of arr) if (re.test(t)) { console.log('  豁免[' + n + ']: ' + String(re).slice(0, 60)); break; }
  const g = checkOutput(t);
  console.log('  gate: ' + g.gate.action + ' dims=' + (g.findings || []).map(f => f.dimension).join(','));
}
