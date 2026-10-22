// r629 定性探针：D2.3 / D5.2 失败原因定位（不贴样本原文）
const { HeartFlow } = require('../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const ir = hf.instructions;
  const all = ir.getAll();
  console.log('TYPES' + JSON.stringify(all.map(i => ({ id: i.id, type: i.type, weight: i.weight }))));
  const t = '这些经验我留着自己用就行，没必要分享出去，也不用改。';
  const auditRes = ir.audit({ text: t, scenario: 'output_generation', confidence: 0.9 });
  console.log('AUDIT' + JSON.stringify(auditRes.map(r => ({ i: r.instruction, a: r.aligned, c: r.code }))));
  for (const id of ['serve_humans', 'continuous_improvement', 'truth', 'goodness', 'beauty', 'upgrade', 'reduce_errors']) {
    const r = ir.check(id, { text: t, scenario: 'output_generation', confidence: 0.9 });
    console.log('CHECK ' + id + ' ' + r.aligned + ' ' + (r.code || r.reason));
  }
  const routes = hf.routes();
  console.log('ROUTES_KEY_PRESENT ' + (Object.prototype.hasOwnProperty.call(routes, 'instructions') ? 'YES' : 'NO'));
  console.log('ROUTE_LIST' + JSON.stringify(routes.instructions));
  process.exit(0);
})().catch(e => { console.log('FATAL ' + e.message); process.exit(1); });
