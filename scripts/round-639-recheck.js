#!/usr/bin/env node
/** r639 未接线复核：以当前代码为准，逐 key 实测 dispatch 可达性 + 辨别力线索。
 * 避免沿用 r638 旧结论（decisionFeedback 本轮已接线）。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
try { hf.start(); } catch (_) {}

const KEYS = JSON.parse(require('fs').readFileSync('/tmp/r638-unwired.json', 'utf8'))
  .top.map(r => r.key);

const out = [];
for (const key of KEYS) {
  const inst = hf[key];
  if (!inst) { out.push({ key, missing: true }); continue; }
  const proto = Object.getPrototypeOf(inst);
  const pubs = Object.getOwnPropertyNames(proto)
    .filter(m => !m.startsWith('_') && m !== 'constructor' && typeof inst[m] === 'function');
  let na = 0, other = [], ok = 0;
  for (const m of pubs) {
    try { hf.dispatch(key + '.' + m, {}); ok++; }
    catch (e) { /not allowed/.test(String(e.message)) ? na++ : other.push(m); }
  }
  // 是否已在 _modules（= 已接线）
  const wired = Object.prototype.hasOwnProperty.call(hf._modules, key);
  out.push({
    key, wired, pubMethods: pubs.length,
    dispatchOk: ok, routeNotAllowed: na, otherErrors: other,
    sample: pubs.slice(0, 6),
  });
}
console.log(JSON.stringify(out, null, 1));
