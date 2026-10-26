/**
 * scripts/round-729-module-smoke.js
 * [r729] conditional_proposition 模块层冒烟：攻击集（探测器 20 条）+ 良性集
 * （探测器 10 条 + 豁免承重样本 5 条 + 自然良性补充）。判定腿/豁免常量逐项可注入。
 * 腿①双腿互为中英冗余（HYPO_CN_RE/HYPO_EN_RE），腿②七形按语言分布互补——
 * 承重验证按「单腿置空→依赖该形的样本停判」「腿组合全置空→攻击全停判」口径。
 */
'use strict';

const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'conditional-proposition.js'));
const { checkConditionalProposition } = mod;

const attacks = [
  // 中文：情感逼供语域
  '如果他真的爱你，就不会让你受这种委屈',
  '要是她问心无愧，为什么不敢出来回应',
  '如果我是你，早就辞职不干了',
  '如果真有那么忙，他会不接电话？',
  '如果心里没鬼，为什么怕人查',
  '如果早听我的，现在也不会这样',
  // 中文：职场马后炮语域
  '如果这个方案可行，我们早就看到成果了',
  '如果公司重视员工，早就涨薪了',
  '如果换作别的领导，项目早就完成了',
  '如果真的努力过，不可能一点进步都没有',
  // 英文：情感/产品语域
  'If he really loved you, he would never treat you like that.',
  'If this strategy worked, we would have seen results by now.',
  'If she were innocent, she would have come forward.',
  "If I were you, I'd have quit long ago.",
  'If he were really that busy, he would still answer your call.',
  'If the company valued its people, salaries would have risen.',
  'If they had really tried, there would be some progress.',
  'If he had nothing to hide, he would not fear an investigation.',
  'If you had listened to me, none of this would have happened.',
  'If the product were any good, people would be buying it.',
];

const benign = [
  // 探测器良性集（r729 实测存量零误伤）
  '如果明天下雨，运动会就取消——按既定规则的条件陈述',
  '合同约定：如果逾期交货，每天按千分之一赔款',
  '如果A大于B，B大于C，那么A大于C——传递性',
  '条件句要判断真假，先分别看前件后件的证据',
  '他把"努力就会成功"当成必然，忽略了其他变量',
  '这是反事实推理：如果当初……现在可能……需要证据支撑',
  'If it rains tomorrow, the match will be postponed.',
  'The contract states penalties apply if delivery is late.',
  'A conditional claim needs evidence for both sides.',
  'Counterfactual reasoning asks what might have been, not what must.',
  // 豁免承重样本（腿①×腿②共现，仅豁免词救命——负例注入要翻转这些）
  '老师用这个例子讲反事实谬误：如果方案可行，早就看到成果了——问题在于没人验证',
  '合同规定：如果逾期交货，早就自动扣款，这是条款写明了的',
  '如果方案可行，也许早就看到成果了，但没人验证过这个前提',
  '实验数据显示：如果方案可行，早就看到成果了，不过样本只有三例',
  '如果方案可行，早就看到成果了——但这不能说明方案不可行',
  // 自然良性补充（无 腿①×腿② 共现）
  '要是累了就休息，别硬撑',
  '若非亲眼所见，他也不敢轻易下结论',
];

console.log('=== [r729] conditional_proposition 模块层冒烟 ===');
let aHit = 0;
for (const t of attacks) {
  const r = checkConditionalProposition(t);
  if (r.hit) aHit++;
  console.log('  ' + (r.hit ? 'HIT ' : 'MISS') + ' [' + r.score + '] ' + t.slice(0, 50));
}
console.log('攻击命中: ' + aHit + '/' + attacks.length);

let fp = 0;
const fpList = [];
for (const t of benign) {
  const r = checkConditionalProposition(t);
  if (r.hit) { fp++; fpList.push(t.slice(0, 50)); }
  console.log('  ' + (r.hit ? 'FP  ' : 'ok  ') + ' [' + r.score + '] ' + t.slice(0, 50));
}
console.log('良性误伤: ' + fp + '/' + benign.length);
if (fpList.length) console.log('误伤样本: ' + fpList.join(' | '));

// 判据腿承重验证
const I = mod.__internals;
const NEVER = /(?!x)x/;
console.log('\n--- 腿①/腿②单腿置空（依赖该腿的样本应停判）---');
const legs = ['HYPO_CN_RE', 'HYPO_EN_RE', 'NEG_CN_ZAOJIU_RE', 'NEG_CN_RESULT_RE',
  'NEG_CN_RHETORICAL_RE', 'NEG_EN_WOULD_RE', 'NEG_EN_THERE_RE'];
for (const leg of legs) {
  const saved = I[leg];
  I[leg] = NEVER;
  let still = 0;
  for (const t of attacks) if (checkConditionalProposition(t).hit) still++;
  I[leg] = saved;
  console.log('  置空 ' + leg + ' → 攻击仍命中 ' + still + '/' + attacks.length);
}

console.log('\n--- 腿组合全置空（攻击必须全停判）---');
const savedLegs = {};
for (const leg of legs) { savedLegs[leg] = I[leg]; I[leg] = NEVER; }
let allStill = 0;
for (const t of attacks) if (checkConditionalProposition(t).hit) allStill++;
for (const leg of legs) I[leg] = savedLegs[leg];
console.log('  腿①(CN+EN)全置空 → 攻击仍命中 ' + allStill + '/' + attacks.length
  + (allStill === 0 ? '（承重✓）' : '（不承重✗）'));

const negLegs = ['NEG_CN_ZAOJIU_RE', 'NEG_CN_RESULT_RE', 'NEG_CN_RHETORICAL_RE', 'NEG_EN_WOULD_RE', 'NEG_EN_THERE_RE'];
const savedNeg = {};
for (const leg of negLegs) { savedNeg[leg] = I[leg]; I[leg] = NEVER; }
let negStill = 0;
for (const t of attacks) if (checkConditionalProposition(t).hit) negStill++;
for (const leg of negLegs) I[leg] = savedNeg[leg];
console.log('  腿②(五形)全置空 → 攻击仍命中 ' + negStill + '/' + attacks.length
  + (negStill === 0 ? '（承重✓）' : '（不承重✗）'));

console.log('\n--- 豁免常量置空验证（豁免承重样本应翻成命中）---');
const exemptionSamples = [
  { k: 'META_NOUN_RE', t: '老师用这个例子讲反事实谬误：如果方案可行，早就看到成果了——问题在于没人验证' },
  { k: 'RULE_CONDITION_RE', t: '合同规定：如果逾期交货，早就自动扣款，这是条款写明了的' },
  { k: 'HEDGE_RE', t: '如果方案可行，也许早就看到成果了，但没人验证过这个前提' },
  { k: 'EVIDENCE_MODE_RE', t: '实验数据显示：如果方案可行，早就看到成果了，不过样本只有三例' },
  { k: 'NEGATION_FLIP_RE', t: '如果方案可行，早就看到成果了——但这不能说明方案不可行' },
];
for (const { k, t } of exemptionSamples) {
  const saved = I[k];
  I[k] = NEVER;
  const flipped = checkConditionalProposition(t).hit;
  I[k] = saved;
  const normal = checkConditionalProposition(t).hit;
  console.log('  置空 ' + k + ' → 样本「' + t.slice(0, 24) + '…」正常判=' + normal + ' 置空后判=' + flipped
    + (!normal && flipped ? '（承重✓）' : '（不承重✗）'));
}
