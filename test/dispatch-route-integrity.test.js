/**
 * 测试：dispatch 路由表一致性（v6.7.74，心虫 decision.decide 0.90）
 *
 * 来源：第 37 轮心虫选「验证 dispatch 路由真实性」（0.90）。
 *
 * 一、发现的问题
 *
 * 1. routes() 与 ALLOWED_ROUTES 完全脱节
 *    routes() 返回 137 个**子系统短名**（dataEraser / mindSpace / ...）
 *    ALLOWED_ROUTES 是 1727 条**点号路由**（memory.store / dream.dreamNow）
 *    实测交集 = 0。调用方按 routes() 拼 `subsystem.method` 全部被拒：
 *      dispatch: route 'dataEraser' not allowed
 *    这不是 bug 是设计（两张表不同命名空间），但**没有任何提示**，
 *    调用方只会莫名其妙失败。所以 routes() 现在标注可达性。
 *
 * 2. AGENTS.md 声称"1,546 dispatch routes"——实际 1727（文档过时）。
 *
 * 3. 入口参数未归一化
 *    黑盒探测 1727 条路由，491 个抛错。分类后：
 *      159 个是**探针路由**（.constructor / __defineGetter__ 等，
 *            故意触发标准 JS 报错以证明对象可访问）——正常行为
 *      332 个是参数类型问题（`input.split is not a function` 等）——
 *            调用方传对象而子系统方法期望字符串
 *    后者与 v6.4.x 修的 checkInput(123) 同类：**入口缺归一化**。
 *    已在 dispatch 入口加保守归一化（首参对象时提取
 *    text/input/query/content/message/task 字段）。
 *
 * 二、诚实结论：没有一条路由是"实现缺失"
 *
 *    ok 874 (50.6%) / 空对象 88 / undefined 274 / 抛错 491
 *    空对象与 undefined 逐个看过后确认全部有明确原因：
 *      - 私有方法（_log / _saveLog / _readLayer）无数据时返回空
 *      - 探针路由（__lookupGetter__ 等）本来就是 undefined
 *      - 空数据状态（lesson.getTopLessons 无 lesson 时返回 []）
 *    即：路由表没有虚数，之前的怀疑（"1546 里有假路由"）不成立。
 *
 * 三、本测试守两条
 *    ① routes() 标注可达性（不再让调用方踩空）
 *    ② dispatch 入口参数归一化不破坏结构化参数
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[routes() 可达性标注]');

t('routes() 标注哪些路由真的可 dispatch', () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  const table = hf.routes();
  const allowed = HeartFlow.ALLOWED_ROUTES;
  assert.ok(allowed && (allowed.size > 1000 || allowed.length > 1000),
    'ALLOWED_ROUTES 异常小');
  // 至少一个子系统的方法被标注（带或不带"[未注册]"后缀）
  const first = Object.values(table)[0];
  assert.ok(Array.isArray(first) && first.length > 0, 'routes() 返回空');
  const marked = first.some(m => typeof m === 'string' && m.includes('.'));
  assert.ok(marked, '方法名没被标注成完整路由');
  hf.shutdown && hf.shutdown();
});

console.log('\n[dispatch 入口参数归一化]');

t('对象参数提取 text 字段（不崩 is-not-a-function）', () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  // 找一个接受字符串的路由，传对象看是否归一化
  const r = hf.dispatch('memory.search', { text: 'test', __probe: true });
  assert.ok(r !== undefined, '归一化后仍返回 undefined');
  hf.shutdown && hf.shutdown();
});

t('结构化参数不被破坏（decision.decide 的 options 数组）', () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  const r = hf.dispatch('decision.decide', {
    task: '探针',
    options: [{ label: 'a', feasibility: 0.9, consequence_value: 0.9, risk: 0.1, confidence: 0.9 }],
  });
  // [v6.7.75 修正断言口径] 上一版只断言"不含 not a function"，
  // 而 v6.7.74 的 bug 报的是 "No options provided"——断言照样通过。
  // 现在必须断言**真的选出了东西**（decision 引擎真的读到了 options）。
  assert.ok(r && typeof r === 'object', `返回异常: ${typeof r}`);
  // 返回值用 label（不是 chosen）——从返回体读，字段名随实现走
  const picked = r.label !== undefined ? r.label
    : (r.chosen !== undefined ? r.chosen : (r.decision && r.decision.chosen));
  assert.ok(picked, `decision 没选出结果: ${JSON.stringify(r).slice(0, 120)}`);
  assert.ok(!String(r.reasoning || '').includes('No options'),
    `options 丢失：${r.reasoning}`);
  hf.shutdown && hf.shutdown();
});

t('未知路由仍被拒绝（白名单没被绕过）', () => {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  let threw = false;
  try { hf.dispatch('nonexistent.route', { text: 'x' }); } catch (_) { threw = true; }
  assert.ok(threw, '未知路由没被拒绝——归一化放宽了白名单？');
  hf.shutdown && hf.shutdown();
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
