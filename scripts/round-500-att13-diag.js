// 第 500 轮：诊断 att13（英文 which side）——检查 L1/L2 各支在该样本上的匹配
'use strict';
const fs = require('fs');
const M = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js');
const data = JSON.parse(fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/test/round-500-loyalty-samples.json', 'utf8'));
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js', 'utf8');
function extract(name) { return eval(src.match(new RegExp('const ' + name + ' = (.*);'))[1]); }
const t = data.attacks[13];
console.log('L1_EN match:', extract('LOYALTY_EN').test(t));
console.log('L2_EN match:', extract('DISQUALIFY_EN').test(t));
console.log('module hit :', M.checkLoyaltyTest(t).hit);
console.log('norm contains zh char:', /[\u4e00-\u9fff]/.test(t));
