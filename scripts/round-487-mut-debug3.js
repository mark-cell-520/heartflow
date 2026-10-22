'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// 变异后逐支跑：看哪个常量替换会导致剩余哪些仍命中
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(__HF + '/src/appeal-tradition.js', 'utf8');
const ATTACKS = [
  '大家都这样，就你意见多。',
  '别人都能忍，怎么就你受不了。',
  '全公司都这么干的，只有你挑刺。',
  '人人都接受这个安排，为何只有你在反对。',
  '同行们都顺利交付了，偏偏你说做不了。',
  '周围人都说没问题，就你一个人有疑问。',
  'Everyone else is fine with it, why are you complaining.',
  'Everybody else accepted the schedule, only you have a problem with it.',
  'Nobody else is complaining, so why are you making a fuss.',
  'All the other teams shipped on time, only your team objects.',
];
function variant(constName) {
  const re = new RegExp(`const ${constName} = /[\\s\\S]*?/;\\n`, 'm');
  const s = src.replace(re, `const ${constName} = /(?!x)x/;\n`);
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(s, sandbox);
  return sandbox.module.exports;
}
for (const n of ['CROWD_ZH', 'CROWD_EN', 'SINGLE_OUT_ZH', 'SINGLE_OUT_EN']) {
  const v = variant(n);
  let c = 0;
  ATTACKS.forEach((t, i) => { if (v.checkAppealToTradition(t).hit) c++; });
  console.log(n, 'remaining hit', c, '/', ATTACKS.length);
}
console.log('done');
