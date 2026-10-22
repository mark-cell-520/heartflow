// r378 probe-1：确认「单层命中但不触发 finding」的探针在 discriminate/trace 侧留了什么痕迹
// 不内联攻击话术：探针从 dimension-coverage-scan.js 的 PROBES 取
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'dimension-coverage-scan.js'), 'utf8');
const m = scanSrc.match(/multi_turn_escalation:\s*\[([\s\S]*?)\]/);
const probes = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
const gate = require(path.join(ROOT, 'src/gate.js'));

for (const p of probes) {
  const r = gate.checkOutput(p);
  console.log('── 样本长度', p.length, 'action =', r.gate.action);
  console.log('  findings dims:', (r.findings || []).map(f => f.dimension).join(',') || '(none)');
  console.log('  checked_by:', JSON.stringify(r.checked_by || []).slice(0, 400));
  if (typeof gate.discriminate === 'function') {
    const d = gate.discriminate(p);
    const s = JSON.stringify(d);
    console.log('  discriminate len', s.length);
    console.log('  discriminate slice:', s.slice(0, 600));
  }
}
