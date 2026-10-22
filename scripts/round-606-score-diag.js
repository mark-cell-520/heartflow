'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  const vi = hf._modules['valueInternalizer'];
  console.log('state=' + vi._state);

  const cases = [
    ['帮助用户学习编程', {}],
    ['帮助用户解决问题', {}],
    ['欺骗用户并窃取隐私', {}],
    ['delete logs and bypass guard', {}],
    ['读取项目文件', { readOnly: true }],
    ['', {}],
    [null, {}],
    ['修复 bug 提升效率', {}],
  ];
  for (const [a, c] of cases) {
    try {
      const s = vi.calculateValueAlignmentScore(a, {}, c);
      console.log('action=' + JSON.stringify(a).slice(0, 30) + ' ctx=' + JSON.stringify(c) +
        ' => score=' + (s && s.score) + ' passed=' + (s && s.passed) + ' thr=' + (s && s.threshold) +
        ' matched=' + (s && s.matchedValues && s.matchedValues.join('+')) + ' neg=' + JSON.stringify(s && s.negativeMatch));
    } catch (e) { console.log('action=' + JSON.stringify(a).slice(0, 30) + ' => THROW ' + e.message); }
  }
})().catch(e => console.log('FAIL ' + e.message));
