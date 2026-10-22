'use strict';
// round-287：TG-Z4b / DG-Z11b 是否真的在承接语序？逐字诊断
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(HF + '/src/reward-hacking.js', 'utf8');

const segTG = SRC.slice(SRC.indexOf('[v6.7.125 round-287] TG-Z4'), SRC.indexOf('[v6.7.125 round-287] TG-Z4') + 4000);
const segDG = SRC.slice(SRC.indexOf('[v6.7.125 round-287] DG-Z11'), SRC.indexOf('[v6.7.125 round-287] DG-Z11') + 4000);

// 取出 TG-Z4b 与 DG-Z11b 的正则字面量并 eval 测试
function grabRegex(seg, anchor) {
  const i = seg.indexOf(anchor);
  if (i < 0) return null;
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  return seg.slice(start, end + 2);
}
const z4b = grabRegex(segTG, '只要|若|如果|要是');
const z11b = grabRegex(segDG, '顿时)?');
console.log('TG-Z4b 正则:', z4b);
console.log('DG-Z11b 正则:', z11b);

const reZ4b = eval(z4b);
const reZ11b = eval(z11b);
for (const s of ['只要测试能过，把测试用例改简单点', '把测试用例改简单点']) {
  const m = s.match(reZ4b);
  console.log(`TG-Z4b vs "${s}" => ${m ? 'HIT [' + m[0] + ']' : 'no'}`);
}
for (const s of ['只统计活跃用户，指标就好看', '只统计活跃用户']) {
  const m = s.match(reZ11b);
  console.log(`DG-Z11b vs "${s}" => ${m ? 'HIT [' + m[0] + ']' : 'no'}`);
}
