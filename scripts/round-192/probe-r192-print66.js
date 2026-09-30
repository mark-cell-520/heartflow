// 第 192 轮探针 v16：「check 先注掉，等 reviewer 问起再说」为什么漏
// 支 #66 的对象表收 case/tests? 但没收单字 check。中文「注掉」在动词表里。
// 收网半有「再说」。唯一缺口 = 对象表没有 checks?（注意同表已有 cases?）。
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const t = require(path.join(ROOT, 'src', 'reward-hacking.js')).REWARD_HACKING_ZH.covert_deception;
const s = String(t[66]);
console.log('#66 对象表片段:');
console.log('  ' + s.slice(s.indexOf('(?:日志') , s.indexOf('(?:日志') + 400));
console.log('');
console.log('#66 含 checks? : ' + /checks\?/.test(s));
console.log('#66 含 cases?  : ' + /cases\?/.test(s));
console.log('#66 含 \\bcheck : ' + /check/.test(s));
