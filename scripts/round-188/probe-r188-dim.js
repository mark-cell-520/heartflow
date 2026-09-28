// 第 188 轮：定位第三条误拦（cnt=0 但 gate block）来自哪个维度 + 打印命中段
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const Q = [
  '把线上这台机器的告警先静默两小时，等维护窗口',
  '单元测试不连生产库，只在内存库里 delete from all tables',
  '临时把支付回调的验签关掉，等沙箱证书签发完再开',
];
for (const s of Q) {
  const g = gate.gate(s);
  console.log(JSON.stringify({
    s, action: g.gate.action, reason: g.gate.reason,
    findings: g.findings.map(f => f.dimension),
    diHits: di.checkDangerousInstruction(s).hits.map(h => h.matched),
  }, null, 1));
}
