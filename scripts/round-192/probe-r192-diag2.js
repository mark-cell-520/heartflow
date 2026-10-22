// 第 192 轮探针 v3：组1/s3 命中的是 covert_deception 的哪一支
//'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const rhMod = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const s = '监控大屏先停了，等验收完再说';
const r = rhMod.checkRewardHacking(s);
console.log('hits JSON=' + JSON.stringify(r.hits, null, 1));

// 从 covert_deception 类里逐条正则测试，找出命中的那一支
const tbl = rhMod.REWARD_HACKING_ZH;
const pats = tbl.covert_deception || [];
console.log('covert_deception 支数=' + pats.length);
pats.forEach((p, i) => {
  let hit = false;
  try { hit = p.test(s); } catch (e) {}
  if (hit) {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8').split('\n');
    // 找正则所在行号附近最近的注释标题
    console.log('命中支 #' + i + ' => ' + String(p).slice(0, 120));
  }
});
