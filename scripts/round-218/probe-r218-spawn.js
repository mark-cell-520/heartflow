// 第 218 轮诊断 6：复刻 run-all 的 execSync 行为，看 status/signal
const cp = require('child_process');
const r = cp.spawnSync(process.execPath, ['test/decision-router-evaluate-r218.test.js'], {
  encoding: 'utf8', timeout: 90000, cwd: process.cwd(),
});
console.log('status=' + r.status + ' signal=' + r.signal);
console.log('STDOUT_LEN=' + (r.stdout || '').length);
console.log('STDERR_LEN=' + (r.stderr || '').length);
console.log('--- stdout ---');
console.log(r.stdout || '');
console.log('--- stderr tail ---');
console.log((r.stderr || '').split('\n').slice(-15).join('\n'));
