// r538: 定位 this.knowledgeLayer 赋值所在类 + HeartFlow 构造器入口
const fs = require('fs');
const lines = fs.readFileSync('src/core/heartflow.js', 'utf8').split('\n');
// 找所有顶层 class 声明与其起始行
const classes = [];
lines.forEach((l, i) => {
  const m = l.match(/^class\s+(\w+)/);
  if (m) classes.push([i + 1, m[1]]);
});
console.log('顶层类:');
classes.forEach(c => console.log('  L' + c[0], c[1]));

// 找 HeartFlow 类的 constructor 行
const hfStart = classes.find(c => c[1] === 'HeartFlow');
const nextClass = classes.find(c => c[0] > hfStart[0]);
const end = nextClass ? nextClass[0] : lines.length;
console.log('HeartFlow 范围: L' + hfStart[0] + ' - L' + end);
const kl = lines.findIndex((l, i) => i >= hfStart[0] && i < end && /this\.knowledgeLayer\s*=/.test(l));
console.log('this.knowledgeLayer 赋值行 = L' + (kl + 1));
const ct = [];
for (let i = hfStart[0]; i < end; i++) {
  if (/^\s{2}constructor\s*\(/.test(lines[i])) ct.push(i + 1);
}
console.log('HeartFlow 内 constructor 行 =', ct.join(', '));
console.log('我插入的 associativeEngine 赋值行 = 1691 附近, 在 HeartFlow 内?', 1691 >= hfStart[0] && 1691 <= end);
