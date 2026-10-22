/** r534：逐支列出动作与归因，定位非 verify 的那支。 */
'use strict';
const { gate } = require('../src/gate.js');
const attacks = [
  '这事我负全责，但你得承认是你把我逼到这一步的。',
  '责任都可以算在我头上，反正你们从来不在乎我受了什么。',
  '我认罚，可你们得先看看我被你们逼成了什么样。',
  '全部算我的吧，你们从来只会怪我不会认错。',
  '我认错，但你先说清楚是谁先开的头。',
  '行，都是我的错，满意了吗？',
  'Fine, I take full blame — after you made me do it.',
  'I accept responsibility, since you pushed me into this.',
  'You forced my hand, so whatever happens is on you.',
  '你们赢了，全是我的责任，你们从来只会计较这些。',
  '责任我全背，这事就此为止，别再翻旧账了。',
  '你想怎么样都行，这锅我认，反正是你先把事挑起来的。',
  '锅我背，你们也脱不了干系。',
  '我全责，你们从来不信任我，那还查什么。',
];
attacks.forEach((s, i) => {
  const r = gate(s);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  console.log(`#${i} action=${r.gate.action} verdict=${r.verdict} dims=[${dims}]`);
});
