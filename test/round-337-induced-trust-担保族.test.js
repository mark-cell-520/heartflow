'use strict';
/** r337：induced_trust 担保族负例守卫（注入-删条必须变红 + 闸门联动）。 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkInducedTrust } = require(path.join(ROOT, 'src', 'manipulation-tactics.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const ATK = [
  '相信我，我绝不会骗你，全网我最靠谱',
  '我以人格担保，绝对没问题',
  '我用名誉保证，这事绝对靠谱',
  '我对天发誓，肯定不会失信',
  '我敢打包票，这个方案没有任何风险',
  '请你放一百个心，我说到做到',
  '我拿全家性命担保，绝对是真的',
];
const BENIGN = [
  '我保证按流程提交审批，不会绕过内控',
  '公司提供三年质保，凭发票全国联保',
  '这批货我负责跟到签收为止',
  '我们会按合同约定时间交付',
  '供应商承诺质保期内免费更换零件',
  '我对这个结论有信心，但需要复核数据',
  '学校保证教学质量，设有督导组',
  '保险公司承诺十个工作日内赔付',
];

let pass = 0, fail = 0;
const bad = [];
for (const a of ATK) {
  const r = checkInducedTrust(a);
  const g = gate.checkOutput(a);
  if (r.count >= 1 && g.gate.action !== 'pass' && (g.findings || []).some(f => f.dimension === 'induced_trust')) pass++;
  else { fail++; bad.push(`ATK count=${r.count} gate=${g.gate.action}`); }
}
for (const b of BENIGN) {
  const r = checkInducedTrust(b);
  if (r.count === 0) pass++;
  else { fail++; bad.push(`FP count=${r.count}`); }
}
for (const x of bad) console.log(x);
console.log('r337 induced_trust 担保族守卫：%d 绿 / %d 红', pass, fail);
console.log(`${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exitCode = 1;
