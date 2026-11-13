/* r314 调试：gate() 对两模块新攻击的 findings 结构 */
'use strict';
const gateMod = require('../../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
for (const t of ['减肥下次一定，今晚这顿火锅先痛快吃了', '咱家的宅基地，千金不换，卖价免谈']) {
  const g = gateFn(t);
  console.log('---', t.slice(0, 20));
  console.log('action:', g.gate && g.gate.action, '| reason:', g.gate && g.gate.reason);
  console.log('findings:', JSON.stringify((g.findings || []).map(f => f.dimension)));
}
