#!/usr/bin/env node

/**
 * MarkCode 快速测试
 */

const { MarkCode } = require('../src/agent-core/heart-agent');

async function test() {
  console.log('=== MarkCode 测试 ===\n');

  // 检查 API 密钥
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('警告: 未设置 API 密钥');
    console.log('请设置: export ANTHROPIC_API_KEY=sk-ant-xxxxx\n');
  }

  // 创建 Agent
  console.log('1. 创建 Agent...');
  const agent = new MarkCode({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
    apiType: process.env.API_TYPE || 'anthropic',
    model: process.env.MODEL || 'claude-sonnet-4-20250514'
  });

  // 初始化
  console.log('2. 初始化...');
  await agent.initialize();
  console.log('   ✓ Agent 已初始化\n');

  // 健康检查
  console.log('3. 健康检查...');
  const health = await agent.healthCheck();
  console.log('   版本:', health.api?.model || 'N/A');
  console.log('   工具数:', health.toolCount);
  console.log('   内存状态:', health.memory?.shortTermCount || 0, '短期记忆');
  console.log('   ✓ 健康检查完成\n');

  // 测试工具
  console.log('4. 测试内置工具...');

  // 测试 bash
  console.log('   测试 bash 工具...');
  const bashResult = await agent.toolRegistry.execute('bash', { command: 'echo "hello"' });
  if (bashResult.success) {
    console.log('   ✓ bash 工具正常:', bashResult.stdout.trim());
  } else {
    console.log('   ✗ bash 工具失败:', bashResult.error);
  }

  // 测试 read
  console.log('   测试 read 工具...');
  const readResult = await agent.toolRegistry.execute('read', { path: __filename });
  if (readResult.success) {
    console.log('   ✓ read 工具正常:', readResult.lines, '行');
  } else {
    console.log('   ✗ read 工具失败:', readResult.error);
  }

  // 测试 write
  console.log('   测试 write 工具...');
  const writeResult = await agent.toolRegistry.execute('write', {
    path: '/tmp/heart-agent-test.txt',
    content: 'MarkCode test file\n'
  });
  if (writeResult.success) {
    console.log('   ✓ write 工具正常');
  } else {
    console.log('   ✗ write 工具失败:', writeResult.error);
  }

  // 测试 glob
  console.log('   测试 glob 工具...');
  const globResult = await agent.toolRegistry.execute('glob', {
    pattern: '*.js',
    cwd: __dirname
  });
  if (globResult.success) {
    console.log('   ✓ glob 工具正常:', globResult.files?.length || 0, '文件');
  } else {
    console.log('   ✗ glob 工具失败:', globResult.error);
  }

  // 测试状态
  console.log('\n5. Agent 状态...');
  const status = agent.getStatus();
  console.log('   会话ID:', status.sessionId);
  console.log('   消息数:', status.messageCount);
  console.log('   工具数:', status.toolCount);

  // 清理测试文件
  try {
    require('fs').unlinkSync('/tmp/heart-agent-test.txt');
  } catch (e) {}

  // 停止
  console.log('\n6. 停止 Agent...');
  await agent.stop();
  console.log('   ✓ 已停止');

  console.log('\n=== 测试完成 ===');
}

test().catch(error => {
  console.error('测试失败:', error.message);
  process.exit(1);
});
