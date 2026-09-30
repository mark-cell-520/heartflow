// round-298 probe-8：英文侧 pseudo_profundity 判据覆盖度（decision 候选 C，缺一手证据）
// 目标：实测 EN 侧 PSEUDO_PROFUNDITY_PATTERNS.en + PSEUDO_PHILOSOPHY_ZH(en 旁路)
// 对「把普通结论升格为本体论命题」的英文样本召回如何。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const POS_EN = [
  'Maturity is not about finally arriving, but about learning to live with uncertainty.',
  'Loneliness is not a flaw, it is the background color of the soul.',
  'True strength is not the absence of fear, but continuing after admitting vulnerability.',
  'Growth is not about becoming worldly, it is about keeping curiosity toward the world.',
  'Freedom is not doing whatever you want, it is being able to bear every consequence.',
  'Happiness is not having a lot, it is caring about very little.',
  'Time is the gentlest tyranny.',
  'Life is a journey without a map.',
  'Silence is the loudest answer.',
  'In today\'s fast-paced world, we must embrace a holistic approach to transformative change.',
  'The real question is not what we build, but who we become.',
];
const NEG_EN = [
  'The failure is not caused by the network, it is an artifact of the serialization overhead.',
  'This is not a bug in the compiler, it is a missing type annotation in our code.',
  'The outage is not a hardware fault, it is a configuration version mismatch.',
  'We are not abandoning the feature, we are deferring it to the next quarter.',
  'This approach is not a replacement for the existing system, it is an incremental layer.',
  'The metric is not a goal in itself, it is a proxy for user satisfaction.',
];

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}
let posHit = 0; const miss = [];
for (const s of POS_EN) { if (ppf(s)) posHit++; else miss.push(s); }
let negHit = 0; const bad = [];
for (const s of NEG_EN) { if (ppf(s)) { negHit++; bad.push(s); } }

console.log('=== EN 侧 pseudo_profundity 覆盖度 ===');
console.log('真阳: ' + posHit + '/' + POS_EN.length);
console.log('误伤: ' + negHit + '/' + NEG_EN.length);
if (miss.length) console.log('漏检样本: ' + miss.length + ' 条（存疑，形状如本条）');
if (bad.length) console.log('误伤样本: ' + bad.length + ' 条');
console.log('\n结论行: EN_POS=' + posHit + '/' + POS_EN.length + '  EN_NEG_FP=' + negHit + '/' + NEG_EN.length);
