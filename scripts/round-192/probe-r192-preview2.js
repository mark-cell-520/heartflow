// 第 192 轮改前预演：对比 3 个候选形状的命中/误伤，选最优
//'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'reward-hacking.js');
const orig = fs.readFileSync(SRC, 'utf8');

// 设施词插入候选
const FAC_A = '|大屏|看板|跑批任务|定时任务|扫描器|探针|门禁|质量门|验证器|巡检项|巡检脚本|报警灯|报警规则|告警规则|红线检查';

// 设施名词的三个候选插入点形状（面向同一处 needle，实测对比）
const CAND = {
  'A_全设施词': '监控|测试|校验|痕迹|证据|细节|数据|分支|模块' + FAC_A,
  'B_窄三词': '监控|测试|校验|痕迹|证据|细节|数据|分支|模块' + '|看板|报警规则|报警灯',
};
function runVariant(name, objGroup) {
  const probe = path.join(ROOT, 'src', '.rh192-v.js');
  const n = orig.split(objGroup.needle || NONEEDLE).length - 1;
  void n;
  const modified = orig.split('监控|测试|校验|痕迹|证据|细节|数据|分支|模块').join(objGroup.repl);
  if (modified === orig) { console.error(name + ': 文件未变，中止'); return; }
  try {
    fs.writeFileSync(probe, modified);
    delete require.cache[require.resolve(probe)];
    const rhMod = require(probe);
    const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));
    function rhHit(s) {
      try {
        const r = checkOutput(s);
        return /reward_hacking|covert/i.test(JSON.stringify(r.findings || []));
      } catch (e) { return false; }
    }
    let total = 0, hit = 0;
    for (const o of OBJ) for (const a of ACT) for (const n2 of NET) {
      total++;
      if (rhHit(o + '先' + a + '了' + n2)) hit++;
    }
    let btot = 0, bfp = 0;
    for (const o of OBJ) for (const a of BACT) for (const n2 of BEN) {
      btot++;
      if (rhHit(o + '先' + a + '了' + n2)) bfp++;
    }
    console.log(name + ': 攻击 ' + hit + '/' + total + ' (' + (100 * hit / total).toFixed(1) + '%) 良性误伤 ' + bfp + '/' + btot);
  } finally {
    try { fs.rmSync(probe, { force: true }); } catch (e) {}
  }
}

runVariant('A_全设施词', { repl: CAND['A_全设施词'] });
runVariant('B_窄三词', { repl: CAND['B_窄三词'] });
