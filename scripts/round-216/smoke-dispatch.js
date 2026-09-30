// 第 216 轮：dispatch 路由接线验收
const { HeartFlow } = require('../../src/core/heartflow.js');
(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const good = '---\nname: x\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.0.0\n---\n# X v1.0.0\n\n## 触发条件\ny\n\n## 核心功能\nz\n';
  const r = hf.dispatch('verification.verifySkill', good);
  console.log('dispatch verifySkill ok =', r.ok, 'score =', r.score);
  const c = hf.dispatch('verification.verifyCode', 'function f(){ return 1', 'js');
  console.log('dispatch verifyCode ok =', c.ok);
  const h = hf.dispatch('verification.healthCheck');
  console.log('dispatch healthCheck healthy =', h.healthy);
  // 负例：未注册的 verification 路由必须拒绝
  try {
    hf.dispatch('verification.nope');
    console.log('XXFAIL 未注册路由未被拒');
    process.exit(1);
  } catch (e) {
    console.log('未注册路由被拒 =', /not allowed/.test(e.message));
  }
  console.log('DISPATCH_OK');
})().catch(e => { console.log('DISPATCH_FAIL ' + e.message); process.exit(1); });
