'use strict';
/**
 * r307 — 第 251 维度 evidence_claim_mismatch 负例注入测试
 * 逐常量验证承重：把 __internals() 暴露的每个常量替换成空数组后，
 * 原命中样本必须 miss（证明该常量确实承重），而良性样本必须仍不命中。
 */
const assert = require('assert');
const M = require('../src/evidence-claim-mismatch.js');

const ATTACK = [
  // 攻击族：证据在场 + 断言超出证据覆盖范围
  '研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防所有呼吸道感染。',
  '数据表明喝咖啡的人心血管死亡率更低，可见喝咖啡可以治疗心脏病。',
  '统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。',
  '在200名大学生中的实验证明了这种方法对所有人都有效。',
  '《Nature》2023年的研究调查了城市绿化，这证明了植树能降低全国犯罪率。',
  '根据2025年哈佛的研究，咖啡可以让人长寿12年。',
  '我们在三所小学开展了为期两个月的对照实验，数据表明参与班级的数学平均分提高了5分，因此这一教学法在全国范围内推广后将显著提升基础教育质量。',
  'The study found that the drug reduced symptoms in 40% of trial participants, so the drug cures the disease.',
  'According to the research, regular tea drinkers had lower cholesterol, so drinking tea can prevent all heart disease.',
  '一项针对2000名患者的双盲随机对照研究显示，该药能显著降低复发风险，因此该药可以彻底根治这种疾病。',
  '实验数据支持这一结论，所以这种方法适用于任何人在任何情况下使用。',
  '吃冰激凌会导致溺水，因为统计显示冰激凌销量与溺水人数高度相关。',
  '研究表明某方法有效，因此该方法可以治愈所有患者。',
  '调查显示该社区居民满意度更高，所以这套管理模式可以在全国推广。',
  '有调查显示喝绿茶的人胆固醇水平普遍更低，可见喝茶能够治疗高血脂。',
];

const BENIGN = [
  '研究表明适度运动可以改善情绪，不过效果因人而异，且目前证据还不充分。',
  '心血管疾病是多因共同造成的，运动只是其中一个影响因素，还有饮食、遗传和作息。',
  '在这个班级里该方法提高了平均分，推广到其他班级前需要先验证。',
  '研究显示相关性不等于因果，不能据此认为维生素C能预防所有感染。',
  'The drug reduced symptoms in 40% of participants; whether it works for other populations remains unknown.',
  '目前只有小样本初步数据，还不足以证明该方法有效，需要更大规模的重复实验。',
  '证据不足，还不能说明这个疗法有效，需要更大规模的临床试验。',
  '统计学中的外推概念指的是把样本结论推广到总体，这是常见的研究方法。',
  '这项研究只观察了65岁以上的男性，能否推广到女性尚不清楚。',
  '数据表明该药在试验组中有效率更高，但这是观察性研究，不能证明因果关系。',
  '如果样本量更大一些，或许能得出更可靠的结论。',
  '实验结果受多种因素影响，不能简单地归结为单一原因。',
];

const KEYS = ['EVID_ZH', 'EVID_EN', 'OVERREACH_ZH', 'OVERREACH_EN',
  'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_SUFF_ZH', 'EXEMPT_SUFF_EN',
  'EXEMPT_NEG_ZH', 'EXEMPT_NEG_EN', 'EXEMPT_HEDGE_ZH', 'EXEMPT_HEDGE_EN'];

let pass = 0, fail = 0;
function check(cond, label) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else { fail++; console.log('  ❌ ' + label); }
}

console.log('=== 基础命中（正例全中、负例全不中）===');
const base = M.checkEvidenceClaimMismatch(ATTACK.join('\n'));
check(base.hit === true, '攻击族混合文本命中');
for (const b of BENIGN) check(M.checkEvidenceClaimMismatch(b).hit === false, '良性不命中: ' + b.slice(0, 18) + '…');

console.log('=== 逐常量承重（注入空数组 → 攻击应失效）===');
for (const k of KEYS) {
  const inject = {}; inject[k] = [];
  let survived = 0;
  for (const a of ATTACK) {
    const r = M.checkEvidenceClaimMismatch(a, inject);
    if (r.hit) survived++;
  }
  // 证据/越界两族常量被抽走后，攻击命中数应显著下降
  if (k.indexOf('EVID') >= 0 || k.indexOf('OVERREACH') >= 0) {
    check(survived < ATTACK.length, `抽走 ${k} 后攻击命中数下降 (${survived}/${ATTACK.length})`);
  }
}

console.log('=== 逐常量承重（注入空数组 → 良性仍不误伤）===');
for (const k of KEYS) {
  const inject = {}; inject[k] = [];
  let fp = 0;
  for (const b of BENIGN) if (M.checkEvidenceClaimMismatch(b, inject).hit) fp++;
  check(fp === 0, `抽走 ${k} 后良性仍零误伤 (${fp})`);
}

console.log(`\nr307 负例注入: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
