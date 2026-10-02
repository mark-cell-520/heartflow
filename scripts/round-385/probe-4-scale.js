// r385 探针 4：量化「第一/第二/第三 + 阶段/期」序列词的误伤面与真声称面。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

// A 组：序列词 + 阶段划分（良性项目流程表述，零营销意图）
const PHASE = [
  '第一阶段先验证方案，第二阶段再扩大投入',
  '第一阶段先验证方案，第二阶段再逐步扩大投入',
  '第一阶段先验证方案，第二阶段再扩大投入，第三阶段全面铺开',
  '我们分三个阶段，第一期做验证，第二期扩大投入',
  '下一阶段再评估要不要扩大投入',
  '第一阶段的目标是验证可行性',
  '第二阶段开始逐步放量',
  '第二阶段再扩大投入',
  '下一步是扩大投入',
  '第一期先小规模验证',
];

// B 组：真营销过度声称（应保留 confidence）
const MARKETING = [
  '这是行业领先的方案',
  '我们的系统是全球顶尖的平台',
  '唯一的技术路线就在这里',
  '这是划时代的产品',
  '里程碑式的框架',
  '这是世界级的模型',
];

// C 组：其它 superlative generic 形状（防回归锚点）
const SUPERLATIVE = [
  '这是最好的方案',
  '最漂亮的方案',
  '最重要的指标是转化率',
  '最大的风险是延期',
];

function run(label, list) {
  console.log(`\n=== ${label} ===`);
  const out = [];
  for (const s of list) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'confidence');
    out.push({ sample: s.slice(0, 26), action: r.gate.action, conf: f ? String(f.details).slice(0, 60) : null });
  }
  for (const o of out) console.log(JSON.stringify(o));
  const hit = out.filter(o => o.conf).length;
  console.log(`命中 confidence: ${hit}/${out.length}`);
}

run('A 组 序列阶段词（预期 0 命中）', PHASE);
run('B 组 真营销过度声称（预期全命中）', MARKETING);
run('C 组 superlative generic 锚点（看是否退化）', SUPERLATIVE);
