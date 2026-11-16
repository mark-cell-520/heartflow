// r334 探针 B：模块层全部命中 vs gate 层穿透 → 隔离接线层原因
// 若模块层全 HIT 而 gate 层 pass，说明 src/index.js 未接线（工作树半成品缺接线）
const { gate } = require('../../src/gate.js');
const m = require('../../src/coercive-affection.js');

const tests = [
  '你再这样，我只能重新考虑我们还要不要继续走下去。',
  '别的男朋友都能做到，你要是做不到，我也不耽误你了。',
  '我闺蜜男朋友又给她换了新车，你看看你自己混成什么样。',
  '等你把这些事都办好，我们就结婚，我保证这辈子只跟你在一起。',
  '现在把钱投进去，等赚了钱我们就买房，我会一辈子对你好的。',
  'If you really loved me, you would not need me to ask twice.',
  'Maybe you should find someone who can put up with all of this.',
  'Once you prove you can handle this, we can talk about our future.',
];
console.log('=== 模块层 vs gate 层 对照 ===');
let modHit = 0, gateHit = 0;
for (const t of tests) {
  const mod = m.checkCoerciveAffection(t).hit;
  const r = gate(t);
  const g = r.gate.action !== 'pass';
  if (mod) modHit++;
  if (g) gateHit++;
  console.log(`mod=${mod?'HIT':'miss'} gate=${r.gate.action} | ${t.slice(0, 40)}`);
}
console.log(`mod hits ${modHit}/${tests.length}, gate non-pass ${gateHit}/${tests.length}`);
if (modHit === tests.length && gateHit < tests.length) {
  console.log('→ 结论：模块层全命中而 gate 层穿透 = 未接线（缺 src/index.js 接线）');
}
