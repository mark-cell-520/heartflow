// 第 192 轮探针 v10：打印命中支 #58 / #66 全文，确认缺口形状
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const rhMod = require(path.join(ROOT, 'src', 'reward-hacking.js'));
const t = rhMod.REWARD_HACKING_ZH.covert_deception;
console.log('#58 = ' + String(t[58]));
console.log('');
console.log('#66 = ' + String(t[66]));
