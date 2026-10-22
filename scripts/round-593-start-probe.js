/**
 * [round 593] 找 start/启动入口并实测启动后 hf.knowledge 的真实形态。
 */
const { HeartFlow } = require('../src/core/heartflow.js');

const hf = new HeartFlow({ rootPath: process.cwd() });
const names = [];
let p = Object.getPrototypeOf(hf);
while (p && p.constructor && p.constructor.name !== 'Object') {
  for (const n of Object.getOwnPropertyNames(p)) names.push(n);
  p = Object.getPrototypeOf(p);
}
const uniq = [...new Set(names)];
console.log('含 start 的方法:', uniq.filter(n => /start|boot|launch|ready|run/i.test(n)).join(', '));

(async () => {
  const m = hf.start || hf.boot || hf.initialize;
  if (typeof m !== 'function') { console.log('无 start 类方法'); process.exit(0); }
  const r = m.call(hf);
  if (r && typeof r.then === 'function') await r;
  console.log('start 后 started =', hf.started);
  console.log('start 后 hf.knowledge:', hf.knowledge ? hf.knowledge.constructor.name : 'null');
  const k = hf.knowledge;
  if (k && typeof k.addEdge === 'function') {
    const s = 'probe593-' + Date.now();
    k.addEdge(s, 'probe-p', 'probe-o-' + Date.now(), 0.9);
    console.log('addEdge 后 query 命中:', (k.query({ subject: s }) || []).length);
    console.log('searchEntities 命中:', (k.searchEntities('probe593') || []).length);
    console.log('getRelated 类型:', Array.isArray(k.getRelated(s, 1)) ? 'array' : typeof k.getRelated(s, 1));
    console.log('graphAdapter.dataDir:', k.graphAdapter && k.graphAdapter.dataDir);
  } else if (k) {
    console.log('hf.knowledge 方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(k)).filter(x => x !== 'constructor').join(', '));
  }
  process.exit(0);
})();
