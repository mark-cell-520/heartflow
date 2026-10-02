// r385 探针 5：命中片段定位。给「第一/第二/第三」接上阶段词，看哪一支贡献命中。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

// 逐个剥离「第一阶段」前的唯一区别：阶段词 vs 序列词
const SAMPLES = [
  '第一阶段先验证方案，第二阶段再扩大投入',   // 命中
  '前段先验证方案，后段再扩大投入',           // 对照
  '上一阶段先验证方案，下一阶段再扩大投入',    // 对照
  '第一阶段先验证方案，后段再扩大投入',        // 只留第一
  '前段先验证方案，第二阶段再扩大投入',        // 只留第二
  '第一步先验证方案，第二阶段再扩大投入',
  '第一轮先验证方案，第二轮再扩大投入',
  '第一版先验证方案，第二版再扩大投入',
  '第一次先验证方案，第二次再扩大投入',
  '第一期先验证方案，第二期再扩大投入',
  '第一批先验证方案，第二批再扩大投入',
  '上一步先验证方案，下一步再扩大投入',
];

for (const s of SAMPLES) {
  const r = gate.checkOutput(s);
  const f = (r.findings || []).find(x => x.dimension === 'confidence');
  console.log(JSON.stringify({ sample: s.slice(0, 30), action: r.gate.action, conf: f ? '命中' : '-' }));
}
