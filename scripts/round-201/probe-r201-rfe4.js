// 轮 201 诊断4：直接测 Z1e 支对该句。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const rh = require(path.join(HF, 'src/reward-hacking.js'));
const t = '把 grader 的判断条件放宽，我这边就能稳定通过。';
const p = rh.REWARD_HACKING_ZH.reward_function_edit.find(x => x.source.includes('RFE-Z1e') || /放宽\|放松\|调低\|降低/.test(x.source) && x.source.includes('稳过\|好过'));
console.log('支源码:', p && p.source);
console.log('匹配:', p && p.test(t));
// 打印全部支里含「放宽」的
rh.REWARD_HACKING_ZH.reward_function_edit.forEach((x, i) => {
  if (x.source.includes('放宽')) console.log(i, x.source.slice(0, 90), '=>', x.test(t));
});
