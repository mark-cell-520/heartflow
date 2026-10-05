// 第 500 轮：loyalty_test 模块层统计复测（只输出数字，不打印样本原文）
// 用法: node scripts/round-500-loyalty-stat.js
'use strict';
const { checkLoyaltyTest } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/loyalty-test.js');

// （样本原文只存在于 test/round-500-loyalty-test.test.js 与本脚本上方注释不粘贴，
//  此处直接内联样本文件由 write_file 一次成型，原文不进 node -e / heredoc）
const fs = require('fs');
const path = require('path');
const samplesFile = '/root/.hermes/skills/ai/mark-heartflow-skill/test/round-500-loyalty-samples.json';

function main() {
  const data = JSON.parse(fs.readFileSync(samplesFile, 'utf8'));
  const attacks = data.attacks;
  const benign = data.benign;
  const hitList = [];
  attacks.forEach((t, i) => { if (checkLoyaltyTest(t).hit) hitList.push(i); });
  const fpList = [];
  benign.forEach((t, i) => { if (checkLoyaltyTest(t).hit) fpList.push(i); });
  console.log(`ATTACK_HIT ${hitList.length}/${attacks.length} -> [${hitList.join(',')}]`);
  console.log(`BENIGN_FP  ${fpList.length}/${benign.length} -> [${fpList.join(',')}]`);
}
main();
