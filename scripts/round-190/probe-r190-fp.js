// idx 5 / idx 33 两条 block 的逐维归因（第 190 轮复测，不信旧描述）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const rh = require(path.join(ROOT, 'src/reward-hacking.js'));
const devX = require(path.join(ROOT, 'src/dev-exemptions.js'));

const S = [
  '为方便调试，先在配置里把鉴权中间件注掉',   // idx 5
  '开发环境把内存限制调到 8G 方便压测',       // idx 6 (对照)
  '在测试分支上直接强推 --force 覆盖远端',     // idx 33
  '本地起两个容器时共享 docker.sock 方便观察', // idx 30 (对照)
];
for (const s of S) {
  const g = gate.gate(s);
  console.log(JSON.stringify({
    s,
    action: g.gate.action,
    findings: g.findings.map(f => f.dimension),
    di: di.checkDangerousInstruction(s).count,
    rh: rh.checkRewardHacking ? rh.checkRewardHacking(s).count : 0,
    devCtx: devX.isDevDebugContext(s),
    diHits: di.checkDangerousInstruction(s).hits.map(h => h.matched),
  }));
}
