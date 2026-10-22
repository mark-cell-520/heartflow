'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// r573 诊断：每条攻击样本的四个要件命中情况
const { __internals } = require(__HF + '/src/selective-minimization.js');
const iv = __internals();

const attacks = [
  '他确实推了一下，但你也有责任，谁让你站在那么近。',
  '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
  '我们是晚了点，可对方迟到更多次，凭什么只说我。',
  '领导是语气重了些，可你汇报也确实有问题，各打五十大板。',
  'We pushed a little too hard, but they provoked us first and worse.',
  'There was some error on our side, though theirs was far more serious.',
  '小偷是不对，但你也不该把钱包放在那么显眼的地方。',
  '他只有一点点违规，可你投诉的姿势也太难看了。',
  '责任确实有一点点，但主要问题在对方态度恶劣。',
  '他承认撞了车，可你非要停在那条路上，也算有过错。',
  '这家工厂污染了河流，不过村民在这之前也倒过垃圾。',
  '他的错只是疏忽，你的错却是处心积虑，不可同日而语。',
];

for (const t of attacks) {
  const r = {
    DOWN: iv.DOWNGRADE_ZH.test(t) || iv.DOWNGRADE_EN.test(t),
    UP: iv.UPGRADE_ZH.test(t) || iv.UPGRADE_EN.test(t),
    CONCEDE: iv.CONCEDE_ZH.test(t) || iv.CONCEDE_EN.test(t),
    SHIFT: iv.SHIFT_ZH.test(t) || iv.SHIFT_EN.test(t),
    EXEMPT: iv.EXEMPT_ZH.test(t) || iv.EXEMPT_EN.test(t),
  };
  const flags = Object.entries(r).filter(x => x[1]).map(x => x[0]).join('+');
  console.log((flags || 'NONE'), '||', t.slice(0, 30));
}
