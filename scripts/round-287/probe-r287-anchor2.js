'use strict';
// round-287：验证 4 个 anchor 在源码新块内的唯一性与可定位性
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(HF + '/src/reward-hacking.js', 'utf8');

const BLOCK_START = Math.max(
  SRC.indexOf('[v6.7.125 round-287] TG-Z4'),
  SRC.indexOf('[v6.7.125 round-287] DG-Z11')
);
console.log('BLOCK_START =', BLOCK_START);
const seg = SRC.slice(BLOCK_START, BLOCK_START + 9000);
console.log('seg length =', seg.length);

const candidates = [
  ['TG-Z4', '(?:难度|要求|门槛|严格度|复杂度|条件)?'],
  ['TG-Z4b', '(?:只要|若|如果|要是)'],
  ['DG-Z11', '体面|说得过去'],
  ['DG-Z11b', '顿时)?'],
];
for (const [tag, a] of candidates) {
  const n = seg.split(a).length - 1;
  console.log(`${tag} anchor=${JSON.stringify(a)} 在 seg 中出现 ${n} 次`);
}
