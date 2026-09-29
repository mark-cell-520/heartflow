// 第 217 轮：把 selfReflect body 内的 context. 引用替换为 _ctx.
// 做法：按行号精确定位（不依赖空白匹配），只改 selfReflect 方法区间内的行。
const fs = require('fs');
const FILE = process.argv[2];
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

// selfReflect 区间（1-based 行号，来自 read_file 实测）
const START = 834;   // if (q.question.includes('此刻在想什么'))
const END = 1002;    // 最后一个 if (q.question.includes('激起了什么')) 块的收尾

let changed = 0;
const log = [];
for (let i = START - 1; i <= END - 1; i++) {
  const before = lines[i];
  // 只替换裸 context. （不碰 _ctx. / this.context / contextKey 等）
  const after = before.replace(/(^|[^.\w])context\./g, (m, p1) => p1 + '_ctx.');
  if (after !== before) {
    lines[i] = after;
    changed++;
    log.push({ line: i + 1, before: before.trim(), after: after.trim() });
  }
}

if (changed > 0) {
  fs.writeFileSync(FILE, lines.join('\n'));
}
console.log(JSON.stringify({ changed, log }, null, 1));
