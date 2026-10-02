// r385 探针 7：精确判定误抓形状 —— 「第X+序列量词」的 12 字窗口内是否接营销对象词。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

// 对照：营销词 + 序列量词（非第一阶段）—— 证明排除只针对「第+序列量词」形状
const CONTRAST = [
  '第一品牌解决方案行业领先',   // 真营销，营销词在场
  '第一阶段采用行业领先方案',   // 营销词 + 阶段词混合
  '第一步迈出自研模型系统',     // 首个自研
  '第一阶段用全球顶尖平台',     // 营销词 + 阶段词
  '首个方案在第一阶段上线',     // 营销词在前
];

for (const s of CONTRAST) {
  const r = gate.checkOutput(s);
  const f = (r.findings || []).find(x => x.dimension === 'confidence');
  console.log(JSON.stringify({ s: s.slice(0, 26), action: r.gate.action, hit: !!f, d: f ? String(f.details).slice(0, 50) : null }));
}
