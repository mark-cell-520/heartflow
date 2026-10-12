#!/usr/bin/env node
/**
 * r416 负例测试：check() 必须把「返回失败值」判为 ❌
 *
 * 背景：bin/verify.js 的 check() 原先只看有没有抛异常，同步/异步分支都是
 * 无条件 push('✅')。任何返回 false / {ok:false} / null 而不 throw 的检查
 * 都会被静默标绿 —— 这是脆弱契约，现有 14 项都靠 throw 所以看不出问题。
 *
 * 本测试不 import verify.js（它是 top-level 执行的脚本），而是抽出同一份
 * isFalsyResult + check 逻辑做等价复现，逐条验证判定。
 * 复现必须与 bin/verify.js 保持一致，故用读源码 + eval 的方式取真逻辑。
 */
const fs = require('fs');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const src = fs.readFileSync(path.join(HF, 'bin/verify.js'), 'utf8');

// ── 从源码抽出 isFalsyResult（确保测的是真逻辑，不是抄一份）──
const m = src.match(/function isFalsyResult\(r\) \{[\s\S]*?\n\}/);
if (!m) {
  console.error('❌ 未在 bin/verify.js 找到 isFalsyResult —— 修复可能被回退了');
  process.exit(1);
}
const isFalsyResult = new Function(`"use strict"; ${m[0]}; return isFalsyResult;`)();

let pass = 0, fail = 0;
const T = (name, actual, expected) => {
  if (actual === expected) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}: 期望 ${expected}, 实际 ${actual}`); }
};

console.log('=== r416 check() 返回值判定负例 ===\n');

// 1. 明确的失败值必须判失败
T('false → 失败', isFalsyResult(false), true);
T('null → 失败', isFalsyResult(null), true);
T('{ok:false} → 失败', isFalsyResult({ ok: false }), true);
T('{passed:false} → 失败', isFalsyResult({ passed: false }), true);
T('{success:false} → 失败', isFalsyResult({ success: false }), true);
T('{error:...} → 失败', isFalsyResult({ error: 'boom' }), true);

// 2. 有意义的值必须判通过（不能误杀）
// [r416 实测纠正] undefined 必须算通过：verify.js 现有检查大量写成
// 「语句块 + 靠 throw 表达失败」而不返回值。第一版把 undefined 判失败，
// 结果 14 项瞬间变 1 项（1 passed / 13 failed）。
T('undefined → 通过（靠 throw 表达失败的检查无返回值）', isFalsyResult(undefined), false);
T('字符串 "v20.1.0" → 通过', isFalsyResult('v20.1.0'), false);
T('数字 0 → 通过', isFalsyResult(0), false);
T('空数组 → 通过', isFalsyResult([]), false);
T('空对象 → 通过', isFalsyResult({}), false);
T('{ok:true} → 通过', isFalsyResult({ ok: true }), false);
T('{passed:true,score:0} → 通过', isFalsyResult({ passed: true, score: 0 }), false);
T('NaN → 通过（不误杀）', isFalsyResult(NaN), false);

// 3. check() 集成：确认 hasError 会被置位
console.log('\n=== check() 集成（返回失败值必须置 hasError）===');
// 必须同时注入 isFalsyResult —— 只注入 check 会让它走 catch 分支，
// 测出来两个都记 ❌，那是测试自身的 bug 不是修复的问题。
const checkSrc = src.match(/function check\(label, fn\) \{[\s\S]*?\n\}/)[0];
const falsySrc = src.match(/function isFalsyResult\(r\) \{[\s\S]*?\n\}/)[0];
const sandbox = new Function(`"use strict";
  const RESULTS = [];
  let hasError = false;
  ${falsySrc}
  ${checkSrc}
  return { check, RESULTS, isErr: () => hasError };
`)();

sandbox.check('返回 false 的检查', () => false);
T('check(()=>false) 记 ❌', sandbox.RESULTS[0].includes('❌'), true);
T('check(()=>false) 置 hasError', sandbox.isErr(), true);

sandbox.check('返回 {ok:false} 的检查', () => ({ ok: false }));
T('check(()=>({ok:false})) 记 ❌', sandbox.RESULTS[1].includes('❌'), true);

sandbox.check('返回正常值的检查', () => 'v20.1.0');
T('check(()=>"v20.1.0") 记 ✅', sandbox.RESULTS[2].includes('✅'), true);

sandbox.check('抛异常的检查', () => { throw new Error('boom'); });
T('check(throw) 记 ❌', sandbox.RESULTS[3].includes('❌'), true);

// 4. 异步分支（必须等微任务，.then 不会同步写 RESULTS）
console.log('\n=== 异步分支 ===');
(async () => {
  const p1 = sandbox.check('async resolve(false)', () => Promise.resolve(false));
  const p2 = sandbox.check('async resolve("ok")', () => Promise.resolve('ok'));
  // 必须先 await 再读 RESULTS —— .then 是微任务，同步读会拿到 undefined
  await Promise.all([p1, p2]);
  T('async resolve(false) 记 ❌', sandbox.RESULTS[4] && sandbox.RESULTS[4].includes('❌'), true);
  T('async resolve("ok") 记 ✅', sandbox.RESULTS[5] && sandbox.RESULTS[5].includes('✅'), true);

  // 5. 回归：verify.js 自身仍全绿（不能因为改严而误杀现有 14 项）
  console.log('\n=== 回归：bin/verify.js 仍 14/14 ===');
  const { execSync } = require('child_process');
  const out = execSync('node bin/verify.js', { cwd: HF, encoding: 'utf8', timeout: 240000 });
  const pm = out.match(/(\d+) passed/), fm = out.match(/(\d+) failed/);
  T('passed = 14', pm ? +pm[1] : 0, 14);
  T('failed = 0', fm ? +fm[1] : 0, 0);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})();
