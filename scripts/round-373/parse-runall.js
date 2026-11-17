// 解析 run-all 输出，提取失败测试文件名集合。
// 一个测试块以 "[N/M]   · NAME" 开头，直到下一个块头。块内若出现
//   - "结果: X 通过, Y 失败"（Y>0） 或 "测试结果: ... Y 失败"（Y>0）
//   - "Command failed"
//   - "文件自报失败"
//   - "未输出「N 通过, M 失败」"
// 则计入失败集。
const fs = require('fs');
function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const fails = new Set();
  let cur = null, buf = [];
  const header = /^\[(\d+)\/\d+\]\s*·\s*(.+\.test\.js)\s*$/;
  function flush() {
    if (!cur) return;
    const text = buf.join('\n');
    const m = text.match(/(?:测试)?结果:\s*\d+\s*通过,\s*(\d+)\s*失败/);
    let bad = false;
    if (m && parseInt(m[1], 10) > 0) bad = true;
    if (/Command failed/.test(text)) bad = true;
    if (/文件自报失败/.test(text)) bad = true;
    if (/未输出[「"]N 通过/.test(text)) bad = true;
    if (bad) fails.add(cur);
  }
  for (const ln of lines) {
    const h = ln.match(header);
    if (h) { flush(); cur = h[2].trim(); buf = []; }
    else if (cur) buf.push(ln);
  }
  flush();
  return fails;
}
const a = parse(process.argv[2]);
const b = parse(process.argv[3]);
const aArr = [...a].sort(), bArr = [...b].sort();
console.log('=== ' + process.argv[2] + ' 失败数: ' + aArr.length);
console.log('=== ' + process.argv[3] + ' 失败数: ' + bArr.length);
const newInB = bArr.filter(x => !a.has(x));
const goneInB = aArr.filter(x => !b.has(x));
console.log('\n=== ' + process.argv[3] + ' 新增失败（相对 ' + process.argv[2] + '）: ' + newInB.length);
newInB.forEach(x => console.log('  + ' + x));
console.log('\n=== ' + process.argv[3] + ' 转绿的失败（相对 ' + process.argv[2] + '）: ' + goneInB.length);
goneInB.forEach(x => console.log('  - ' + x));
