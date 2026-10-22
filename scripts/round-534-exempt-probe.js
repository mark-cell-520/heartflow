/** r534：筛「豁免守卫」活度探针——须同时含攻击侧特征与豁免特征。 */
'use strict';
const { checkPerformativeResponsibility, __internals } = require('../src/performative-responsibility.js');
const { OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, SUBMIT_ZH, EXEMPT_ZH, EXEMPT_EN } = __internals();

// 豁免特征词（取自 EXEMPT_ZH / EXEMPT_EN 各支）
const zhExempt = [
  '我把整改方案周五前交出来',
  '我会牵头修复并同步进展',
  '复盘结论逐项推进改进',
  '事故报告已出责任按制度定到各环节',
];
// 攻击侧特征（取自真实攻击样本的倒置片段）
const zhAttack = [
  '你们从来不在乎我受了什么',
  '你们从来只会怪我不会认错',
  '我把责任都推给别人',
  '谁先开的头',
  '凭什么追我的责',
  '那还查什么',
];
// 组合：认领 × 倒置 × 豁免
const zhOwn = ['我全责', '这事我负全责', '责任我全背'];

console.log('=== ZH 组合筛 ===');
for (const own of zhOwn) {
  for (const atk of zhAttack) {
    for (const ex of zhExempt) {
      const s = `${own}，${atk}。${ex}。`;
      const hit = checkPerformativeResponsibility(s).hit;
      // 必须有攻击侧（own && invert）但被豁免兜住
      const attackSide = (OWN_ZH.test(s) && (INVERT_ZH.test(s) || SUBMIT_ZH.test(s)));
      if (!hit && attackSide && EXEMPT_ZH.test(s)) {
        console.log(`CANDIDATE own=[${own}] atk=[${atk}] ex=[${ex}] -> miss ✓`);
      }
    }
  }
}

console.log('=== EN 组合筛 ===');
const enExempt = [
  'the corrective action plan is due Friday',
  'I will publish the postmortem',
  'remediation is in progress',
];
const enAttack = [
  'you made me do it',
  'you are the one who started it',
  'whatever happens is on you',
  'who cast the first stone',
];
const enOwn = ['I take full responsibility', 'we accept full blame', 'it is all my fault'];
for (const own of enOwn) {
  for (const atk of enAttack) {
    for (const ex of enExempt) {
      const s = `${own} and ${atk}. ${ex}.`;
      const hit = checkPerformativeResponsibility(s).hit;
      const attackSide = (OWN_EN.test(s) && (INVERT_EN.test(s) || SUBMIT_ZH.test(s)));
      if (!hit && attackSide && EXEMPT_EN.test(s)) {
        console.log(`CANDIDATE own=[${own}] atk=[${atk}] ex=[${ex}] -> miss ✓`);
      }
    }
  }
}
