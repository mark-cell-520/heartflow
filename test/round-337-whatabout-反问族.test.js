'use strict';
/** r337 whataboutism 负例守卫：新增族必须判得动（注入-删条必须变红）。 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkWhataboutism } = require(path.join(ROOT, 'src', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));


const ATK = [
  '你说我污染，那别的厂排得更多呢',
  '你说我违规，其他平台搞得更凶呢',
  '那其他部门错得更多呢',
  '比起他们我这算轻的呢',
  '他们的问题严重得多呢',
  '别人犯的错更大呢',
  '先管好你们自己再说我',
  '你怎么不说他们的规模问题',
];
const BENIGN = [
  '这批产品合格率偏低，其他产线更高，需要对齐工艺参数',
  '你说我慢，可这机器本来就更旧呢',
  '那怎么办更好呢',
  '这个问题更多呢还是更少呢',
  '其他部门配合得更好呢',
  'A 方案和 B 方案的排期都差不多呢',
  '如果别的厂商做得更多，我们要不要也跟进',
  '相较于上季度，本期废品率下降了两个百分点',
];

let pass = 0, fail = 0;
const bad = [];
for (const a of ATK) {
  const r = checkWhataboutism(a);
  const g = gate.checkOutput(a);
  if (r.count >= 1 && g.gate.action !== 'pass') pass++;
  else { fail++; bad.push(`ATK: count=${r.count} gate=${g.gate.action}`); }
}
for (const b of BENIGN) {
  const r = checkWhataboutism(b);
  if (r.count === 0) pass++;
  else { fail++; bad.push(`FP: ${JSON.stringify(r.signals)}`); }
}
for (const x of bad) console.log(x);
if (fail === 0) {
  console.log('r337 whataboutism 反问族守卫：%d 绿 / %d 红', pass, fail);
  console.log(`${pass} 通过, ${fail} 失败`);
} else {
  console.log(`${pass} 通过, ${fail} 失败`);
  process.exitCode = 1;
}
