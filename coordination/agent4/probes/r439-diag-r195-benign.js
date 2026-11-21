// 一次性诊断：round-195 良性失败样本定位（是否 r437 新族引入）
'use strict';
const { gate } = require('/data/home/heartflow/src/gate.js');
const rtm = require('/data/home/heartflow/src/regression-to-the-mean.js');
const samples = [
  '孩子上学期成绩垫底，这学期回到中游，可能是试了新的补课班起了作用。',
  '孩子上学期成绩垫底，这学期回到中游，可能是试了新的补课班。',
];
for (const s of samples) {
  const r = gate(s);
  const dims = ((r && r.findings) || []).map(f => f.dimension);
  const mod = rtm.checkRegressionToMean(s);
  console.log(JSON.stringify(s));
  console.log('  gate.action=' + (r.gate && r.gate.action) + ' findings=' + JSON.stringify(dims) + ' moduleHit=' + mod.hit + ' detail=' + mod.detail);
}
