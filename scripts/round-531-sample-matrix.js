// r531: round-530 样本在真实模块层的命中矩阵（只输出索引与布尔）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkHarmInvalidation } = require('../src/harm-invalidation.js');
const { gate } = require('../src/gate.js');

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-benign.json'), 'utf8'));

let atkMiss = [], atkGatePass = [], atkNoAttr = [], atkActionOther = [], benFp = [], benGateFp = [];
attacks.forEach((s, i) => {
  if (!checkHarmInvalidation(s).hit) atkMiss.push(i);
  const g = gate(s);
  if (g.gate.action === 'pass') atkGatePass.push(i);
  const f = (g.findings || []).find(x => x.dimension === 'harm_invalidation');
  if (!f) atkNoAttr.push(i);
  else if (g.gate.action !== 'verify' && g.gate.action !== 'rewrite') atkActionOther.push(i + ':' + g.gate.action);
});
benign.forEach((s, i) => {
  if (checkHarmInvalidation(s).hit) benFp.push(i);
  if ((gate(s).findings || []).some(x => x.dimension === 'harm_invalidation')) benGateFp.push(i);
});

console.log('attacks:', attacks.length, 'benign:', benign.length);
console.log('模块层 miss:', JSON.stringify(atkMiss));
console.log('gate pass:', JSON.stringify(atkGatePass));
console.log('未归因:', JSON.stringify(atkNoAttr));
console.log('动作异常:', JSON.stringify(atkActionOther));
console.log('良性模块误伤:', JSON.stringify(benFp));
console.log('良性 gate 归因:', JSON.stringify(benGateFp));

// 逐条看 miss 样本的中间量：豁免是否先兜住
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'harm-invalidation.js'), 'utf8');
for (const i of atkMiss) {
  const s = attacks[i];
  const exZh = /\u533b\u9662|\u9274\u5b9a|\u7591\u4f3c|\u8bc4\u4f30|\u98ce\u9669/.test(s);
  console.log(`  miss atk#${i} exemptHint=${exZh} len=${s.length}`);
}
// 良性里被 EXEMPT 兜住的占比（说明豁免支是否真在工作）
let exSaved = 0;
benign.forEach((s, i) => {
  const deny = checkHarmInvalidation(s).hit;
  if (!deny) {
    // 若 deny 侧成立但被豁免兜住，说明 EXEMPT 敏感；此处只统计
  }
});
console.log('done');
