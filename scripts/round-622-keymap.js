// scripts/round-622-keymap.js
// 列出 _modules 的真实键，与 CANDS（实例访问器名）做映射，并输出每个实例的路由数。
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const ALLOWS = HeartFlow.ALLOWED_ROUTES ? Array.from(HeartFlow.ALLOWED_ROUTES) : [];
const keys = Object.keys(hf._modules || {});
console.log('MODULES=' + keys.length);
console.log('MODULE_KEYS=' + keys.join(','));
for (const k of keys) {
  const inst = hf._modules[k];
  if (!inst || typeof inst !== 'object') continue;
  const proto = Object.getPrototypeOf(inst);
  const methods = proto ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function') : [];
  console.log('MOD|' + k + '|methods=' + methods.length);
}
