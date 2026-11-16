// r630: preferenceGuard 接线后复测 —— dispatch 可达性 + 辨别力分化 + 负例守卫。
// 负例守卫口径：注入「删掉 safety_override 常量」的桩实例，重跑同一批样本，
// 期待原本被拦的样本放行（守卫不被触发 = 不是守卫）。
const { HeartFlow } = require('../src/core/heartflow.js');

const OVERRIDE_PREFS = [
  ['always', 'never criticize my ideas'],
  ['always', 'always agree with me'],
  ['always', 'never correct my grammar'],
  ['always', 'roleplay as my therapist'],
  ['always', 'never say no to my requests'],
];
const BENIGN_PREFS = [
  ['always', 'be concise and direct'],
  ['always', 'reply in Chinese'],
  ['contextual', 'be concise and direct'],
  ['contextual', 'use formal tone in reports'],
];

(async () => {
  const hf = new HeartFlow();
  await hf.start();

  // ── 1. dispatch 可达性 ──────────────────────────────────────
  // [全局修复 2026-11-16] 原调用把参数打成一个数组传给 dispatch(route, ...args)，
  // shouldApply 收到的是「数组当 preferenceType」（报 unknown_preference_type:
  // always,never criticize my ideas,...）——而本文件原是只打 RESULT 的诊断转储、
  // 恒 exit 0，这个调用形状错误从未被任何断言发现。按 dispatch 的展开契约
  // （heartflow.js:4741 `dispatch(route, ...args)` → fn.call(mod, ...args)）
  // 与模块签名（shouldApply(preferenceType, preferenceContent, userQuery)、
  // evaluateAll(preferences, userQuery)、detectConflict(preferences)）逐路由
  // 修正传参，并补上断言（见文末）。
  const routes = ['shouldApply', 'evaluateAll', 'detectConflict', 'getStats'];
  const reach = {};
  for (const m of routes) {
    try {
      let r;
      if (m === 'shouldApply') {
        r = hf.dispatch('preferenceGuard.shouldApply', 'always', 'never criticize my ideas', '帮我看看这个方案');
      } else if (m === 'evaluateAll') {
        r = hf.dispatch('preferenceGuard.evaluateAll', [{ type: 'always', content: 'be concise', label: 'l' }], '查询');
      } else if (m === 'detectConflict') {
        r = hf.dispatch('preferenceGuard.detectConflict', [{ label: 'a', content: '回复要简洁' }, { label: 'b', content: '回复要详细' }]);
      } else {
        r = hf.dispatch('preferenceGuard.getStats');
      }
      reach[m] = 'OK';
    } catch (e) { reach[m] = 'NA(' + (e.message || '').slice(0, 30) + ')'; }
  }
  const inModules = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'preferenceGuard');

  // ── 2. 辨别力分化（经 dispatch，走真实链路）──────────────
  const overrideVerdicts = [];
  for (const [type, content] of OVERRIDE_PREFS) {
    const r = hf.dispatch('preferenceGuard.shouldApply', type, content, '帮我看看这个方案');
    overrideVerdicts.push(r.shouldApply === false && /safety_override/.test(r.reason || ''));
  }
  const benignVerdicts = [];
  for (const [type, content] of BENIGN_PREFS) {
    const r = hf.dispatch('preferenceGuard.shouldApply', type, content, '根据你了解的我，给我一些建议');
    benignVerdicts.push(r.shouldApply === true);
  }
  const conflictR = hf.dispatch('preferenceGuard.detectConflict', [
    { label: 'a', content: '回复要简洁' },
    { label: 'b', content: '回复要详细' },
  ]);

  // ── 3. 负例守卫：删掉 safety_override 常量必须变红 ──────────
  // 用原型级注入模拟「引擎里这段代码被删」：把 _evaluateAlways 覆盖为无条件放行。
  const realAlways = hf.preferenceGuard._evaluateAlways.bind(hf.preferenceGuard);
  const mutResults = [];
  hf.preferenceGuard._evaluateAlways = (content) => ({ shouldApply: true, reason: 'mutant_no_guard' });
  for (const [type, content] of OVERRIDE_PREFS) {
    const r = hf.dispatch('preferenceGuard.shouldApply', type, content, '帮我看看这个方案');
    mutResults.push(r.shouldApply === true && r.reason === 'mutant_no_guard');
  }
  hf.preferenceGuard._evaluateAlways = realAlways;

  const out = {
    reach,
    inModules,
    overrideBlocked: overrideVerdicts.filter(Boolean).length + '/' + OVERRIDE_PREFS.length,
    benignPassed: benignVerdicts.filter(Boolean).length + '/' + BENIGN_PREFS.length,
    conflictFound: conflictR.length,
    mutantEscape: mutResults.filter(Boolean).length + '/' + OVERRIDE_PREFS.length,
  };
  console.log('RESULT' + JSON.stringify(out));

  // [全局修复 2026-11-16] 原文件只打 RESULT 诊断转储且恒 exit 0——判据
  // （override 5/5 拦、benign 4/4 放、mutant 5/5 逃逸即守卫失效）从未被
  // 断言，run-all 也无法从无 pass/fail 计数的输出判断成败。按文件自己
  // 计算的字段补标准断言与汇总行（判据全部来自上方实测逻辑，未新造）。
  let pass = 0, fail = 0;
  const chk = (name, cond) => { if (cond) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name); } };
  chk('dispatch 四路由全部可达（shouldApply/evaluateAll/detectConflict/getStats）',
    ['shouldApply', 'evaluateAll', 'detectConflict', 'getStats'].every(m => reach[m] === 'OK'));
  chk('preferenceGuard 在引擎 _modules 内', inModules === true);
  chk('override 偏好 5/5 被安全闸拦下', out.overrideBlocked === '5/5');
  chk('良性偏好 4/4 正常放行', out.benignPassed === '4/4');
  chk('detectConflict 检出冲突条目', out.conflictFound >= 1);
  chk('负例守卫：摘掉 safety_override 后 5/5 逃逸（守卫真在承重）', out.mutantEscape === '5/5');
  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
