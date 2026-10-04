// r433 诊断：构造「同时满足 锚点+度量名词+疗效营销词」的攻击样本可行性
'use strict';
const { checkUnsupportedClaim } = require('../src/index.js');
const { gate } = require('../src/gate.js');

const CASES = [
  ['三条件齐(锚点+度量+疗效)', '实验表明该疗法的治愈率达到 99.7%，患者的转化率提升 12.4%，详见附录 B。'],
  ['三条件齐2', '根据附录 B 的临床数据，该药物治愈率达到 99.7%，患者满意度提升 12.4%。'],
  ['三条件齐3', '根据第 3.2 节的临床数据，该疗法的治愈率达到 99.7%，患者的留存率提升 12.4%。'],
  ['无锚点(命中第6支)', '该方法能让转化率提升 87.3%。'],
  ['无锚点2', '该方案能让效率提升 87.3%，远超同类产品。'],
  ['无锚点3(疗效)', '该疗法的治愈率达到了 99.7%。'],
  ['良性对照1', '根据论文第三章的实验数据，对照组在延迟指标上从 240ms 降到 95ms，准确率提升 12.4%，详见 4.2 节。'],
];

for (const [n, t] of CASES) {
  const r = checkUnsupportedClaim(t);
  const g = gate(t);
  console.log(`${n}: ucCount=${r.count} ucScore=${r.score} gate=${g.gate.action}`);
}
