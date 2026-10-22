// r225 探针 2：看 checkContradiction 英文侧到底跑不跑（别信"命中 0"就是缺口）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

const SAMPLES = [
  'First, this system is very fast. But it is also very slow in practice.',
  'Although the design looks clean, it is however deeply flawed inside.',
  'I fully support this proposal. I have always opposed it strongly.',
  'We will launch next month. We already postponed it twice this year.',
  'The API is stable. The API is not stable at all.',
];

for (const t of SAMPLES) {
  const r = idx.checkContradiction(t);
  console.log('---');
  console.log('keys=' + JSON.stringify(Object.keys(r || {})));
  console.log(JSON.stringify(r).slice(0, 600));
}
