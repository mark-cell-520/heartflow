/**
 * 测试：HANDLERS 无重复定义 + 空壳检测（v6.7.73，心虫 decision.decide 0.90）
 *
 * 来源：第 36 轮心虫选「逐个黑盒验证 59 个 MCP 工具的真实可达性」。
 *
 * 一、第一轮探测的假阳性（我的分类器有 bug）
 *
 * 写了个脚本遍历 tools/list 再逐个 tools/call，报告"59/59 全部 OK"。
 * 但抽查真实业务调用时发现 6 个工具返回空 text——
 * **分类逻辑把空响应当成了 OK**（`verdict = 'OK' if txt else 'EMPTY'`
 * 写反了判断条件，且没看 isError 之外的结构）。
 *
 * 两个工具报 -32601 Method not found，一度以为是"注册表与 handler 不同步"。
 * 核对真实 tools/list 后确认：**那是我凭 AGENTS.md 文档编的工具名**
 * （heartflow_check_input / check_output），实际叫 gate / gate_check。
 * 即又是"我的测试工具有 bug"——本轮第二次。
 *
 * 二、真 bug：7 个重复定义，空壳实现覆盖了好实现
 *
 * 对象字面量**后定义的键覆盖前面的**。实际情况：
 *   3xxx 行  正确的命名 handler（handleMemoryConsolidateTool 等，
 *            走 safeDispatch 用常驻引擎实例）
 *   4xxx 行  批量化生成的空壳（`new Xxx({silent})` 造完不用，
 *            `const r = {}` 直接返回空对象）
 *   后者覆盖前者 → 7 个工具全部失效但表面正常
 *
 * 症状各不相同，取决于调用方怎么判空：
 *   decision_decide  → {"error":"decision.decide not available"} 且 isError:false
 *                      （错误被包装成"成功"，调用方以为拿到了结果）
 *   formula_search   → {"error":"keyword required"}（空壳的参数校验）
 *   memory_consolidate → 直接返回 {}
 *
 * 这与第 35 轮的 admin 死代码是同一家族：**功能在、代码可达、单测全绿，
 * 但被中间某个东西覆盖/断掉**。
 *
 * 三、本测试守两条
 *   ① HANDLERS 里不允许重复定义同名键（覆盖是静默的，编译器不报错）
 *   ② 首选的 handleXxx 实现必须真的排在最后（或至少不被空壳覆盖）
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const srv = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
const hStart = srv.indexOf('const HANDLERS');
assert.ok(hStart > 0, '找不到 HANDLERS 定义');
const hEnd = srv.indexOf('\n};', hStart);
const hb = srv.slice(hStart, hEnd);

console.log('\n[HANDLERS 键唯一性]');

const keys = [];
for (const m of hb.matchAll(/^\s{2}(heartflow_[a-z0-9_]+):/gm)) keys.push(m[1]);

t(`HANDLERS 键无重复（当前 ${keys.length} 个键）`, () => {
  const seen = new Set(), dup = [];
  for (const k of keys) {
    if (seen.has(k)) dup.push(k);
    seen.add(k);
  }
  assert.strictEqual(dup.length, 0,
    `重复定义 ${dup.length} 个: ${dup.join(', ')}。` +
    `对象字面量后者覆盖前者——静默失效，node --check 查不出。`);
});

t('决策工具只定义一次', () => {
  const n = (srv.match(/heartflow_decision_decide\s*:/g) || []).length;
  assert.strictEqual(n, 1, `heartflow_decision_decide 定义了 ${n} 次`);
});

console.log('\n[空壳 handler 检测]');

/** 空壳特征：函数体里 `const r = {}` 或 `return { error:` 之外没有任何真实调用 */
function isStub(body) {
  // 有 require + new + 方法调用 = 真实现
  const hasRealCall = /inst\.\w+\s*\(/.test(body) || /safeDispatch\s*\(/.test(body)
    || /handle\w+\s*\(/.test(body) || /\.map\(|\.filter\(|\.forEach\(/.test(body);
  // 纯 `const r = {}` 后直接 return = 空壳
  const isPureStub = /const\s+r\s*=\s*\{\s*\}\s*;/.test(body) && !hasRealCall;
  return isPureStub;
}

const stubs = [];
const keyRe = /^\s{2}(heartflow_[a-z0-9_]+):\s*\(args\)\s*=>\s*\{/gm;
let m;
while ((m = keyRe.exec(hb)) !== null) {
  // 提取函数体
  const braceStart = hb.indexOf('{', m.index);
  let depth = 0, end = -1;
  for (let j = braceStart; j < hb.length; j++) {
    if (hb[j] === '{') depth++;
    else if (hb[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) continue;
  const body = hb.slice(braceStart, end);
  if (isStub(body)) stubs.push(m[1]);
}

t('无 `const r = {}` 空壳 handler', () => {
  assert.strictEqual(stubs.length, 0,
    `空壳 handler: ${stubs.join(', ')}。这些造了实例不用、直接返回空对象。`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
