const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));
  try {
    const domains = hf.knowledge.ontology.domains.map(d => ({ id: d.id, name: d.name, nameEn: d.nameEn }));
    console.log('DOM:', JSON.stringify(domains));
    const r = await hf.think('quantum mechanics 的最新进展如何');
    console.log('KD1:', JSON.stringify(r.knowledgeDomains));
    const r2 = await hf.think('medicine 领域最新研究');
    console.log('KD2:', JSON.stringify(r2.knowledgeDomains));
    const r3 = await hf.think('physics 的边界问题');
    console.log('KD3:', JSON.stringify(r3.knowledgeDomains));
  } catch (e) {
    console.log('ERR:', e.message);
  }
  process.exit(0);
})();
