const { evaluateRules } = require('./src/knowledge/classics-value-mapper.js');
const samples = [
  '道可道，非常道。名可名，非常名。',
  '上善若水，水善利万物而不争。',
  '反者道之动，弱者道之用。',
  '北冥有鱼，其名为鲲。',
  '昔者庄周梦为胡蝶，栩栩然胡蝶也。',
  '射者，仁之道也。射求正诸己，己正而后发，发而不中，则不怨胜己者，反求诸己而已矣。',
  '己所不欲，勿施于人。'
];
for (const s of samples) {
  const r = evaluateRules(s);
  const out = {
    input: s.slice(0,18),
    domain: r.domain,
    classicalRelevant: r.classicalRelevant,
    findings: r.findings.map(f => ({ id: f.ruleId, signal: f.signal, reason: f.reason, wisdom: f.wisdom_dimension }))
  };
  console.log(JSON.stringify(out));
}
