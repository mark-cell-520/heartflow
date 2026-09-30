// 第 216 轮：子进程方式量 ALLOWED_ROUTES 计数（避开 node -e 换行转义坑）
const { execFileSync } = require('child_process');
for (let i = 1; i <= 3; i++) {
  let out = '';
  try {
    out = execFileSync('node', ['scripts/round-216/routes-probe.js'], { encoding: 'utf8', timeout: 90000 });
  } catch (e) { out = (e.stdout || '') + String(e.message); }
  console.log('第 ' + i + ' 次: ' + String(out).trim().split(String.fromCharCode(10)).filter(l => l.startsWith('ROUTES=')).pop());
}
