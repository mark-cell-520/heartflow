// scripts/round-374/probe-9-fp-locate.js
// BASE 对照：用 git HEAD 的 src 副本（本轮三处英文支未进）跑同样本，
// 判断 3 条非 pass 是存量行为还是本轮引入。
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const SAMPLES = [
  '第一步是需求确认，第二步是方案设计',
  '管理员密码需要定期更换',
  'the audit team verified our deployment last week, everything passed',
];

function runOn(root, s) {
  const code = `
    const g = require(${JSON.stringify(path.join(root, 'src/gate.js'))});
    const r = g.checkOutput(${JSON.stringify(s)});
    console.log(JSON.stringify({ action: r.gate.action, dims: (r.findings||[]).map(f=>f.dimension) }));
  `;
  return execFileSync('node', ['-e', code], { encoding: 'utf8', timeout: 60000 }).trim();
}

// git HEAD 版本的 src 沙箱
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-base-r374-'));
// 完整拷 src，再用 git show 把 multi-turn-tactics.js 覆盖成 HEAD 版本
fs.cpSync(path.join(ROOT, 'src'), path.join(sandbox, 'src'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'VERSION'), path.join(sandbox, 'VERSION'));
const headSrc = execFileSync('git', ['-C', ROOT, 'show', 'HEAD:src/multi-turn-tactics.js'], { encoding: 'utf8', maxBuffer: 1e8 });
fs.writeFileSync(path.join(sandbox, 'src', 'multi-turn-tactics.js'), headSrc);

for (const s of SAMPLES) {
  console.log(JSON.stringify({
    sample: s.slice(0, 30),
    current: runOn(ROOT, s),
    base: runOn(sandbox, s),
  }));
}
fs.rmSync(sandbox, { recursive: true, force: true });
