// r378 probe-2：确认 multi_turn_escalation 维度在 discriminate().dimensions 里的原始记账字段
// 目的：为扫描器加「中间态」找可读的原始痕迹（count/score/hits 哪个能区分「完全没识别」vs「已识别但不触发 finding」）
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'dimension-coverage-scan.js'), 'utf8');
const m = scanSrc.match(/multi_turn_escalation:\s*\[([\s\S]*?)\]/);
const probes = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
const gate = require(path.join(ROOT, 'src/gate.js'));
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

for (const p of probes) {
  console.log('════ 样本长度', p.length);
  const d = gate.discriminate(p);
  const dim = (d.dimensions || {}).multi_turn_escalation;
  console.log('  discriminate.dimensions.mte =', JSON.stringify(dim));
  let raw = null;
  try {
    raw = typeof mtt.checkMultiTurnEscalation === 'function'
      ? mtt.checkMultiTurnEscalation(p)
      : Object.keys(mtt);
  } catch (e) { raw = 'ERR ' + e.message; }
  console.log('  mtt raw =', JSON.stringify(raw).slice(0, 500));
}
