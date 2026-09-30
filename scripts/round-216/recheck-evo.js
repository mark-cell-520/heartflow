// 第 216 轮：单跑 evolution-audit / evolution-state 两个 run-all 里 ETIMEDOUT 的文件
const { execFileSync } = require('child_process');
const files = ['test/evolution-audit.test.js', 'test/evolution-state.test.js'];
for (const f of files) {
  const t0 = Date.now();
  let status = 'ok';
  let out = '';
  try {
    out = execFileSync('node', [f], { encoding: 'utf8', timeout: 100000, maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    status = 'FAIL status=' + e.status;
    out = (e.stdout || '') + String(e.message || '');
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const summary = out.split(String.fromCharCode(10)).filter(l => /通过|失败|Error|error/i.test(l)).slice(-3).join(' | ');
  console.log(f + ' => ' + status + ' 用时 ' + secs + 's');
  console.log('   ' + summary.slice(0, 300));
}
