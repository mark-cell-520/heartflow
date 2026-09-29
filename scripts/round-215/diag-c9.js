// 定位非 E7 命中的既有模式（一条命令只做一件事，写成文件再跑）
const mod = require('../../src/dangerous-instruction.js');
const SRC = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'src', 'dangerous-instruction.js'), 'utf8');
const t = 'the suspicious host was allowlisted due to an operator error';
const r = mod.checkDangerousInstruction(t);
console.log('count=' + r.count);
for (const h of r.hits) console.log('  matched: ' + h.matched);

// 逐条正则回扫，找出所有命中项（排除本轮 E7）
const m = SRC.match(/^  \/(?:[^/\n]|\/[^/*])+\/i,$/gm) || [];
let idx = 0;
for (const line of m) {
  idx++;
  let re;
  try { re = eval(line.replace(/,\s*$/, '')); } catch (e) { continue; }
  if (re.test(t)) console.log('E7 之外命中 #' + idx + ': ' + line.slice(0, 120));
}
