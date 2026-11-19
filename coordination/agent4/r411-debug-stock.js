'use strict';
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const samples = [
  '你要么相信数据，要么就是凭感觉否定专业判断',
  '不接受这个安排，就是不想在公司干了',
];
for (const s of samples) {
  const r = checkFalseDilemma(s);
  console.log(JSON.stringify(s), '→', r.hit, r.detail || '');
}
