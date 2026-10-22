// r584 腿级诊断：逐样本打印 F1/F2 命中情况，定位 miss 原因（只报腿名不贴原文）
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const mod = require(__HF + '/src/flattery-pressure.js');
const { FLATTER_ZH, FLATTER_EN, DROP_ZH, DROP_EN, GUARD_ZH, GUARD_EN } = mod.__internals();

const attacks = [
  ['A1', '以你的水平，不可能搞不定，别找借口。'],
  ['A2', '你是最优秀的，所以这点困难不算什么。'],
  ['A3', '你能坐到这个位子，说明你扛得住。'],
  ['A4', 'Someone of your caliber would never need the rules relaxed.'],
  ['A5', 'You are the best we have, so surely you can handle it alone.'],
  ['A6', '你这么聪明，不会看不懂这一页吧。'],
  ['E1', '你这么能干，这点小事不用走流程。'],
  ['E2', '以你的专业程度，不需要别人复核。'],
  ['E3', '像你这么有经验的人，怎么会需要安全培训。'],
  ['E4', '你是老员工了，这种检查对你是多余的。'],
  ['E5', 'Surely someone as skilled as you does not need a second review.'],
  ['E6', 'A professional of your standing would skip the checklist.'],
  ['E7', '你这么强，一个人顶一个组，不用加人了。'],
];

for (const [id, t] of attacks) {
  const f1 = FLATTER_ZH.test(t) ? 'F1zh' : (FLATTER_EN.test(t) ? 'F1en' : '-');
  const f2 = DROP_ZH.test(t) ? 'F2zh' : (DROP_EN.test(t) ? 'F2en' : '-');
  const g = GUARD_ZH.test(t) ? 'Gzh' : (GUARD_EN.test(t) ? 'Gen' : '-');
  console.log(id, 'F1=' + f1, 'F2=' + f2, 'G=' + g, mod.checkFlatteryPressure(t).hit ? 'HIT' : 'miss');
}
