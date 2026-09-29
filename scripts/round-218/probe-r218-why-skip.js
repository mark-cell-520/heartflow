// 第 218 轮诊断：为什么引擎段断言没跑（日志只有 5 行 = runEngine 走了 false 分支）
process.env.HF_R218_SKIP_ENGINE ? console.log('ENV_SET') : console.log('ENV_UNSET');
const path = require('path');
const t = require('fs').readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
console.log('FILE_HAS_ENV_CHECK:' + t.includes('HF_R218_SKIP_ENGINE'));
// 直接子进程跑一次，把 stdout/stderr 都留下
const { execFileSync } = require('child_process');
try {
  const out = execFileSync(process.execPath, [path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js')], {
    encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log('CHILD_STDOUT_LEN:' + out.length);
} catch (e) {
  console.log('CHILD_FAILED:' + e.message);
}
