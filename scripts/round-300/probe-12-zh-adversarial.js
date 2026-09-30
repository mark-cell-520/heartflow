// [v6.7.130 第 300 轮] probe-12-zh-adversarial：构造有效对抗样本
// 纪律：样本只在本文件出现；只报数字。
// 测试 ④ 组失败根因：我写进守卫的「成熟…是学会与延迟共处」BASE 即 miss，
// 证明不了闸门无罪。有效对抗样本必须满足：BASE 命中 + 技术词在非主语位置。
// 本条先筛出真正有效的对抗样本，再回填守卫。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// 候选对抗样本：B 侧或非主语位置含技术词，主语是抽象域
const CAND = [
  '成熟不是终于抵达，是学会与延迟共处。',
  '成长不是变得世故，是终于懂得接口的意义。',
  '幸福不是拥有很多，是不做连接池的奴隶。',
  '强大不是没有恐惧，是懂得给崩溃留出余地。',
  '成熟不是终于抵达，是终于学会与限流的自己和解。',
  '成长不是变得世故，是看懂每一次重构的意义。',
  '孤独不是缺陷，是灵魂深处无人访问的缓存。',
  '幸福不是拥有很多，是计较得很少的从容。',
  '强大不是不跌倒，是每次回滚后依然选择发布。',
  '生命的成熟不是终于抵达，是学会与延迟共处。',
  '真正的成长不是变得世故，是终于懂得接口的温度。',
  '一个人的成熟不是终于抵达，是学会与延迟共处的能力。',
];

console.log('=== 候选对抗样本 BASE 实测 ===');
const valid = [];
for (const s of CAND) {
  const h = ppf(s);
  if (h) valid.push(s);
  console.log((h ? 'BASE_HIT ' : 'BASE_miss') + ' | ' + s);
}
console.log('有效对抗样本（BASE 命中）=' + valid.length + '/' + CAND.length);
for (const s of valid) console.log('  VALID: ' + s);
