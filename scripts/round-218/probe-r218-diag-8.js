// 第 218 轮诊断 14：IIFE 里的 await hf.start() 之后再无输出 →
// 怀疑 process.exit 被引擎 start() 调用（某个模块 init 时 process.exit(0)）
// 或者 stderr 被引擎重定向。换成文件打点 + 保留进程不 exit。
const fs = require('fs');
const path = require('path');
const LOG = path.join(process.cwd(), 'scripts/round-218/_diag8.trace');
try { fs.unlinkSync(LOG); } catch {}
let src = fs.readFileSync(path.join(process.cwd(), 'scripts/round-218/_diag7.test.js'), 'utf8');
const F = (s) => `require('fs').appendFileSync(${JSON.stringify(LOG)}, ${JSON.stringify(s)} + "\\n");`;
src = src
  .replace('  process.stderr.write("REACHED_IIFE_LINE\\n");', '  ' + F('REACHED_IIFE_LINE'))
  .replace('      process.stderr.write("T_PRE_START\\n");', '      ' + F('T_PRE_START'))
  .replace('      process.stderr.write("T_POST_START\\n");', '      ' + F('T_POST_START'))
  .replace('    process.stderr.write("T_PRE_THINK\\n");', '    ' + F('T_PRE_THINK'))
  .replace('    process.stderr.write("T_POST_THINK hasSV=" + !!r._selfVerification + "\\n");', '    ' + F('T_POST_THINK hasSV=yes'))
  .replace(/process\.exit\(fail \? 1 : 0\);/, F('FINISH_CALLED') + ' setTimeout(() => {}, 50); process.exit(0);');
const out = path.join(process.cwd(), 'scripts/round-218/_diag8.test.js');
fs.writeFileSync(out, src);
console.log('WROTE ' + out);
