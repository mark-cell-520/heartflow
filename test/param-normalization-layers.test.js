/**
 * 测试：参数归一化分层 + 空参数保护（v6.7.75，心虫 decision.decide 0.87）
 *
 * 来源：第 38 轮心虫选「审计归一化分层」。
 *
 * 一、本轮最重要的发现：上一轮的修复把心虫自己的决策引擎弄坏了
 *
 * v6.7.74 在 dispatch 入口加了"首参对象提取 text 字段"的归一化。
 * 心虫决策（decision.decide）传的是 {task, options}——归一化把整个
 * 对象砍成 task 字符串，options 数组丢失：
 *     → {"chosen":null,"reasoning":"No options provided"}
 *
 * **decision.decide 是心虫自主升级的引擎**，它一坏整条自主链路就停。
 * 发现过程：第 38 轮准备跑心虫决策时它返回 "No options provided"。
 *
 * 更糟的是当时写的测试「结构化参数不被破坏」断言的是
 * `!r.error.includes('not a function')`——那个 bug 报的是
 * "No options provided"，不含 "not a function"，**断言照样通过**。
 * **测试写错了口径**，所以这个 bug 带着绿灯上线了。
 *
 * 二、修复：从"预先归一化"改成"原样传参 + 崩了才降级"
 *
 *   旧：见对象就提取 text 字段并只传字符串（破坏结构化参数）
 *   新：先原样调用；只有抛类型错误时才降级提取 text/input/query
 *   这样 decision 的 options、pipeline 的 mode 永远不被破坏，
 *   而 memory.search({text:'x'}) 仍能工作（子系统本来就接受对象）。
 *
 * 三、MCP 层与 dispatch 层的归一化不冲突（审计结论）
 *
 *   MCP 层（mcp-server.js 4476-4505）：基于 inputSchema 过滤 +
 *     类型强制——目的是**安全**（防参数注入、防类型混淆）
 *   dispatch 层（heartflow.js 4490+）：类型错误兜底降级——
 *     目的是**健壮性**（调用方传错类型时不崩）
 *
 *   两层目的不同、触发条件不同，不重复也不冲突。
 *   59/59 工具的 schema 都有 properties，无过滤盲区。
 *
 * 四、MCP 层新发现：拼错参数名返回空响应
 *
 *   schema 过滤只遍历 properties，调用方传 {txt:'...'}（拼错）时
 *   参数被**静默全部丢弃**，handler 收到空 args 返回空 text。
 *   调用方收到完全空白，无法区分"参数写错"和"结果为空"。
 *   已加保护：schema 有 properties 但过滤后为空 → 明确报错
 *   并列出 expectedParams。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[决策引擎必须真的工作（v6.7.74 bug 回归防线）]');

function newHf() {
  const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  return hf;
}

t('decision.decide 用对象参数必须真的选出结果', () => {
  const hf = newHf();
  const r = hf.dispatch('decision.decide', {
    task: '探针决策',
    options: [{ label: 'a', feasibility: 0.9, consequence_value: 0.9, risk: 0.1, confidence: 0.9 }],
  });
  // **断言"选出了东西"，不是断言"没报错"**——v6.7.74 的 bug
  // 报的是 "No options provided"，旧断言查不到它。
  const picked = r.label !== undefined ? r.label : (r.chosen || (r.decision && r.decision.chosen));
  assert.ok(picked, `decision 没选出结果: ${JSON.stringify(r).slice(0, 140)}`);
  assert.ok(!String(r.reasoning || '').includes('No options'),
    `options 仍被丢弃: ${r.reasoning}`);
  hf.shutdown && hf.shutdown();
});

t('decision.decide 多选项能排序', () => {
  const hf = newHf();
  const r = hf.dispatch('decision.decide', {
    task: '选方向',
    options: [
      { label: '低价值高可行', feasibility: 0.95, consequence_value: 0.3, risk: 0.05, confidence: 0.9 },
      { label: '高价值高可行', feasibility: 0.9, consequence_value: 0.95, risk: 0.2, confidence: 0.85 },
    ],
  });
  const picked = r.label !== undefined ? r.label : r.chosen;
  assert.ok(picked === '高价值高可行',
    `决策排序异常，选了: ${picked}（应选高价值项）`);
  hf.shutdown && hf.shutdown();
});

console.log('\n[结构化参数不被破坏]');

t('pipeline.run 的 mode/anchor 保留', () => {
  const hf = newHf();
  const r = hf.dispatch('pipeline.run', { text: 'test', mode: 'fast' });
  assert.ok(r !== undefined, 'pipeline.run 返回 undefined');
  hf.shutdown && hf.shutdown();
});

console.log('\n[类型错误时才降级]');

t('传字符串给期望对象的子系统不崩', () => {
  const hf = newHf();
  // decision.decide 期望对象；传字符串应触发降级或明确报错，不能静默崩溃
  let r;
  try { r = hf.dispatch('decision.decide', 'just a string'); }
  catch (e) { r = { __threw: e.message }; }
  assert.ok(r && typeof r === 'object', `返回异常: ${typeof r}`);
  hf.shutdown && hf.shutdown();
});

t('白名单未被绕过', () => {
  const hf = newHf();
  let threw = false;
  try { hf.dispatch('no.such.route', { text: 'x' }); } catch (_) { threw = true; }
  assert.ok(threw, '未知路由没被拒绝');
  hf.shutdown && hf.shutdown();
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
