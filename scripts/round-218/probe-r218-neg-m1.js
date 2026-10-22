// 第 218 轮守卫 v2：三个变异不变红的原因诊断
// M1 fail=0 —— `const activeRules = void 0` 后 evaluate 还成功？看是不是 try/catch 兜住
// M2b fail=0、M3 fail=0 —— reasoning 归一化被改坏但 _selfVerification 仍落地？
const path = require('path');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));
const assert = require('assert');
// M1 复刻：activeRules=void 0
const dr = new DecisionRouter({}, { modelProfile: 'flash' });
try {
  const r = dr.evaluate({ type: 'probe', data: {} }, 'probe', '这个操作有风险会导致危险', null);
  console.log('M1-NO-MUTATION ok matched=' + r.matched);
} catch (e) { console.log('M1-NO-MUTATION threw: ' + e.message); }
// 手动把 _activeRulesForEval 设 void
const dr2 = new DecisionRouter({}, { modelProfile: 'flash' });
const origEval = dr2.evaluate.bind(dr2);
// 直接改原型级别的局部变量不可能，只能验证「CED 分支进不去」路径
console.log('cedEnabled=' + dr2._cedEnabled + ' hasCed=' + !!dr2._ced);
