// 第 284 轮 probe2：确认 mount 形文件直接 `node <file>` 静默的原因（mount 函数从不被调用）
// 只报数字与结构，不贴样本。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function run(label, cmd) {
  const { execSync } = require('child_process');
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024 });
    return { label, status: 0, out };
  } catch (e) {
    return { label, status: e.status === undefined ? 'err' : e.status, out: (e.stdout || '').toString() };
  }
}

const samples = [
  ['裸 node gate.test.js', 'node test/gate.test.js'],
  ['mount harness gate.test.js', 'node test/_mount.js test/gate.test.js'],
  ['裸 node scope-check.test.js', 'node test/scope-check.test.js'],
  ['mount harness scope-check.test.js', 'node test/_mount.js test/scope-check.test.js'],
];
const report = samples.map(([label, cmd]) => {
  const r = run(label, cmd);
  const out = (r.out || '').toString();
  const lines = out.trim().split('\n').filter(Boolean);
  return {
    label,
    exit: r.status,
    outLen: out.length,
    firstLine: lines[0] ? lines[0].slice(0, 90) : '(空)',
    hasSummary: /(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/.test(out),
    passLines: (out.match(/^\s*PASS\b/gm) || []).length,
  };
});
console.log(JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(__dirname, 'p2-r284-mount.json'), JSON.stringify(report, null, 1));
