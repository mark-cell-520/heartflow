// r595：直接检查 lesson-retrieval 里 _formulaSafe 到底是什么
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const Module = require('module');
// 拦截 require，抓 lesson-retrieval 拿到的 formula-safe 实例
const orig = Module._load;
let captured = null;
Module._load = function (request, parent, isMain) {
  const m = orig.apply(this, arguments);
  if (request.includes('formula-safe')) captured = m;
  return m;
};
require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
Module._load = orig;

console.log('captured exports keys =', Object.keys(captured || {}));
const fsInst = captured && captured.getFormulaSafe ? captured.getFormulaSafe() : null;
console.log('instance proto methods =', fsInst ? Object.getOwnPropertyNames(Object.getPrototypeOf(fsInst)) : null);
console.log('typeof ebbinghausRetention =', fsInst ? typeof fsInst.ebbinghausRetention : null);
if (fsInst) {
  const WEEK = 7 * 24 * 3600 * 1000;
  const v = fsInst.ebbinghausRetention(0.5 * WEEK, WEEK, () => Math.exp(-1));
  console.log('in-lesson retrieval result =', v, 'finite =', Number.isFinite(v));
  console.log('instance ctor name =', fsInst.constructor && fsInst.constructor.name);
}
// cognitive bridge 的真实导出
const cb = require(path.join(ROOT, 'src/formula/cognitive-bridge.js'));
console.log('cognitive-bridge exports =', Object.keys(cb));
if (cb.getCognitiveBridge) {
  const b = cb.getCognitiveBridge();
  console.log('cognitive bridge proto =', Object.getOwnPropertyNames(Object.getPrototypeOf(b)));
}
