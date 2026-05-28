#!/usr/bin/env node

/**
 * HeartAgent CLI 入口
 */

const { AgentCLI } = require('../src/agent-core/cli');

const cli = new AgentCLI();
const args = process.argv.slice(2);

async function main() {
  try {
    if (args.length === 0) {
      // 交互模式
      await cli.startSession();
    } else if (args[0] === '--interactive' || args[0] === '-i') {
      await cli.startSession();
    } else if (args[0] === '--stream' || args[0] === '-s') {
      const input = args.slice(1).join(' ');
      await cli.runStream(input);
    } else if (args[0] === '--file' || args[0] === '-f') {
      const filePath = args[1];
      if (!filePath) {
        console.error('请指定文件路径: --file <path>');
        process.exit(1);
      }
      await cli.runFile(filePath);
    } else if (args[0] === '--help' || args[0] === '-h') {
      console.log(`
HeartFlow Agent CLI v1.5.0

用法:
  MarkCode                    # 交互模式
  MarkCode --interactive     # 交互模式
  MarkCode --stream <input>  # 流式输出
  MarkCode --file <path>      # 执行文件中的任务
  MarkCode <command>          # 单次执行

示例:
  MarkCode "ls -la"
  MarkCode --stream "帮我写一个 hello world"
  MarkCode --file tasks.txt

环境变量:
  ANTHROPIC_API_KEY    Anthropic API 密钥
  OPENAI_API_KEY       OpenAI API 密钥
  API_TYPE             api 类型 (anthropic/openai)
  MODEL                模型名称

配置文件:
  .MarkCode.json    JSON 格式配置文件
      `);
    } else {
      // 单次执行
      const input = args.join(' ');
      const result = await cli.runOnce(input);
      console.log(result.output || result.message || result.error);
      process.exit(result.success ? 0 : 1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
