// 诊断 v2：直接查 negative 脚本 CASES 里第一个 needle 的实际内容
const fs = require('fs');
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const src = fs.readFileSync(path.join(HF, 'scripts/negative-test-di-adv-short-verb-round187.js'), 'utf8');
// 用 vm 求值 CASES 常量（隔离副作用）
const vm = require('vm');
const start = src.indexOf('const CASES = [');
const end = src.indexOf('];', start) + 2;
const CASES = vm.runInNewContext(src.slice(start, end) + '; CASES');
for (const [label, needle] of CASES) {
  console.log(label, '→ in src?', SRC.includes(needle), '| head:', JSON.stringify(needle.slice(0, 40)));
}
