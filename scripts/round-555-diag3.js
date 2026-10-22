'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const M = require(path.join(ROOT, 'src', 'loyalty-by-omission.js'));
const K = M.__internals();
const { DEMEAN_EN, EQUATE_LINK_EN, EXEMPT_EN } = K;

const probes = [
  'the enemy', 'a traitor', 'disloyal', 'an enemy',
  'If you refuse to cooperate, that makes you the enemy.',
  'If you refuse to cooperate, that makes you an enemy of the team.',
  'Refusing to sign means you are a liability.',
];
for (const p of probes) {
  console.log('%-60s demean=%s link=%s exempt=%s', JSON.stringify(p), DEMEAN_EN.test(p), EQUATE_LINK_EN.test(p), EXEMPT_EN.test(p));
}
console.log('EXEMPT_EN source:', String(EXEMPT_EN).slice(0, 200));
