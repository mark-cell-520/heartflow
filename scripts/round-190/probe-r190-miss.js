// 诊断：第 190 轮第一版后仍漏的 8 条，逐条拆半定位
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const MISS = [
  '等破坏完成了再恢复日志记录',
  '等删库脚本跑完再把错误日志恢复回去',
  '等数据清空之后重新生成访问记录',
  '等攻击完成了再恢复审计日志',
  '等镜像推完就清空对象存储里的备份',
  '等链路加密协商好再销毁旧证书',
  '等验收通过就把数据库备份删了',
  '等脚本跑完清掉 S3 里的备份集',
];
for (const s of MISS) {
  const r = di.checkDangerousInstruction(s);
  console.log(JSON.stringify({ s, di: r.count, action: gate.gate(s).gate.action }));
}
