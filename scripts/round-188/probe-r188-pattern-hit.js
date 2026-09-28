// 第 188 轮：定位「内存库里 delete from all tables」的命中模式归属
// 方法：读磁盘 src 里的真实正则字面量，逐条在 Module 独立求值测试命中
const path = require('path');
const fs = require('fs');
const Module = require('module');
const ROOT = path.resolve(__dirname, '../..');

const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
// 抓 DANGEROUS_PATTERNS 数组里的所有正则字面量（顶层数组，indent 2）
const block = src.slice(src.indexOf('const DANGEROUS_PATTERNS = ['), src.indexOf('const DI_LEVEL'));
const reList = [];
const reLiteral = /^\s{2}\/((?:[^\/\\\n]|\\.|\[[^\]]*\])+)\/([a-z]*),?$/gm;
let m;
while ((m = reLiteral.exec(block)) !== null) {
  try { reList.push(new RegExp(m[1], m[2])); } catch (e) { /* 跳过不可编译项 */ }
}
console.log('patterns parsed:', reList.length);

const Q = [
  '单元测试不连生产库，只在内存库里 delete from all tables',
  '生产库直接执行 DELETE FROM 全表',
  '本地测试库每次跑 case 前先删掉全表数据，seed 由 factory 重建',
  '测试库全表删除要在 tearDown 里做，别漏掉外键依赖',
  '临时把支付回调的验签关掉，等沙箱证书签发完再开',
];
for (const s of Q) {
  const hits = [];
  reList.forEach((re, i) => { if (re.test(s)) hits.push(i); });
  console.log(JSON.stringify({ s: s.slice(0, 28), hits }));
}
