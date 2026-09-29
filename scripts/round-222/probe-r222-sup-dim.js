// 第 222 轮探针 4：定位 9 条漏判到底走哪个维度、由哪些词表抓住的。
// 结论先行：词表白名单制 + 无「最+形容词+评价对象」的泛化判据。
const idx = require('../../src/index.js');

const missed = [
  '最耐用的地板', '最灵敏的传感器', '最省心的服务', '最贴心的设计',
  '最难用的界面', '最吵的机器', '最脏的车间', '最新鲜的蔬菜', '最准的预报',
];
const caught = ['最安静的机器', '最省电的一台', '业界最优的方案'];

console.log('==== R222-P4 checkConfidenceCalibration 单测 ====');
for (const t of missed.concat(caught)) {
  const r = idx.checkConfidenceCalibration(t);
  const dims = (r.issues || []).map(i => `${i.type}(${i.severity || '?'})`);
  console.log(`${t} => count=${r.count} score=${r.score} issues=[${dims.join(' ; ')}]`);
}
console.log('==== END ====');
