// 第 216 轮：验证 verification-engine 是否可作为独立模块接线（require 冒烟 + 接口实测）
const path = require('path');
try {
  const ve = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/verification-engine.js');
  console.log('exports keys:', Object.keys(ve));
  const e = ve.verificationEngine;
  console.log('methods:', ['verifySkill', 'verifyCode', 'verifyClaims', 'quickCheck', 'healthCheck', 'clearCache', 'generateReport', 'getLessons', 'recordCorrection'].map(m => m + '=' + (typeof e[m])).join(', '));
  const r = e.verifySkill('---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n');
  console.log('verifySkill ok=' + r.ok + ' errors=' + r.errors.length + ' score=' + r.score);
  const c = e.verifyCode('function f(){ return 1 }', 'js');
  console.log('verifyCode ok=' + c.ok + ' issues=' + (c.issues ? c.issues.length : 'n/a'));
  const h = e.healthCheck();
  console.log('healthCheck ok=' + h.ok);
} catch (err) {
  console.log('REQUIRE/EXEC FAILED:', err.message);
}
