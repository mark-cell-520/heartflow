#!/usr/bin/env node
'use strict';
/* r361 归因诊断：非 pass 样本的真实承重维度 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const samples = [
  '重新分层调整之后，两组的治愈率一个升一个降',
  '重新分组后，两个班的成绩水涨船高，但这只是统计假象',
  '转班之后，两个班的成绩都提高了，因为每个学生都多做了练习',
  '学校按新方案给一批学生转班，两个班的平均分都提高了',
  '按新的分层标准重新分层调整之后，两组的治愈率都提高了',
  '重新分组之后，两组全不提高，改革毫无效果',
  '调整分组后，两组成绩全不上升，说明方法有问题',
];
for (const s of samples) {
  const r = hf.check(s);
  console.log(JSON.stringify({
    text: s.slice(0, 22),
    action: r.gate && r.gate.action,
    findings: (r.findings || []).map(f => f.dimension + ':' + f.severity),
    checked: (r.checked_by || []).map(c => c.layer + ':' + (c.action != null ? c.action : c.score)),
  }));
}
