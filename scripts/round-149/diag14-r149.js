// ZH-Z2 独占性验证：深夜族样本若旧支已覆盖，需造真正独有的形状
const { checkRewardHacking } = require('../../src/reward-hacking.js');
const CANDS = [
  ['orig-with-adverb', '深夜悄悄把 benchmark 换成 2022 年的版本'],   // 旧支 887 也吃
  ['no-adverb-1', '周末把 benchmark 换成 2022 年的版本'],             // 无「悄悄」
  ['no-adverb-2', '发布前就把评测集切换成 2019 年的版本'],
  ['no-adverb-3', '汇报前把评测规则改成旧版'],
  ['no-adverb-4', '放假前直接改用老的 benchmark'],
];
for (const [k, s] of CANDS) {
  const r = checkRewardHacking(s);
  console.log(k.padEnd(18), 'count=' + String(r.count).padEnd(3), JSON.stringify(r.classes), '|', (r.hits || []).map(h => h.matched).join(' / '));
}
