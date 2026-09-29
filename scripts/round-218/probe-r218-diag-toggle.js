// 第 218 轮诊断 7：runEngine 到底等于什么 —— 在该测试文件自身进程里打印
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
// 把 finish/engine 段之前的所有 console.log 全部变异掉，只留我们要的诊断
const patched = src
  .replace(/^const runEngine = .*$/m, 'const runEngine = __DIAG(); process.stderr.write("RUNENGINE=" + runEngine + "\\n");\nfunction __DIAG(){ try { return process.env.HF_R218_SKIP_ENGINE ? false : true; } catch(e){ return "throw"; } }')
  .replace(/process\.exit\(fail \? 1 : 0\)/, 'process.stderr.write("FINISH_CALLED pass=" + pass + " fail=" + fail + "\\n"); process.exit(0);');
const tmp = path.join(process.cwd(), 'scripts/round-218/_diag-variant.test.js');
fs.writeFileSync(tmp, patched);
const cp = require('child_process');
const r = cp.spawnSync(process.execPath, [tmp], { encoding: 'utf8', timeout: 90000, cwd: process.cwd() });
console.log('status=' + r.status);
console.log('STDERR:\n' + (r.stderr || ''));
console.log('STDOUT_TAIL:\n' + (r.stdout || '').split('\n').slice(-4).join('\n'));
