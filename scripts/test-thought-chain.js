/**
 * 思维链测试脚本
 * 验证所有引擎是否正确串联
 */

const { HeartFlow, createHeartFlow } = require('../src/core/heartflow.js');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const hf = createHeartFlow({ rootPath });

async function runTests() {
  console.log('🚀 启动 HeartFlow...');
  hf.start();

  console.log('\n📋 Health Check:');
  const health = await hf.healthCheck();
  console.log(`  版本: ${health.version}`);
  console.log(`  模块数: ${health.subsystems.loaded}`);
  console.log(`  思维链: ${hf.thoughtChain ? '✅ 已初始化' : '❌ 未初始化'}`);

  // ── 测试1: 基础思维链 ──────────────────────────────────────────────
  console.log('\n\n🧠 测试1: 基础思维链 (think)');
  console.log('─'.repeat(60));

  const result1 = await hf.think('我最近总是失眠，感觉压力很大');
  console.log(hf.thoughtChain.getSummary(result1));

  console.log('\n📌 意图:', result1.intent?.category);
  console.log('📌 情绪:', result1.emotion?.emotion?.emotionZh);
  console.log('📌 危机:', result1.emotion?.crisis?.level);

  // ── 测试2: 深度思维链 ──────────────────────────────────────────────
  console.log('\n\n🧠 测试2: 深度思维链 (thinkDeep)');
  console.log('─'.repeat(60));

  const result2 = await hf.thinkDeep('如何提高学习效率？');
  console.log(hf.thoughtChain.getSummary(result2));

  console.log('\n📌 意图:', result2.intent?.category);
  console.log('📌 推理链:', result2.decision.reasoningChain.length, '步');
  console.log('📌 置信度:', (result2.decision.confidence * 100).toFixed(0) + '%');

  // ── 测试3: 快速思维链 ──────────────────────────────────────────────
  console.log('\n\n⚡ 测试3: 快速思维链 (thinkFast)');
  console.log('─'.repeat(60));

  const result3 = await hf.thinkFast('今天天气不错');
  console.log(hf.thoughtChain.getSummary(result3));

  // ── 测试4: 验证各阶段是否正确执行 ─────────────────────────────────
  console.log('\n\n🔍 测试4: 阶段执行详情');
  console.log('─'.repeat(60));

  for (const stage of result1.chain.stages) {
    const status = stage.skipped ? '⏭️ 跳过' : (stage.success ? '✅' : '❌');
    const name = stage.name.padEnd(12);
    const duration = stage.duration ? `${stage.duration}ms`.padStart(8) : '';
    console.log(`  ${status} ${name} ${duration}`);
  }

  // ── 测试5: dispatch 路由测试 ──────────────────────────────────────
  console.log('\n\n🔗 测试5: dispatch 路由调用');
  console.log('─'.repeat(60));

  try {
    const routeResult = await hf.dispatch('thoughtChain.thinkFast', '你好');
    console.log('  thinkFast via dispatch: ✅');
    console.log('  shouldRespond:', routeResult.decision.shouldRespond);
  } catch (e) {
    console.log('  thinkFast via dispatch: ❌', e.message);
  }

  console.log('\n\n✨ 测试完成');
  hf.stop();
  process.exit(0);
}

runTests().catch(e => {
  console.error('测试失败:', e);
  hf.stop();
  process.exit(1);
});
