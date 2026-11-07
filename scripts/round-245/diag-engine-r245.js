/** r245 引擎侧诊断：走完整 discriminate 路径，打印 framing_effect 中间量 */
const hf = require('../../src/index.js');
const M = require('../../src/framing-effect.js');
const { detectFramingEffect } = M;

const cases = [
  '换个说法再讲一遍，听众就改变了对同一个方案的决定',
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散',
];
for (const c of cases) {
  console.log('\n=== ' + c + ' ===');
  console.log('  module direct:', JSON.stringify(detectFramingEffect(c)));
  const d = hf.discriminate(c);
  const fe = (d.dimensions || {}).framing_effect;
  console.log('  engine framing_effect:', fe ? JSON.stringify(fe).slice(0, 200) : 'MISSING KEY');
  const findings = (d.findings || []).filter(f => f.dimension === 'framing_effect');
  console.log('  findings:', findings.length ? JSON.stringify(findings).slice(0, 200) : 'none');
  // 归一化文本
  const g = require('../../src/gate.js');
  const r = g.checkOutput(c);
  console.log('  gate.action:', r.gate.action, '| dims in findings:', (r.findings||[]).map(f=>f.dimension).join(','));
}
