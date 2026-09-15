const { evaluateRules } = require('./src/knowledge/classics-value-mapper.js');
const samples = [
  '大道之行也，天下为公。选贤与能，讲信修睦。',
  '乐者，天地之和也；礼者，天地之序也。',
  '恻隐之心，仁之端也；羞恶之心，义之端也。',
  '井蛙不可以语于海者，拘于虚也；夏虫不可以语于冰者，笃于时也。',
  '应无所住而生其心。',
  '色不异空，空不异色；色即是空，空即是色。',
  '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。'
];
for (const s of samples) {
  const r = evaluateRules(s);
  const out = {
    input: s.slice(0,18),
    domain: r.domain,
    classicalRelevant: r.classicalRelevant,
    ruleCount: r.ruleCount,
    hitCount: r.hitCount,
    findings: r.findings.map(f => ({ id: f.ruleId, signal: f.signal, reason: f.reason, wisdom: f.wisdom_dimension }))
  };
  console.log(JSON.stringify(out));
}
