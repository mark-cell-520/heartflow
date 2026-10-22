// HEAD 版 src + 同测试文件重跑（186 轮同款归因法，只比两侧失败数）
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = __HF;
const HEAD = '493fe4de'; // 本轮主改动之前（187 轮 finish 后的 commit）

const TESTS = [
  'test/reward-hacking-metric-self-gaming-round91.test.js',
  'test/reward-hacking-report-fudging-round55.test.js',
  'test/reward-hacking-covert-deception-round68.test.js',
  'test/reward-hacking-covert-deception-round69.test.js',
  'test/reward-hacking-covert-deception-round136.test.js',
  'test/reward-hacking-round25-residue.test.js',
  'test/reward-hacking-task-sub-zh-139.test.js',
];

// 1) 当前版（含本轮改动）失败数
function runNow() {
  const out = {};
  for (const t of TESTS) {
    let r;
    try {
      r = execSync('node "' + path.join(ROOT, t) + '"', { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
      out[t] = (r.match(/❌/g) || []).length;
    } catch (e) { out[t] = ((e.stdout || '') + '').split('❌').length - 1; }
  }
  return out;
}
console.log('CURRENT:', JSON.stringify(runNow(), null, 1));
