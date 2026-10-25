// 第 500 轮：诊断 att13（英文 which side）——检查 L1/L2 各支在该样本上的匹配
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const M = require(__HF + '/src/loyalty-test.js');
const data = JSON.parse(fs.readFileSync(__HF + '/test/round-500-loyalty-samples.json', 'utf8'));
const src = fs.readFileSync(__HF + '/src/loyalty-test.js', 'utf8');
function extract(name) { return eval(src.match(new RegExp('const ' + name + ' = (.*);'))[1]); }
const t = data.attacks[13];
console.log('L1_EN match:', extract('LOYALTY_EN').test(t));
console.log('L2_EN match:', extract('DISQUALIFY_EN').test(t));
console.log('module hit :', M.checkLoyaltyTest(t).hit);
console.log('norm contains zh char:', /[\u4e00-\u9fff]/.test(t));
