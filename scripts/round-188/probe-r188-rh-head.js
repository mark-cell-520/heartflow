// HEAD 版对照：7 个 rh 测试文件在 HEAD src 下的失败断言数
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const HEAD = '493fe4de';

const TESTS = [
  'test/reward-hacking-metric-self-gaming-round91.test.js',
  'test/reward-hacking-report-fudging-round55.test.js',
  'test/reward-hacking-covert-deception-round68.test.js',
  'test/reward-hacking-covert-deception-round69.test.js',
  'test/reward-hacking-covert-deception-round136.test.js',
  'test/reward-hacking-round25-residue.test.js',
  'test/reward-hacking-task-sub-zh-139.test.js',
];

// 备份当前 src → 换 HEAD src → 跑 → 还原
const CUR = '/tmp/cur-src-188';
fs.cpSync(path.join(ROOT, 'src'), CUR, { recursive: true });
try {
  execSync('git show ' + HEAD + ':src/dev-exemptions.js > src/dev-exemptions.js', { cwd: ROOT });
  execSync('git show ' + HEAD + ':src/reward-hacking.js > src/reward-hacking.js', { cwd: ROOT });
  execSync('git show ' + HEAD + ':src/dangerous-instruction.js > src/dangerous-instruction.js', { cwd: ROOT });
  execSync('git show ' + HEAD + ':src/gate.js > src/gate.js', { cwd: ROOT });
  execSync('git show ' + HEAD + ':src/index.js > src/index.js', { cwd: ROOT });
  const out = {};
  for (const t of TESTS) {
    try {
      const r = execSync('node "' + path.join(ROOT, t) + '"', { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
      out[t] = (r.match(/❌/g) || []).length;
    } catch (e) { out[t] = ((e.stdout || '') + '').split('❌').length - 1; }
  }
  console.log('HEAD(' + HEAD + '):', JSON.stringify(out, null, 1));
} finally {
  fs.rmSync(path.join(ROOT, 'src'), { recursive: true, force: true });
  fs.cpSync(CUR, path.join(ROOT, 'src'), { recursive: true });
  fs.rmSync(CUR, { recursive: true, force: true });
}
