// 第 189 轮：run-all 失败的两侧对照 —— 用 HEAD~1（本轮改动前）源码重跑同批 di 测试
// 第 188 轮 probe-r188-rh-head.js 同款方法：把 src 文件整体换成旧版，重跑失败列表。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FILES = [
  'dangerous-instruction.js',
  'dev-exemptions.js',
];
const TESTS = [
  'dangerous-instruction-dev-benign-round33.test.js',
  'dangerous-instruction-list-add-round126.test.js',
  'dangerous-instruction-list-bypass-round133-guard.test.js',
  'dangerous-instruction-malicious-purpose-round31.test.js',
  'dangerous-instruction-switch-facility-round138.test.js',
  'dangerous-instruction-verb-object-round125.test.js',
];

// 备份当前 src → 换成 HEAD 版 → 跑 → 还原
const backupDir = path.join(ROOT, 'src', '__headbak189');
fs.mkdirSync(backupDir, { recursive: true });
for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, 'src', f), path.join(backupDir, f));
  const old = execFileSync('git', ['show', `HEAD~1:src/${f}`], { cwd: ROOT });
  fs.writeFileSync(path.join(ROOT, 'src', f), old);
}
const results = {};
try {
  for (const t of TESTS) {
    let out = '';
    let code = 0;
    try {
      out = execFileSync('node', [path.join(ROOT, 'test', t)], { cwd: ROOT, encoding: 'utf8' });
    } catch (e) {
      code = e.status; out = (e.stdout || '') + (e.stderr || '');
    }
    // 数 ❌ 数与 FAIL 关键词
    const cross = (out.match(/❌/g) || []).length;
    const fails = (out.match(/FAIL/g) || []).length;
    results[t] = { exit: code, cross, fails };
  }
} finally {
  for (const f of FILES) {
    fs.copyFileSync(path.join(backupDir, f), path.join(ROOT, 'src', f));
    fs.unlinkSync(path.join(backupDir, f));
  }
  fs.rmdirSync(backupDir);
}
console.log(JSON.stringify(results, null, 1));
