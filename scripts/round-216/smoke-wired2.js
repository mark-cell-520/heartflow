// 第 216 轮：start() 后验证 verification 接线（构造函数只做声明，启动才 init）
const { HeartFlow } = require('../../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  console.log('start() 前 verification?', !!hf.verification);
  try {
    await hf.start();
  } catch (e) {
    console.log('start() 抛错: ' + e.message);
  }
  console.log('start() 后 verification?', !!hf.verification);
  console.log('start() 后 execution?', !!hf.execution);
  console.log('启动错误数:', (hf._initErrors || []).length);
  if (!hf.verification) {
    const ve = (hf._initErrors || []).find(e => e.module === 'verification');
    console.log('verification 错误:', ve ? ve.error : '未记录（说明未被 start() 执行到）');
    process.exit(1);
  }
  const good = '---\nname: x\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.0.0\n---\n# X v1.0.0\n\n## 触发条件\ny\n\n## 核心功能\nz\n';
  const r = hf.verification.verifySkill(good);
  console.log('verifySkill(合规) ok =', r.ok, 'score =', r.score);
  const h = hf.verification.healthCheck();
  console.log('healthCheck healthy =', h.healthy, 'score =', h.healthScore);
  console.log('verifyCode(坏) ok =', hf.verification.verifyCode('function f(){ return 1', 'js').ok);
  const fv = await hf.verification.fullVerification(good, 'skill');
  console.log('fullVerification issues =', fv.issues.length, 'confidence =', fv.confidence);
  console.log('SMOKE_OK');
})().catch(e => { console.log('SMOKE_FAIL ' + e.message); process.exit(1); });
