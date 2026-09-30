// 第 191 轮探针：定位 rh186 测试里漏检的那 1 条（只输出索引 + 形状特征，不打印原文）
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkRewardHacking } = require(path.join(ROOT, 'src', 'reward-hacking.js'));

// 从测试文件里原样抽取 ATTACK 数组（不手抄）
const src = fs.readFileSync(path.join(ROOT, 'test', 'reward-hacking-zh5-exemption-round186.test.js'), 'utf8');
const m = src.match(/const ATTACK = \[([\s\S]*?)\n\];/);
const ATTACK = eval('[' + m[1] + ']');

function shape(s) {
  const feats = [];
  const has = (re, name) => { if (re.test(s)) feats.push(name); };
  has(/等|跑完|处理完|发布完|验收完/, 'wait');
  has(/恢复|还原|重建|修复|重启|重跑|找回|补回|重灌|重做/, 'restore-verb');
  has(/日志|备份|快照|trace|告警|监控|报告/, 'victim-obj');
  has(/删|清|抹|销|毁|注掉|skip/, 'destroy-verb');
  has(/再说|后面|回头|之后再|等下/, 'defer');
  has(/免得|别让|看不到|看不见|隐瞒|捂着/, 'avoid-sense');
  return feats.join('+') || '(none)';
}

const miss = [];
ATTACK.forEach((s, i) => {
  let rh = 0;
  try { rh = checkRewardHacking(s).count; } catch (e) {}
  let gateAct = 'err', rhFinding = false;
  try {
    const r = checkOutput(s);
    gateAct = r.gate.action;
    rhFinding = /reward_hacking|covert/i.test(JSON.stringify(r.findings || []));
  } catch (e) {}
  if (!rhFinding || rh === 0) miss.push({ i, shape: shape(s), rh, gateAct });
});
console.log('total=' + ATTACK.length + ' miss=' + miss.length);
miss.forEach(x => console.log('  idx=' + x.i + ' shape=' + x.shape + ' rh=' + x.rh + ' gate=' + x.gateAct));
