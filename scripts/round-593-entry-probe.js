/**
 * [round 593] 找 HeartFlow 的真实初始化入口：枚举原型/实例上所有含 init 的方法，
 * 再枚举 dispatch 路由 key，确认哪个方法会把 _modules 填满。
 */
const { HeartFlow } = require('../src/core/heartflow.js');

const hf = new HeartFlow({ rootPath: process.cwd() });
const names = [];
let p = Object.getPrototypeOf(hf);
while (p && p.constructor && p.constructor.name !== 'Object') {
  for (const n of Object.getOwnPropertyNames(p)) names.push(n);
  p = Object.getPrototypeOf(p);
}
console.log('原型方法含 init 的:', [...new Set(names)].filter(n => /init/i.test(n)).join(', '));
console.log('原型含 knowledge 的:', [...new Set(names)].filter(n => /knowl/i.test(n)).join(', '));

// dispatch key 探测
if (typeof hf.dispatch === 'function') {
  const cands = ['knowledge.addEdge', 'knowledgeSubsystem.addEdge', 'knowledge.query', 'knowledge.stats'];
  for (const c of cands) {
    try {
      const r = hf.dispatch(c, { subject: 'A', predicate: 'r', object: 'B' });
      console.log('dispatch', c, '=>', JSON.stringify(r).slice(0, 120));
    } catch (e) { console.log('dispatch', c, 'throw:', e.message.slice(0, 80)); }
  }
} else {
  console.log('无 dispatch');
}
process.exit(0);
