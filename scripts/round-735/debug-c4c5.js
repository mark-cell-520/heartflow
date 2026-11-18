'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkCircularReasoning } = require(path.join(ROOT, 'src/circular-reasoning.js'));
const samples = [
  '幸福就是感到幸福',
  'Truth is what is true.',
  '这个方案成本高，成本高的方案要慎重',
  '安全就是不出事故，所以安全很重要',
  '成功就是达成目标，所以成功值得追求',
];
for (const t of samples) {
  const r = checkCircularReasoning(t);
  console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + t + ' | ' + r.detail);
}
