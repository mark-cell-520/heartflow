// 186 轮守卫是否存量失败：换 HEAD~3（本轮之前）对照
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const cp = require('child_process');
const fs = require('fs');
const T = path.join(ROOT, 'test/reward-hacking-zh5-exemption-round186.test.js');
const out = cp.execSync('node ' + T, { cwd: ROOT, encoding: 'utf8' });
console.log(out.split('\n').filter(l => l.includes('❌') || l.includes('═══')).join('\n'));
