// 与第 189 轮 finish 时的 src 基态做两侧对照：rh186 idx8 是否本轮引入
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const cp = require('child_process');
const fs = require('fs');

// 189 轮 finish 的 src 基态 = 907f1f7f (auto-commit 之前) 的实际 src 内容
// 上一轮finish锁定的基态应该是 b5f67d51（交接簿commit）对应的 src
const BASE = process.argv[2] || 'b5f67d51';
const files = ['src/dangerous-instruction.js', 'src/dev-exemptions.js', 'src/reward-hacking.js', 'src/gate.js'];
const orig = {};
for (const f of files) orig[f] = fs.readFileSync(path.join(ROOT, f), 'utf8');

console.log('对照基态 =', BASE);
try {
  for (const f of files) {
    const content = cp.execSync('git -C ' + ROOT + ' show ' + BASE + ':' + f, { encoding: 'utf8', maxBuffer: 1e8 });
    fs.writeFileSync(path.join(ROOT, f), content);
  }
  const T = path.join(ROOT, 'test/reward-hacking-zh5-exemption-round186.test.js');
  const out = cp.execSync('node ' + T, { cwd: ROOT, encoding: 'utf8' });
  const m = out.match(/═══ (\d+) 通过, (\d+) 失败 ═══/);
  console.log('基态结果 =', m ? m[0] : out.slice(-200));
} catch (e) {
  console.log('ERR', e.message.slice(0, 200));
} finally {
  for (const f of files) fs.writeFileSync(path.join(ROOT, f), orig[f]);
  console.log('已恢复工作区');
}
