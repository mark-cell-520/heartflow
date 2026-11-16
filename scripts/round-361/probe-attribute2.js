#!/usr/bin/env node
'use strict';
/* r361 归因诊断 3：全部探针样本的 traceSummary 归因 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const wr = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));

const ATTACK = [
  ['A1 转班', '学校按新方案给一批学生转班，两个班的平均分都提高了'],
  ['A2 并班', '并班之后，两个班的成绩一起涨了'],
  ['A3 并班重排', '学校把两个班并班重排，快班和慢班的及格率都上升了'],
  ['A4 分层调整', '按新的分层标准重新分层调整之后，两组的治愈率都提高了'],
  ['A5 分层变动', '重新分层变动后，两组的生存率双双上升'],
  ['B1 水涨船高', '重新分组之后，两组的指标水涨船高'],
  ['B2 无一例外', '调整分组之后，两组成绩无一例外地提高了'],
  ['B3 齐刷刷', '重新分组后，两个班的分数齐刷刷地涨了'],
  ['B4 一律', '转班之后，两个班的成绩一律提升了'],
  ['C1 fared', 'After regrouping, both cohorts fared better.'],
  ['C2 fared2', 'The new brackets moved some students up a tier, and both tiers fared better.'],
  ['C3 fared3', 'Reclassifying patients improved outcomes, and both groups fared better than before.'],
  ['D1 全不提高', '重新分组之后，两组全不提高，改革毫无效果'],
  ['D2 全不上升', '调整分组后，两组成绩全不上升，说明方法有问题'],
  ['E1 cut-offs', "Changing the cut-offs moved several patients between stages, and both stages' survival improved."],
  ['E2 cut-offs2', "The revised cut-offs shifted some students between groups, and both groups' scores rose."],
];
const BENIGN = [
  ['N1 一升一降', '重新分层调整之后，两组的治愈率一个升一个降'],
  ['N2 水涨船高+假象', '重新分组后，两个班的成绩水涨船高，但这只是统计假象'],
  ['N3 转班+个体', '转班之后，两个班的成绩都提高了，因为每个学生都多做了练习'],
  ['N4 fared+every', 'Every student in both cohorts fared better after the new training program.'],
];
console.log('=== ATTACK（期望：修复后全非 pass）===');
for (const [k, s] of ATTACK) {
  const r = hf.check(s);
  const m = wr.detectWillRogersPhenomenon(s);
  console.log(k + ' | gate=' + r.action + ' | module=' + (m.hit ? 'HIT' : 'miss') + ' | ' + (r.traceSummary || '').slice(0, 120));
}
console.log('=== BENIGN（期望：全 pass；非 pass 者须证归因非 will_rogers）===');
for (const [k, s] of BENIGN) {
  const r = hf.check(s);
  const m = wr.detectWillRogersPhenomenon(s);
  console.log(k + ' | gate=' + r.action + ' | module=' + (m.hit ? 'HIT' : 'miss') + ' | ' + (r.traceSummary || '').slice(0, 140));
}
