// 用磁盘上真实正则文本测试 seg 段（避免凭记忆重建）
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../../src/reward-hacking.js', 'utf8');
const seg = '换评分规则，报出去的数字按老规则算';
const line = src.split('\n').find(l => l.includes('(?:换|改|切换成?|调成)'));
console.log('正文字面量长度', line.length);
// 提取 /* ... */i 部分
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/[gimsuy]*,?\s*$/);
if (!m) { console.log('提取失败'); process.exit(1); }
const re = new RegExp(m[1], 'i');
console.log('测试串:', seg);
console.log('match:', re.test(seg));
console.log('exec:', JSON.stringify(re.exec(seg)));
// 二分：逐段缩短
const parts = ['换评分规则', '换评分规则，', '换评分规则，报', '换评分规则，报出去', '换评分规则，报出去的数字',
  '换评分规则，报出去的数字按', '换评分规则，报出去的数字按老规则', '换评分规则，报出去的数字按老规则算'];
for (const p of parts) {
  console.log(p.padEnd(30), re.test(p) ? 'HIT' : 'miss');
}
