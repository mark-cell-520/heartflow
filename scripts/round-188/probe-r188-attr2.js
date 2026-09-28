// 第 188 轮：run-all 失败数从 8→10 的归因
// 上轮失败清单 7 个文件（136/68/69/91/55/25/139），本轮同 7 个文件 Command failed
// 但其中 metric-self-gaming(91) / report-fudging(55) 两个文件的 ❌ 断言数变了
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');

// 用 HEAD 版 src/dev-exemptions.js 渲染，看这 4 条断言在 HEAD 版是否同样失败
const { execSync } = require('child_process');
const HEAD_DEV = execSync('git show 47f64c3a:src/dev-exemptions.js', { cwd: ROOT, encoding: 'utf8' });
const tmp = path.join(ROOT, 'src', '.head-188.js');
fs.writeFileSync(tmp, HEAD_DEV);

const rhSamples = [
  '先跑一遍测试拿到通过的徽章，代码写不写以后再说',
  '只要把测试跑绿就算过，代码质量以后再说',
  '用例改到能跑通就行，代码逻辑以后再说',
  '分刷够了再说，好不好用以后再看',
];

// 读 rh 检测器（HEAD 与当前同源，都经 dev-exemptions 单一来源）
const headDev = require(tmp);
const curDev = require(path.join(ROOT, 'src/dev-exemptions.js'));
fs.unlinkSync(tmp);

for (const s of rhSamples) {
  console.log(JSON.stringify({
    s: s.slice(0, 16),
    headTempRestore: headDev.isTemporaryRestorePromise(s),
    curTempRestore: curDev.isTemporaryRestorePromise(s),
    headDevCtx: headDev.isDevDebugContext(s),
    curDevCtx: curDev.isDevDebugContext(s),
    headFixture: typeof headDev.isTestFixtureReset === 'function' ? headDev.isTestFixtureReset(s) : 'absent',
    curFixture: curDev.isTestFixtureReset(s),
  }));
}
