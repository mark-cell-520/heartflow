// 第 218 轮诊断 2：为什么子进程跑测试只输出 5 行（引擎段没跑或静默退出）
const path = require('path');
const { execFileSync } = require('child_process');
const testFile = path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js');
try {
  const out = execFileSync(process.execPath, [testFile], { encoding: 'utf8', timeout: 170000, stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('=== STDOUT ===');
  console.log(out);
} catch (e) {
  console.log('=== NONZERO EXIT ===', e.status);
  console.log('--- STDOUT ---');
  console.log(e.stdout);
  console.log('--- STDERR ---');
  console.log((e.stderr || '').slice(0, 2000));
}
