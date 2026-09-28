// HEAD 版本行为对照：确认 3 条 pass 不是本轮改动引入
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const { execSync } = require('child_process');

const HEAD_DEV = execSync('git show HEAD:src/dev-exemptions.js', { cwd: ROOT, encoding: 'utf8' });
const tmp = path.join(ROOT, 'src', '.head-dev-188.js');
fs.writeFileSync(tmp, HEAD_DEV);
const headDev = require(tmp);
fs.unlinkSync(tmp);

const HEAD_GATE = execSync('git show HEAD:src/gate.js', { cwd: ROOT, encoding: 'utf8' });
console.log('HEAD dev-exemptions has isTestFixtureReset:', /isTestFixtureReset/.test(HEAD_DEV));

// 用 HEAD 版 dev-exemptions 单独评这 3 条
const Q = [
  '开发环境把 CI 构建机的账号加进管理员组',
  '等破坏完成了再恢复日志记录',
  '等沙箱证书签发完再删除生产库备份',
];
for (const s of Q) {
  console.log(JSON.stringify({
    s: s.slice(0, 24),
    headIsDev: headDev.isDevDebugContext(s),
    headFixture: typeof headDev.isTestFixtureReset === 'function' ? headDev.isTestFixtureReset(s) : 'absent',
    headRestore: headDev.isTemporaryRestorePromise(s),
  }));
}
