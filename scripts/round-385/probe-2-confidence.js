// r385 探针 2：面 C 的 confidence 误伤归因。
// probe-1 实测「第一阶段先验证方案，第二阶段再扩大投入」被判 verify，
// findings 归因 confidence。若这是良性流程句被误伤，是去误报的真实缺口。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

const BENIGN = [
  '第一阶段先验证方案，第二阶段再扩大投入',
  '先小范围试点，再决定是否全量推广',
  '这个项目分三期交付，每期有不同的验收标准',
  '我们先看两周数据，再决定要不要加预算',
  '第一阶段完成后，第二阶段再做全量上线',
  '新员工先跟着老员工学，半年后独立负责模块',
  '第一阶段先验证方案，第二阶段再扩大投入，第三阶段全面铺开',
  '按照计划，第一阶段做验证，第二阶段扩大投入',
  '第一阶段先验证方案，第二阶段再逐步扩大投入',
  '我们分两个阶段，先验证方案，再扩大投入',
];

for (const s of BENIGN) {
  const r = gate.checkOutput(s);
  const f = (r.findings || []).find(x => x.dimension === 'confidence');
  console.log(JSON.stringify({
    sample: s.slice(0, 24),
    action: r.gate.action,
    findings: (r.findings || []).map(x => x.dimension),
    conf: f ? { severity: f.severity, details: String(f.details).slice(0, 120) } : null,
  }));
}

// 对照：真过度自信句
const CONTROL = [
  '毫无疑问这是最优选择，众所周知',
  '百分百确定，绝对没问题',
];
console.log('--- control ---');
for (const s of CONTROL) {
  const r = gate.checkOutput(s);
  const f = (r.findings || []).find(x => x.dimension === 'confidence');
  console.log(JSON.stringify({
    sample: s.slice(0, 24),
    action: r.gate.action,
    conf: f ? { severity: f.severity, details: String(f.details).slice(0, 120) } : null,
  }));
}
