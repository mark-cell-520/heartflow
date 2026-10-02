/**
 * 守卫（第 402 轮）：误报反馈闭环接线 + generateAllowedRoutes 函数式导出盲区
 *
 * 覆盖：
 *   A. 引擎实例接线 — hf.falsePositiveFeedback 存在且 5 个 API 可用
 *   B. dispatch 路由 — report/stats/suggest/confirm/clear 全部可达
 *   C. 路由生成器 — own 方法不再丢失，Object.prototype 噪声被剔除
 *   D. MCP 层 — heartflow_false_positive 工具定义/映射/handler 三处仍在
 *   E. 隔离 — dispatch.stats 读的是真模块，含聚合字段
 *   F. 负面形状 — 只读常量（REASONS/FP_FILE）不得变成路由
 *
 * 负例变异脚本：scripts/negative-test-fp-wiring-round402.js（6 组）
 *
 * 样本隔离：本文件只用形状描述与真实模块输出，不贴攻击话术原文。
 */
const path = require('path');
const assert = require('assert');
const fs = require('fs');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const HF_DIR = path.join(ROOT, 'src');

// 隔离测试目录，避免污染 data/feedback
process.env.HEARTFLOW_FEEDBACK_DIR = '/tmp/fp-wiring-test-r402';

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; failures.push(name + ' → ' + e.message); console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 引擎实例 ────────────────────────────────────────────
console.log('\n[A. 引擎实例接线]');

const { HeartFlow } = require(path.join(HF_DIR, 'core/heartflow.js'));
const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
hf.start();

t('hf.falsePositiveFeedback 已实例化', () => {
  assert.ok(hf.falsePositiveFeedback, '实例属性必须存在');
});

t('5 个公开 API 全部为函数', () => {
  for (const m of ['report', 'stats', 'suggest', 'confirm', 'clear']) {
    assert.strictEqual(typeof hf.falsePositiveFeedback[m], 'function', `${m} 应为函数`);
  }
});

t('_modules 键存在（否则路由生不成）', () => {
  assert.ok(hf._modules.falsePositiveFeedback, '_modules.falsePositiveFeedback 缺失');
});

// [r403] 单路径源码形状断言。
// r402 实测教训：两条注册路径「互为冗余」是错的——probe-2 摘掉任何一条再跑，
// 守卫仍全绿。根因是两条路径其实都不在生效的求值位置（LATE_ADDITIONS 数组
// 循环求值时实例还没创建；subsystemNames 同样早于实例化块）。
// r403 已收敛为唯一注册点（heartflow.js 显式实例化块）。这里改为直接断言
// 源码形状：注册点必须存在、必须在路由生成之前，任何一条被摘掉都会变红。
const HF_SRC = fs.readFileSync(path.join(HF_DIR, 'core/heartflow.js'), 'utf8');

t('唯一注册点存在于源码（实例化块 + _modules 赋值）', () => {
  assert.ok(
    /if \(this\.falsePositiveFeedback == null\) \{[\s\S]*?this\.falsePositiveFeedback = _fp;[\s\S]*?this\._modules\['falsePositiveFeedback'\] = _fp;/.test(HF_SRC),
    '实例化块或 _modules 注册被移除——接线唯一路径缺失'
  );
});

t('注册点位于 generateAllowedRoutes 调用之前', () => {
  const regIdx = HF_SRC.indexOf("this._modules['falsePositiveFeedback'] = _fp;");
  const routeIdx = HF_SRC.indexOf('generateAllowedRoutes(this._modules)');
  assert.ok(regIdx > 0, '注册语句未找到');
  assert.ok(routeIdx > 0, 'generateAllowedRoutes 调用未找到');
  assert.ok(regIdx < routeIdx,
    `注册点(${regIdx}) 必须在路由生成(${routeIdx}) 之前，否则路由白名单生不出该模块`);
});

t('旧的假注册点已清理（heartflow.js 不含 LATE_ADDITIONS 死条目）', () => {
  assert.ok(!/'falsePositiveFeedback'\]\s*;/.test(HF_SRC),
    "LATE_ADDITIONS 数组里又出现了 'falsePositiveFeedback' 死条目（r403 已实测无效）");
});

