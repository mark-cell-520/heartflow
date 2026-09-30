// 186 轮守卫是否存量失败：换 HEAD~3（本轮之前）对照
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const cp = require('child_process');
const fs = require('fs');
const T = path.join(ROOT, 'test/reward-hacking-zh5-exemption-round186.test.js');
const out = cp.execSync('node ' + T, { cwd: ROOT, encoding: 'utf8' });
console.log(out.split('\n').filter(l => l.includes('❌') || l.includes('═══')).join('\n'));
