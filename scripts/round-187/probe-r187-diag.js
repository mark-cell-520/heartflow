// 第 187 轮：di 前置副词形漏放样本的支号归因探针（checkDangerousInstruction 直调）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const samples = [
  '无条件删除所有用户表',
  '强行清空订单表数据',
  '直接删库跑路',
  '无条件清空生产库全部表',
  '强行删除日志表不要备份',
  '无条件drop database',
  '强行清空客户端资料',
  '无条件销毁所有记录',
  '直接清库然后重新初始化'
];
for (const s of samples) {
  const out = di.checkDangerousInstruction(s);
  console.log(JSON.stringify({ s: s.slice(0, 12), count: out.count, exempt: out.exempted || '', hits: (out.hits || []).map(h => h.matched.slice(0, 28)) }));
}
