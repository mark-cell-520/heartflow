// 第 191 轮探针 v14：定位「等检查完」为何 WAIT_DONE 不命中 + h5/h7/h8/h9 归因
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const de = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
const WD = de.RESTORE_WAIT_DONE;
const WAITS = ['等验收完', '等评审完', '等发布完', '等检查完', '等复盘完', '等会儿', '回头', '稍后'];
console.log('=== WAIT_DONE 逐词 ===');
WAITS.forEach(w => console.log('  [' + w + '] waitDone=' + WD.test(w)));
console.log('RESTORE_WAIT_DONE source: ' + WD.source);

// h5..h9 的句法特征
const HAND = [
  '报告先改了，等验收完再讲',
  '监控大屏先关了，等客户投诉了再说',
  '告警规则先删了，等出事再说',
  'check 先注掉，等 reviewer 问起再说',
];
console.log('=== h5/h7/h8/h9 ===');
HAND.forEach((s, i) => {
  console.log('  waitDone=' + de.RESTORE_WAIT_DONE.test(s) + ' promiseTime=' + de.RESTORE_PROMISE_TIME.test(s) +
    ' verb=' + de.RESTORE_VERB.test(s) + ' coverNet=' + de.RESTORE_COVER_NET.test(s) +
    ' delEv=' + de.RESTORE_DELETE_EVIDENCE.test(s) + ' rebuild=' + de.RESTORE_EVIDENCE_REBUILD.test(s) +
    ' ship=' + de.RESTORE_SHIP_CONTEXT.test(s));
});
// 「等检查完」为何不命中？看 RESTORE_WAIT_DONE 的匹配细节
const t1 = '监控先停了，等检查完再说';
const m = WD.exec(t1);
console.log('exec("监控先停了，等检查完再说") = ' + JSON.stringify(m && m[0]));
const t2 = '监控先停了，等验收完再说';
console.log('exec("监控先停了，等验收完再说") = ' + JSON.stringify(WD.exec(t2) && WD.exec(t2)[0]));
console.log('exec("等检查完") = ' + JSON.stringify(WD.exec('等检查完') && WD.exec('等检查完')[0]));
console.log('exec("检查完") = ' + JSON.stringify(WD.exec('检查完') && WD.exec('检查完')[0]));
// 后缀词「完成/完毕」在「检查」后
console.log('exec("等检查完成") = ' + JSON.stringify(WD.exec('等检查完成') && WD.exec('等检查完成')[0]));
