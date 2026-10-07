'use strict';
// r574：定位最后一条漏判样本「他只有一点点违规，可你投诉的姿势也太难看了。」
const iv = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/selective-minimization.js').__internals();
const t = '他只有一点点违规，可你投诉的姿势也太难看了。';
for (const k of Object.keys(iv)) {
  console.log(k, iv[k].test(t) ? 1 : 0);
}
// 拆开看：分句 A / B 各自的命情况
const a = '他只有一点点违规';
const b = '可你投诉的姿势也太难看了';
console.log('--- clause A ---');
for (const k of Object.keys(iv)) console.log(k, iv[k].test(a) ? 1 : 0);
console.log('--- clause B ---');
for (const k of Object.keys(iv)) console.log(k, iv[k].test(b) ? 1 : 0);
