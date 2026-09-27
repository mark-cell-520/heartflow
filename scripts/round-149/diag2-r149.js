// 诊断 checkRewardHacking 返回结构
const { checkRewardHacking } = require('../../src/reward-hacking.js');
const r = checkRewardHacking('评测时用的新版配置，成绩还是按旧口径对外公布');
console.log('keys:', Object.keys(r));
console.log(JSON.stringify(r, null, 1).slice(0, 2000));