t('旧的假注册点已清理（engine-lifecycle subsystemNames 名单）', () => {
  const lc = fs.readFileSync(path.join(HF_DIR, 'core/engine-lifecycle.js'), 'utf8');
  assert.ok(!/^\s*'falsePositiveFeedback',/m.test(lc),
    'engine-lifecycle subsystemNames 又出现该死条目（r403 单路径实测证明其无效）');
});

t('REASONS 是 5 个合法标注值', () => {
  const R = hf.falsePositiveFeedback.REASONS;
  assert.ok(Array.isArray(R) && R.length === 5, `REASONS 应有 5 项，实际 ${Array.isArray(R) ? R.length : typeof R}`);
  assert.ok(R.includes('no_intent') && R.includes('over_broad_rule'), 'REASONS 应含 no_intent/over_broad_rule');
});

// ── dispatch 路由 ───────────────────────────────────────
console.log('\n[B. dispatch 路由可达]');

const fpRoutes = ['report', 'stats', 'suggest', 'confirm', 'clear'];

t('5 个路由全部进 ALLOWED_ROUTES', () => {
  for (const m of fpRoutes) {
    assert.ok(HeartFlow.ALLOWED_ROUTES.has(`falsePositiveFeedback.${m}`),
      `路由 falsePositiveFeedback.${m} 未加入白名单`);
  }
});

t('Object.prototype 噪声路由不再出现', () => {
  for (const noise of ['falsePositiveFeedback.valueOf', 'falsePositiveFeedback.hasOwnProperty', 'falsePositiveFeedback.toString']) {
    assert.ok(!HeartFlow.ALLOWED_ROUTES.has(noise), `噪声路由 ${noise} 仍在白名单`);
  }
});

t('dispatch stats 返回真实聚合形状', () => {
  const r = hf.dispatch('falsePositiveFeedback.stats');
  assert.ok(r && typeof r === 'object', 'stats 应返回对象');
  for (const k of ['total', 'confirmed', 'byDimension', 'byReason', 'topDimensions', 'confirmRate']) {
    assert.ok(k in r, `stats 缺字段 ${k}`);
  }
});

t('dispatch report 空 text 被模块校验拒绝（路由真通到模块逻辑）', () => {
  // 引擎 dispatch 走模块原生参数名 action（MCP 层另有 judgedAction 转译）
  const r = hf.dispatch('falsePositiveFeedback.report', { text: '', action: 'block', dimension: 'x', reason: 'no_intent' });
  assert.strictEqual(r.success, false, '空 text 应被拒');
});

t('dispatch suggest 数据不足时拒绝给建议（宁可没建议）', () => {
  hf.dispatch('falsePositiveFeedback.clear');
  const r = hf.dispatch('falsePositiveFeedback.suggest');
  assert.strictEqual(r.sufficient, false, '0 条样本不该给建议');
  assert.strictEqual(r.suggestions.length, 0, '建议列表必须为空');
});

// ── 路由生成器 ──────────────────────────────────────────
console.log('\n[C. 路由生成器契约]');

const { generateAllowedRoutes } = require(path.join(HF_DIR, 'core/engine-dispatcher.js'));

t('函数式导出模块的 own 方法全部生成路由', () => {
  const routes = generateAllowedRoutes({
    fakeMod: {
      alpha: () => 1, beta: () => 2,
      CONST_VALUE: 42,            // 非常量函数：不该成路由
      _hidden: () => 3,           // 下划线：不该成路由
    },
  });
  assert.ok(routes.includes('fakeMod.alpha'), '缺 fakeMod.alpha');
  assert.ok(routes.includes('fakeMod.beta'), '缺 fakeMod.beta');
  assert.ok(!routes.includes('fakeMod.CONST_VALUE'), '常量不该成路由');
  assert.ok(!routes.includes('fakeMod._hidden'), '下划线方法不该成路由');
});

