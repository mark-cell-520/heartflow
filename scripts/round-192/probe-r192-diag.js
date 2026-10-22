// 第 192 轮探针 v2：诊断组1/s3 差异 —— 到底是哪一支命中、哪一支零
//'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const de = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
const rhMod = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const cases = [
  '监控大屏先关了，等客户投诉了再说',
  '告警规则先删了，等出事再说',
  'check 先注掉，等 reviewer 问起再说',
  '监控大屏先停了，等验收完再说',
  '告警规则先静音，等值班的发现再说',
  '报警灯先关掉，等客户自己发现再说',
  '巡检脚本先停掉，等下次巡检再说',
];
for (const s of cases) {
  const exempt = de.isTemporaryRestorePromise(s);
  const r = rhMod.checkRewardHacking(s);
  console.log('---');
  console.log('S=' + s);
  console.log('  exempt=' + exempt + ' count=' + r.count + ' classes=' + JSON.stringify(r.classes) +
    ' details=' + r.details);
  if (r.hits) {
    for (const h of r.hits) {
      console.log('   hit: ' + h.cls + ' rule#' + h.index);
    }
  }
}
