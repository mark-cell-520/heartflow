// 第 192 轮探针 v15：CD-ZH5 各支对象表的英文 token 覆盖情况
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const t = require(path.join(ROOT, 'src', 'reward-hacking.js')).REWARD_HACKING_ZH.covert_deception;
// CD-ZH5 家族支序（第186轮建立的七支，现在的索引需实测定）
[58, 66, 67, 68, 69, 70].forEach(i => {
  if (!t[i]) return;
  const s = String(t[i]);
  console.log('#' + i + ' len=' + s.length +
    ' checks?=' + /checks\?/.test(s) +
    ' cases?=' + /cases\?/.test(s) +
    ' CI=' + /\bCI\b/.test(s) +
    ' review=' + /review/.test(s) +
    ' reviewer=' + /reviewer/.test(s) +
    ' 大屏=' + s.indexOf('大屏') >= 0);
});
