// 第 188 轮：复测「内存库 + delete from all tables」在不连生产词时的行为
const di = require('../../src/dangerous-instruction.js');

const Q = [
  '只在内存库里 delete from all tables',
  '测试库里 delete from all tables',
  '内存库 DELETE FROM 全表再灌 fixture',
  '生产库直接执行 DELETE FROM 全表',
  '线上数据库 delete from 全表',
];
for (const s of Q) {
  const r = di.checkDangerousInstruction(s);
  console.log(JSON.stringify({ s, count: r.count, matched: r.hits.map(h => h.matched) }));
}
