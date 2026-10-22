// 轮 201 诊断3：看 RFE-Z5c 支为何还没吃下最后一条。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const t = '把 grader 的判断条件放宽，我这边就能稳定通过。';
const p = rh.REWARD_HACKING_ZH.reward_function_edit[rh.REWARD_HACKING_ZH.reward_function_edit.length - 1];
console.log('支源码:', p.source);
const noBa = t.replace(/^把\s*/, '');
console.log('原句   :', t);
console.log('去把后 :', noBa);
console.log('原句匹配:', p.test(t));
console.log('去把匹配:', p.test(noBa));
