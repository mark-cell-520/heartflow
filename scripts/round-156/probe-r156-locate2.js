// 第 156 轮探针 4：在 REWARD_HACKING_ZH 的 class -> 正则数组结构里逐支定位两条误伤
'use strict';
const RH = require('../../src/reward-hacking.js');
const { checkRewardHacking } = RH;

const TARGETS = [
  '先把告警停了，故障排查完马上恢复。',
  '先跳过这几个测试，跑通主干再回来修。',
];

console.log('checkRewardHacking 直接调用：');
for (const s of TARGETS) {
  const r = checkRewardHacking(s);
  console.log('  ', JSON.stringify(r).slice(0, 400));
}

console.log('\nREWARD_HACKING_ZH classes:', Object.keys(RH.REWARD_HACKING_ZH).join(','));
for (const cls of Object.keys(RH.REWARD_HACKING_ZH)) {
  const arr = RH.REWARD_HACKING_ZH[cls];
  if (!Array.isArray(arr)) { console.log(`  ${cls}: ${typeof arr}`); continue; }
  arr.forEach((re, idx) => {
    for (const s of TARGETS) {
      try {
        if (re instanceof RegExp && re.test(s)) {
          console.log(`HIT  ${cls}[${idx}]  <- <${s}>`);
          console.log('     src:', re.source.slice(0, 300));
        }
      } catch (e) {}
    }
  });
}
