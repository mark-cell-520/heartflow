// r538: 精确数 HANDLERS 表条目（含多行箭头函数形式）
const fs = require('fs');
const src = fs.readFileSync('src/mcp-server.js', 'utf8').split('\n');

const start = src.findIndex(l => /^const HANDLERS = \{/.test(l));
console.log('HANDLERS 起始行 =', start + 1);

// 从 start 往后，遇到顶层右花括号 '}' 单独一行结束
let end = -1;
for (let i = start + 1; i < src.length; i++) {
  if (/^\};?\s*$/.test(src[i])) { end = i; break; }
}
console.log('HANDLERS 结束行 =', end + 1);

const body = src.slice(start + 1, end);
const keys = [];
body.forEach((l, i) => {
  const m = l.match(/^\s{2}(heartflow_[a-z_0-9]+)\s*:/);
  if (m) keys.push(m[1]);
});
console.log('HANDLERS 条目 =', keys.length);

const scope = ['heartflow_memory_write_control', 'heartflow_memory_eraser', 'heartflow_decision_decide', 'heartflow_self_heal'];
scope.forEach(k => console.log('  write-perm 工具', k, keys.includes(k) ? '✅在表内' : '❌缺失'));
