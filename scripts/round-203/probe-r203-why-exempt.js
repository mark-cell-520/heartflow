#!/usr/bin/env node
/** 第 203 轮探针：为什么「调试环境把审计日志的鉴权注释掉」exempt=true。 */
const path = require('path');
const de = require(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'));
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'), 'utf8');

const s = '调试环境把审计日志的鉴权注释掉';
// 复刻 isDevDebugContext 头部的三条否决逐条测
const fns = ['MALICIOUS_INTENT', 'SECURITY_BOUNDARY', 'PROD_CONTEXT'];
for (const name of fns) {
  const m = src.match(new RegExp('const ' + name + ' = ([^;]+);'));
  if (m) console.log(name, '=', eval(m[1]).test(s));
}
// _securityIsVerbObject 是函数，不能 eval；直接看结果
console.log('_securityIsVerbObject =', de.isDevDebugContext(s) ? '(被放过，函数内应为false)' : 'true');

// SEC_OBJ_VERB 循环拆解
const vm = src.match(/const SEC_OBJ_VERB = ([^;]+);/);
const sm = src.match(/const SECURITY_BOUNDARY = ([^;]+);/);
const SEC_OBJ_VERB = eval(vm[1]);
const SECURITY_BOUNDARY = eval(sm[1]);
for (const m of s.matchAll(SEC_OBJ_VERB)) {
  const before = s.slice(Math.max(0, m.index - 24), m.index);
  const ba = before.search(/[把將]/);
  const between = ba >= 0 ? before.slice(ba + 1) : null;
  console.log(JSON.stringify({
    verb: m[0], verbIdx: m.index,
    hasBa: ba >= 0, between,
    hasLoc: between ? /[里中内上下]/.test(between) : null,
    secHit: between ? (SECURITY_BOUNDARY.exec(between) || [null])[0] : null,
    deAfter: between ? between.slice((SECURITY_BOUNDARY.exec(between) || [''])[0].length) : null,
  }));
}
