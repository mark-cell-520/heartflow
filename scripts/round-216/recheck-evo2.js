// 第 216 轮：用 run-all 的 mount harness 单跑两个「ETIMEDOUT」文件，确认是否真失败
const { execFileSync } = require('child_process');
const files = ['evolution-audit.test.js', 'evolution-state.test.js'];
for (const f of files) {
  const t0 = Date.now();
  let status = 'ok';
  let out = '';
  try {
    out = execFileSync('node', ['test/_mount.js', 'test/' + f], { encoding: 'utf8', timeout: 100000, maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    status = 'EXIT=' + e.status;
    out = (e.stdout || '') + String(e.message || '');
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('--- ' + f + ' => ' + status + ' 用时 ' + secs + 's');
  console.log('   ' + out.trim().split(String.fromCharCode(10)).slice(-4).join(' / ').slice(0, 300));
}
