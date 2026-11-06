'use strict';
/**
 * scripts/smoke-r723-think.js — r723 遗留改动真实调用冒烟
 * 纪律：只 require 不调用不算验证——必须 new HeartFlow + think() 跑正反两例。
 * 覆盖 r723 三处改动：① 名动同形填充槽尾限定词阻断 ② 零贡献归罪族量化形补全
 * ③ every/each 零贡献支捕获槽守卫豁免。
 */
const path = require('path');
const { HeartFlow } = require('C:/Users/USER782663/heartflow-engine/src/core/heartflow.js');

(async () => {
  const hf = new HeartFlow({ silent: true, dataDir: 'C:/Users/USER782663/heartflow-engine/data' });
  hf.start();
  await new Promise(r => setTimeout(r, 500));

  let pass = 0, fail = 0;

  async function hasHG(text) {
    const r = await hf.think(text);
    // think() 真实返回形状：辨别结果在 _inputDiscrimination.dims.<维度>（非 gate/findings）
    const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    const hg = dims.hasty_generalization;
    return !!(hg && Array.isArray(hg.signals) && hg.signals.length > 0);
  }

// 正例：应命中 hasty_generalization（r723 新增/修复的命中面）
const POS = [
  ['主判据 everyone', 'Everyone ignores security warnings.'],
  ['PP尾名词+动词 everyone', 'Everyone on the team ignores the docs.'],
  ['all 族零贡献支', 'All developers leave no comments.'],
  ['all 族 without 形', 'All applicants respond without feedback.'],
  ['nobody 贡献动词支', 'No one updates the docs.'],
  ['every/each 零贡献捕获槽', 'Every customer always leaves no comments in the survey.'],
];
// 反例：不应命中（名动同形误伤修复 + 规范情态豁免 + 功能形）
const NEG = [
  ['名动同形修饰读法 audit team', 'Everyone on the audit team must verify the findings.'],
  ['名动同形修饰读法 test group', 'Nobody in the test group completed the survey.'],
  ['all 族规范情态豁免', 'All users must leave no trace in the audit log.'],
  ['without 不收（规范陈述）', 'No one leaves without signing out.'],
  ['功能形无零贡献要素', 'Every developer leaves documentation.'],
  ['功能形 all 族', 'All reviewers send the report.'],
];

for (const [label, text] of POS) {
  const hit = await hasHG(text);
  if (hit) { pass++; console.log(`✅ [正例命中] ${label}: ${text}`); }
  else { fail++; console.log(`❌ [正例漏判] ${label}: ${text}`); }
}
for (const [label, text] of NEG) {
  const hit = await hasHG(text);
  if (!hit) { pass++; console.log(`✅ [反例放行] ${label}: ${text}`); }
  else { fail++; console.log(`❌ [反例误伤] ${label}: ${text}`); }
}

  console.log(`\nr723 think() 冒烟: ${pass} 通过, ${fail} 失败, 共 ${POS.length + NEG.length} 个`);
  process.exit(fail === 0 ? 0 : 1);
})();
