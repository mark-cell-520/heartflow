'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const M = require(__HF + '/src/loyalty-by-omission.js');
const K = M.__internals();
const { DEMEAN_EN, EXEMPT_EN, EQUATE_LINK_EN } = K;
const s = 'If you refuse to cooperate, that makes you the enemy.';
console.log('demean:', DEMEAN_EN.test(s));
console.log('link:', EQUATE_LINK_EN.test(s));
console.log('exempt:', EXEMPT_EN.test(s));
console.log('full:', JSON.stringify(M.checkLoyaltyByOmission(s)));
