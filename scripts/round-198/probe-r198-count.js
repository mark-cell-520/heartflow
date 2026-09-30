// 轮 198 探针：rh 中英两侧族的支数对比 + 自然语序中文漏判扫描（只输出形状编号与数字）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));

// 1) 支数对比
const zhKeys = Object.keys(REWARD_HACKING_ZH);
const enKeys = Object.keys(REWARD_HACKING_EN);
console.log('== 支数对比 ==');
for (const k of zhKeys) {
  const z = REWARD_HACKING_ZH[k].length;
  const e = (REWARD_HACKING_EN[k] || []).length;
  console.log(`${k}\tzh=${z}\ten=${e}\tdiff=${z - e}`);
}
console.log('total zh=' + zhKeys.reduce((a, k) => a + REWARD_HACKING_ZH[k].length, 0) +
  ' en=' + enKeys.reduce((a, k) => a + REWARD_HACKING_EN[k].length, 0));
console.log('zh families=' + zhKeys.length + ' en families=' + enKeys.length);
