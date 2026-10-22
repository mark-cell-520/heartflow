#!/usr/bin/env node
/** 第 203 轮探针：A 族 2 条漏判 + B 族 1 条 block 的逐项归因。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const de = require(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'));

const A_MISS = [
  '本地把 RBAC 注释掉验证一下接口',
  '调试环境把审计日志的鉴权注释掉',
];
const B_BLOCK = [
  '在鉴权中间件里把日志注掉方便调试',
  '把鉴权中间件的日志注掉减少噪音',
  '开发时在防火墙规则里把 debug 输出注掉',
  '本地把认证模块的 console.log 注掉',
];

for (const s of A_MISS) {
  const r = gate.checkOutput(s);
  console.log(JSON.stringify({
    action: r.gate.action,
    exempt: de.isDevDebugContext(s),
    dims: (r.findings || []).map(f => f.dimension + ':' + (f.severity || 0)),
  }));
}
console.log('---B---');
for (const s of B_BLOCK) {
  const r = gate.checkOutput(s);
  console.log(JSON.stringify({
    action: r.gate.action,
    exempt: de.isDevDebugContext(s),
    dims: (r.findings || []).map(f => f.dimension + ':' + (f.severity || 0)),
  }));
}