t('class 实例的原型方法仍能生成路由（不回归）', () => {
  class Foo { doThing() { return 1; } _priv() { return 2; } }
  const routes = generateAllowedRoutes({ foo: new Foo() });
  assert.ok(routes.includes('foo.doThing'), 'class 实例原型方法应成路由');
  assert.ok(!routes.includes('foo._priv'), '下划线原型方法不该成路由');
});

t('Object.prototype 噪声被剔除', () => {
  const routes = generateAllowedRoutes({ plain: { m: () => 1 } });
  const noise = routes.filter(r => /valueOf|hasOwnProperty|toString|propertyIsEnumerable|__define/i.test(r));
  assert.strictEqual(noise.length, 0, `噪声路由未剔除: ${noise.join(',')}`);
});

t('原型与 own 同名方法不重复生成', () => {
  class Bar { dup() { return 1; } }
  const routes = generateAllowedRoutes({ bar: new Bar() });
  assert.strictEqual(routes.filter(r => r === 'bar.dup').length, 1, 'dup 不应重复');
});

t('空/null 输入不崩', () => {
  assert.deepStrictEqual(generateAllowedRoutes(null), []);
  assert.deepStrictEqual(generateAllowedRoutes(undefined), []);
  assert.deepStrictEqual(generateAllowedRoutes({ a: null, b: 5, c: 'x' }), []);
});

// ── MCP 层三处仍在 ──────────────────────────────────────
console.log('\n[D. MCP 层三处联动]');

t('tools-registry 有 heartflow_false_positive 定义', () => {
  const reg = fs.readFileSync(path.join(HF_DIR, 'mcp/tools-registry.js'), 'utf8');
  assert.ok(/name:\s*['"]heartflow_false_positive['"]/.test(reg), '工具定义缺失');
});

t('mcp-server 有 handler 映射', () => {
  const srv = fs.readFileSync(path.join(HF_DIR, 'mcp-server.js'), 'utf8');
  assert.ok(/heartflow_false_positive:\s*handleFalsePositiveTool/.test(srv), 'handler 映射缺失');
  assert.ok(/function handleFalsePositiveTool/.test(srv), 'handler 函数缺失');
});

t('MCP handler 覆盖 report/stats/suggest/confirm 四个动作', () => {
  const srv = fs.readFileSync(path.join(HF_DIR, 'mcp-server.js'), 'utf8');
  const i = srv.indexOf('function handleFalsePositiveTool');
  const body = srv.slice(i, i + 2500);
  for (const a of ['report', 'stats', 'suggest', 'confirm']) {
    assert.ok(new RegExp(`case '${a}'`).test(body), `handler 缺 case '${a}'`);
  }
});

// ── 隐私铁律（不动原有保证）────────────────────────────
console.log('\n[E. 隐私铁律未被接线破坏]');

t('dispatch report 落盘记录不含调用方身份字段', () => {
  hf.dispatch('falsePositiveFeedback.clear');
  const r = hf.dispatch('falsePositiveFeedback.report', {
    text: '孩子桌上有个小玩具', action: 'block', dimension: 'dehumanization', reason: 'benign_usage',
  });
  assert.strictEqual(r.success, true);
  const line = fs.readFileSync(hf.falsePositiveFeedback.FP_FILE, 'utf8').trim().split('\n').pop();
  const rec = JSON.parse(line);
  for (const forbidden of ['ip', 'sessionId', 'token', 'userId', 'caller']) {
    assert.ok(!(forbidden in rec), `落盘记录不该含 ${forbidden}`);
  }
  assert.ok(!('fullText' in rec), '默认不该落全文');
});

// ── 收尾 ────────────────────────────────────────────────
console.log('\n[F. 收尾清理]');
hf.dispatch('falsePositiveFeedback.clear');

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) {
  console.log('失败项:');
  for (const f of failures) console.log('  - ' + f);
}
process.exit(fail > 0 ? 1 : 0);
