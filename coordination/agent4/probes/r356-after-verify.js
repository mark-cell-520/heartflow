'use strict';
// r356 after-implementation verification: all probe attack sentences must now be
// non-pass with immortal_time_bias 承重 (gate layer) + module-level hit.
const hf = require('/data/home/heartflow/src/gate.js');
const itb = require('/data/home/heartflow/src/immortal-time-bias.js');
const I = itb.__internals();
console.log('ZH5=' + I.CASE_SURGE_ZH5.length, 'ZH6=' + I.CASE_SURGE_ZH6.length, 'DUZH6=' + I.DETECT_UP_ZH6.length, 'ICZH3=' + I.INCIDENCE_CLAIM_ZH3.length);
const atk = [
  // A 浮现族（干净腿框 5/5）
  '检查普及让大量潜伏病例浮现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例浮现，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例涌现出来，这说明患病率真的在上升。',
  '检查普及让大量潜伏病例显露出来，这说明患病率真的在上升。',
  // B 更新换代族（干净腿框 7/7）
  '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段升级换代让更多病例被重新发现，这说明患病率真的在上升。',
  '检测手段日新月异让更多病例被重新发现，这说明患病率真的在上升。',
  '检测能力今非昔比让更多病例被重新发现，这说明患病率真的在上升。',
  '检测升级让更多病例被重新发现，这说明患病率真的在上升。',
  '检查更新让更多病例被重新发现，这说明患病率真的在上升。',
  '检测技术迭代让更多病例被重新发现，这说明患病率真的在上升。',
  // C1 腿③趋势动词（发生率侧纯框 5/5）
  '检查普及让更多病例被重新发现，患病率一路走强。',
  '检查普及让更多病例被重新发现，患病率持续看涨。',
  '检查普及让更多病例被重新发现，患病率稳步升温。',
  '检查普及让更多病例被重新发现，患病率一路走热。',
  '检查普及让更多病例被重新发现，表明患病率一路走强。',
  // C2 被+副词（干净腿框穿透 + 代拦句）
  '检查普及以来，众多隐匿病灶被陆续发现，说明患病率真的在上升。',
  '检查普及以来，众多隐匿病灶被大量发现，说明患病率真的在上升。',
  '检查普及让更多病例被及时发现，这说明患病率真的在上升。',
  // 良性豁免核对（应保持 pass）
];
let ok = 0;
for (const t of atk) {
  const r = hf.gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
  const mod = itb.checkImmortalTimeBias(t);
  if (r.gate.action !== 'pass' && f) ok++;
  console.log((r.gate.action !== 'pass' && f ? 'OK ' : 'FAIL') + ' [' + r.gate.action + '] mod=' + mod.hit + ' ' + t.slice(0, 38));
}
console.log('gate-layer covered: ' + ok + '/' + atk.length);
const benign = [
  '检查普及让大量潜伏病例浮现出来，但这并不代表发病率真的上升。',
  '检查普及让大量潜伏病例浮现出来，实验室已将其纳入随访名单。',
  '检测手段更新换代让更多病例被重新发现，但这并不代表发病率真的上升。',
  '检测手段更新换代让早期确诊比例明显提高，是体检中心的常规推荐。',
  '产品检测流程更新后，用户投诉率下降了三成。',
  '系统检测模块更新后，线上报警数量明显下降。',
  '软件检查工具迭代后，代码缺陷率下降了三成。',
  '检查普及让更多病例被重新发现，但患病率可能并没有上升。',
  '检查普及让更多病例被重新发现，患病率统计口径本身没有变化。',
  '检查普及让更多病例被及时发现，这主要是检出提前带来的统计错觉。',
  '检查普及让更多病例被及时发现，但这并不代表发病率真的上升。',
  '检查普及以来，众多隐匿病灶被不断识别，但这并不代表发病率真的上升。',
  '检查普及以来，无症状感染者被陆续确诊并转入随访，流程运转正常。',
  '检查普及让更多病例被重新发现，患病率可能并没有走强。',
];
let bfp = 0;
for (const t of benign) {
  const mod = itb.checkImmortalTimeBias(t);
  if (mod.hit && (mod.detail.includes('过度诊断发生率误读') || mod.detail.includes('overdiagnosis-incidence'))) { bfp++; console.log('FP! ' + t); }
}
console.log('module-level path-h FP on benign: ' + bfp + '/' + benign.length);
