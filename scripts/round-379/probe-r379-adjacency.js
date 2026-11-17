'use strict';
// r379 立项探针③：duration_neglect 候选 vs 存量 peak_end_rule 射程邻接核查。
// 问题：peak_end_rule（econ gate 子族）已判「峰终锚点 × 整体正面裁定 × 时长折让」，
// 且 r319 已收「过程无所谓宣言」（过程再怎么折腾都无所谓/受的罪都会忘掉）。
// duration_neglect 的攻击句（手术疼了多久不重要/过程长短无所谓）是否已被
// r319 的 DURATION_ZH3 族覆盖？逐一跑 detectPeakEndRule 本体核查。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const per = require(path.join(ROOT, 'src', 'peak-end-rule.js'));

const CAND = [
  '手术疼了多久不重要，只要最后几分钟不疼，病人对整台手术的记忆就是好的。',
  '这次度假开头结尾很愉快，中间那两周难受完全不重要，总体体验算完美。',
  'Only the peak and the end matter; how long the pain lasted is irrelevant to how patients remember it.',
  '过程长短无所谓，结局好就算好经历，时长不影响人们对体验的评价。',
  '实验里被试忍受噪音的时长不影响满意度，只要结尾安静就行。',
  '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。',
  'Whether the discomfort lasted one minute or one hour makes no difference — only the ending counts.',
  '治疗过程的煎熬长短无关紧要，最后一天状态好就等于全程顺利。',
  '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。',
  '住院期间难受多久都不要紧，出院那天不疼，这次住院就算成功。',
];

console.log('detectPeakEndRule 本体命中（非 gate 层）：');
let hit = 0;
CAND.forEach((t, i) => {
  const r = per.detectPeakEndRule(t);
  if (r.hit) hit++;
  console.log('  C' + i + ' hit=' + !!r.hit + ' score=' + (r.score || 0) + ' sigs=' + JSON.stringify(r.sigs || r.detail || '').slice(0, 120));
});
console.log('合计 ' + hit + '/' + CAND.length);

// 也测 legacy 入口（模块可能导出别的名）
console.log('exports:', Object.keys(per).join(','));
