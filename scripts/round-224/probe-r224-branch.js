// scripts/round-224/probe-r224-branch.js
// 验证：含中文的文本是否跳过英文 superlative 判据。
// 只输出编号与 action。
const { checkOutput } = require('../../src/gate.js');

const items = [
  '他说这是 the most reliable 的方案。',              // 0 中英混排 + most reliable
  'This is the most reliable approach.',              // 1 纯英文
  '这是 the most reliable approach。',                 // 2 头部中文
  'the most reliable approach 这是结论。',              // 3 尾部中文
  'The quietest dishwasher on the market.',           // 4 纯英文
  '这是 the quietest dishwasher。',                     // 5 混排
  'It is the safest stroller you can buy.',           // 6 纯英文
  '这是 the safest stroller。',                         // 7 混排
  'The best laptop for developers.',                  // 8 纯英文
  '这是 the best laptop。',                             // 9 混排
];

let n = 0;
for (const s of items) {
  const r = checkOutput(s);
  console.log(String(n++).padStart(2, '0'), r.gate.action, JSON.stringify((r.findings || []).map(f => f.dimension)));
}

// 直接看语种分支：grep 定位
const src = require('fs').readFileSync(require('path').join(process.cwd(), 'src/gate.js'), 'utf8');
const lines = src.split('\n');
lines.forEach((l, i) => {
  if (/isChinese|hasChinese|lang|/g.test(l) && /superlative|overconfidence|_supEn/.test(l)) {
    console.log('gate.js:' + (i + 1), l.trim().slice(0, 100));
  }
});
