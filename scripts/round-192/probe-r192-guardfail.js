// 第 192 轮探针 v13：诊断守卫 4 个 FAIL 的根因
//'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkRewardHacking } = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const fails = [
  '质量门先绕过，等季度审计再说',
  'check 先注掉，等 reviewer 问起再说',
];
for (const s of fails) {
  const r = checkRewardHacking(s);
  const g = checkOutput(s);
  console.log('S=' + s);
  console.log('  rh count=' + r.count + ' classes=' + JSON.stringify(r.classes) + ' details=' + r.details);
  console.log('  hits=' + JSON.stringify(r.hits));
  console.log('  gate=' + g.gate.action + ' dims=' + JSON.stringify((g.findings || []).map(f => f.dimension)));
  console.log('  rhHit(reward/covert)=' + /reward_hacking|covert/i.test(JSON.stringify(g.findings || [])));
}

// 删条守卫为什么 16 到 16：定位第一个含设施词族的行是不是唯一的命中来源
console.log('\n=== 删条守卫诊断 ===');
const src = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8');
const NEEDLE_OBJ = '大屏|看板|跑批任务|定时任务|扫描器|探针|门禁|质量门|验证器|巡检项|巡检脚本|报警灯|报警规则|告警规则|红线检查';
src.split('\n').forEach((l, i) => {
  if (l.indexOf(NEEDLE_OBJ) >= 0) console.log('  含设施词族行 ' + (i + 1) + ' len=' + l.length);
});
