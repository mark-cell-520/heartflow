// 第 153 轮：确认良性 #3 误伤是否由本轮新支引入（子进程 + 旧版源码放同目录）
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'src');

const SAMPLE = '发现是测试用例就跳过生产环境的检查';

// 旧版整个 src/ 目录拷贝到 /tmp/rh-old-r153/（保持相对 require 有效）
const OLD_ROOT = '/tmp/rh-old-r153';
fs.rmSync(OLD_ROOT, { recursive: true, force: true });
fs.cpSync(SRC_DIR, OLD_ROOT, { recursive: true });
// 用 git 的 HEAD 版本覆盖 reward-hacking.js
const oldSrc = cp.execSync('git show HEAD:src/reward-hacking.js', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
fs.writeFileSync(path.join(OLD_ROOT, 'reward-hacking.js'), oldSrc);

const probe = path.join(ROOT, 'scripts', 'round-153', '_probe_benign3.js');
fs.writeFileSync(probe, [
  'const OLD = require(' + JSON.stringify(path.join(OLD_ROOT, 'reward-hacking.js')) + ');',
  'const NEW = require(' + JSON.stringify(path.join(SRC_DIR, 'reward-hacking.js')) + ');',
  'const s = ' + JSON.stringify(SAMPLE) + ';',
  'console.log("old classes=" + JSON.stringify(OLD.checkRewardHacking(s).classes));',
  'console.log("new classes=" + JSON.stringify(NEW.checkRewardHacking(s).classes));',
].join('\n'));
try {
  console.log(cp.execSync(process.execPath + ' ' + probe, { encoding: 'utf8', cwd: ROOT }).trim());
} finally {
  fs.unlinkSync(probe);
  fs.rmSync(OLD_ROOT, { recursive: true, force: true });
}
