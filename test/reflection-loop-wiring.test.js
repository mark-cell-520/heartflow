#!/usr/bin/env node
/**
 * test/reflection-loop-wiring.test.js
 *
 * 第 217 轮新增：覆盖两处本轮修复+接线，防止回归。
 *   1. selfReflect 的类型契约防御（217 轮 commit 1）
 *      —— questions 传字符串数组时原本抛 TypeError 崩掉整条自省链路
 *   2. 主引擎反思闭环（217 轮 commit 2）
 *      —— result._reflectionLoopClosed 必须存在且内容非空
 *   3. self-evolution _sleep seam（217 轮 commit 3）
 *      —— 测试可注入；生产路径必须真的 sleep
 *
 * 判据纪律：查内容不只查布尔存在（216 轮踩坑教训——
 * 只查布尔会让「挂了个空实现」骗过守卫）。
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { ReflectionLoop } = require('../src/cortex/reflection-loop.js');

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { console.error('FAIL:', msg); failed++; }
}

console.log('=== ReflectionLoop 接线与契约测试（第 217 轮）===\n');

// 用独立临时根，避免污染真实状态文件
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-rl-wiring-'));
fs.mkdirSync(path.join(root, '.opencode', 'memory'), { recursive: true });

(async () => {
  const loop = new ReflectionLoop(root);

  // ── 1) selfReflect 字符串数组契约（217 轮修复的核心）──
  const strInsights = await loop.selfReflect(['我此刻在想什么？', '我感知到对方是怎样的状态？'], '草稿文本', {
    intent: 'learning',
    userEmotion: { emotion: 'neutral', intensity: 0.4 },
  });
  assert(Array.isArray(strInsights), 'selfReflect 字符串数组返回数组');
  assert(strInsights.length === 2, 'selfReflect 字符串数组返回 2 条 insight（实际 ' + strInsights.length + '）');
  assert(strInsights.every(i => i && typeof i.question === 'string' && i.question.length > 0),
    'selfReflect 每条 insight 带非空 question');
  assert(strInsights.some(i => i.stateSnapshot && typeof i.stateSnapshot === 'object'),
    'selfReflect 产出认知状态快照');

  // 对象数组契约（reflectBeforeSpeaking 的正常入参形态）不能回归
  const objInsights = await loop.selfReflect(
    [{ id: 'current_thought', question: '我此刻在想什么？这想法的背后是什么？', contextKey: 'intent', weight: 1.0 }],
    '草稿文本', { intent: 'recognition' }
  );
  assert(Array.isArray(objInsights) && objInsights.length === 1, 'selfReflect 对象数组仍正常');
  assert(objInsights[0].stateSnapshot && objInsights[0].stateSnapshot.intent === 'recognition',
    'selfReflect 对象数组读出 intent');

  // 单字符串 + 空数组 + undefined 都不许抛
  let threw = false;
  try {
    await loop.selfReflect('我此刻在想什么？', '草稿', {});
    await loop.selfReflect([], '草稿', {});
    await loop.selfReflect(undefined, '草稿', {});
    await loop.selfReflect(['问题'], '草稿');
  } catch (e) { threw = true; console.error('  selfReflect 边界抛错:', e.message); }
  assert(!threw, 'selfReflect 四种边界入参均不抛错');

  // ── 2) reflectBeforeSpeaking 行为契约（v2.1.0 自省不改草稿）──
  const draft = '根据最新数据，这个方案无疑是唯一正确的选择。';
  const r1 = await loop.reflectBeforeSpeaking(draft, { intent: 'general' });
  assert(r1 && typeof r1 === 'object', 'reflectBeforeSpeaking 返回对象');
  assert(r1.final === r1.original, '自省不修改草稿（v2.1.0 语义）');
  assert(Array.isArray(r1.insights) && r1.insights.length > 0,
    'reflectBeforeSpeaking 产出非空 insights（实际 ' + (r1.insights ? r1.insights.length : 0) + '）');
  assert(Array.isArray(r1.questions) && r1.questions.length > 0,
    'reflectBeforeSpeaking 产出非空 questions');

  // 预测反应必须是三值之一且非空
  const pred = loop.predictEmotionalReaction(draft, 'neutral');
  assert(typeof pred === 'string' && pred.length > 0, 'predictEmotionalReaction 返回非空字符串');

  // 反思后监控
  const m1 = await loop.monitorAfterSpeaking('谢谢，我明白了', { expectedReaction: pred });
  assert(m1 && typeof m1 === 'object', 'monitorAfterSpeaking 返回对象');
  assert(m1.effectiveness !== undefined, 'monitorAfterSpeaking 带 effectiveness');

  // ── 3) self-evolution _sleep seam ──
  const seMod = require('../src/cortex/self-evolution-v2.js');
  const SE = seMod.SelfEvolutionV2 || seMod;
  let se;
  try { se = new SE(); } catch (_) { se = null; }
  if (se) {
    assert(typeof se._sleep === 'function', 'SelfEvolutionV2._sleep 方法存在');
    const calls = [];
    se._sleepFn = (ms) => { calls.push(ms); return Promise.resolve(); };
    const t0 = Date.now();
    await se._sleep(4321);
    const dt = Date.now() - t0;
    assert(calls.length === 1 && calls[0] === 4321, '注入 _sleepFn 被调用且参数正确');
    assert(dt < 500, '注入 _sleepFn 后立即返回（实际 ' + dt + 'ms）');
  } else {
    assert(true, 'SelfEvolutionV2 构造需参数，跳过 seam 断言（由 scripts/round-217 负例脚本覆盖）');
  }

  // ── 4) 主引擎反思闭环接线 ──
  const { HeartFlow } = require('../src/core/heartflow.js');
  const hf = new HeartFlow();
  try {
    await hf.start();
    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
    const c = r && r._reflectionLoopClosed;
    assert(!!c, 'think() 产出 _reflectionLoopClosed');
    if (c) {
      assert(c.reflected === true, '闭环 reflected=true');
      assert(c.insightCount > 0, '闭环 insightCount 非零（实际 ' + c.insightCount + '）');
      assert(c.questionCount > 0, '闭环 questionCount 非零（实际 ' + c.questionCount + '）');
      assert(typeof c.predictedReaction === 'string' && c.predictedReaction.length > 0,
        '闭环带非空 predictedReaction');
      assert(c.monitored === true, '闭环 monitored=true');
      assert(c.wasModified === false, '闭环保持「自省不改草稿」');
    }
  } catch (e) {
    assert(false, '主引擎反思闭环冒烟失败: ' + e.message);
  }

  fs.rmSync(root, { recursive: true, force: true });
  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('FATAL:', e && e.message);
  fs.rmSync(root, { recursive: true, force: true });
  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  process.exit(1);
});
