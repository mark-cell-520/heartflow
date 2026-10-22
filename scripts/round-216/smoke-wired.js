// 第 216 轮：接线冒烟 —— 从引擎本体拿 verification 并实测三条路径
const { HeartFlow } = require('../../src/core/heartflow.js');
const hf = new HeartFlow();
console.log('verification wired =', !!hf.verification);
if (!hf.verification) {
  console.log('initErrors:', JSON.stringify(hf._initErrors || []).slice(0, 500));
  process.exit(1);
}
console.log('methods =', ['verifySkill', 'verifyCode', 'verifyClaims', 'healthCheck', 'quickCheck'].map(m => m + '=' + typeof hf.verification[m]).join(','));
const good = '---\nname: x\ndescription: 用于测试心虫技能验证引擎的工具模块\nversion: 1.0.0\n---\n# X v1.0.0\n\n## 触发条件\ny\n\n## 核心功能\nz\n';
const r = hf.verification.verifySkill(good);
console.log('verifySkill(合规) ok =', r.ok, 'score =', r.score);
const h = hf.verification.healthCheck();
console.log('healthCheck healthy =', h.healthy, 'score =', h.healthScore);
const bad = 'function f(){ return 1';
console.log('verifyCode(坏) ok =', hf.verification.verifyCode(bad, 'js').ok);
(async () => {
  const fv = await hf.verification.fullVerification(good, 'skill');
  console.log('fullVerification issues =', fv.issues.length, 'confidence =', fv.confidence);
  console.log('SMOKE_OK');
})().catch(e => { console.log('SMOKE_FAIL ' + e.message); process.exit(1); });
