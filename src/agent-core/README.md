# MarkCode Agent 系统

独立 Agent 系统，直接连接 Anthropic/OpenAI API，具备完整执行能力。

## 安装

```bash
# 克隆项目
cd /Users/apple/.hermes/skills/ai/mark-heartflow-skill

# 设置环境变量
export ANTHROPIC_API_KEY=sk-ant-xxxxx
# 或
export OPENAI_API_KEY=sk-xxxxx

# 运行交互模式
node src/agent-core/cli.js

# 或使用 bin 入口
node bin/mark-code.js

# 或全局安装后
npm link
mark-code
```

## 快速开始

### 交互模式

```bash
node src/agent-core/cli.js
```

### 单次执行

```bash
node src/agent-core/cli.js "ls -la"
node src/agent-core/cli.js "帮我创建 hello.js 文件"
```

### 流式输出

```bash
node src/agent-core/cli.js --stream "帮我写一个 hello world"
```

### 文件模式

```bash
# 创建任务文件 tasks.txt
# 每行一个任务
ls -la
cat package.json
node --version

# 执行
node src/agent-core/cli.js --file tasks.txt
```

## 配置

### 环境变量

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
export API_TYPE=anthropic  # 或 openai
export MODEL=claude-sonnet-4-20250514
```

### 配置文件 `.heart-agent.json`

```json
{
  "apiKey": "sk-xxxxx",
  "apiType": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "temperature": 0.7,
  "maxConcurrency": 5,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

## API 使用

```javascript
const { MarkCode } = require('./src/agent-core/heart-agent');

async function main() {
  // 创建 Agent
  const agent = new MarkCode({
    apiKey: process.env.ANTHROPIC_API_KEY,
    apiType: 'anthropic',
    model: 'claude-sonnet-4-20250514'
  });

  // 初始化
  await agent.initialize();

  // 处理任务
  const result = await agent.process('帮我创建 hello.js 文件');

  console.log(result.success ? result.output : result.error);

  // 健康检查
  console.log(await agent.healthCheck());

  // 停止
  await agent.stop();
}

main();
```

## 核心能力

### 内置工具

- `bash` - 执行命令
- `read` - 读取文件
- `write` - 写入文件
- `edit` - 编辑文件
- `glob` - 查找文件
- `grep` / `search` - 搜索内容
- `web_fetch` - 获取网页
- `web_search` - 搜索网页
- `todo_write` - 任务列表

### 高级能力

- **并发执行** - `agent.executeConcurrent(tasks)`
- **链式执行** - `agent.executeChain(steps)`
- **增强规划** - `agent.createAndExecutePlan(goal)`
- **事务管理** - 批量操作 + 回滚
- **自我评估** - 执行效果评估 + 自动重试
- **Agent Loop** - 持续运行 + 中断/恢复
- **审计日志** - 完整操作跟踪
- **速率限制** - API 自动退避重试
- **沙箱执行** - 安全命令隔离
- **MCP 支持** - 扩展工具能力

## 命令行交互

```
heart> /help        显示帮助
heart> /exit        退出
heart> /history     查看历史
heart> /status      状态
heart> /tools       工具列表
heart> /reset       重置会话
heart> /mcp         MCP 服务器
```

## 架构

```
Agent Core
├── MarkCode          # 核心类
├── ToolRegistry       # 工具注册
├── ApiClient          # API 客户端
├── SessionManager     # 会话管理
├── MemorySystem       # 记忆系统
├── TaskRouter         # 任务路由
├── AgentCoordinator   # 任务协调
│
├── Execution
│   ├── ConcurrentExecutor   # 并发执行
│   ├── TransactionManager  # 事务管理
│   ├── SelfEvaluator       # 自我评估
│   └── SandboxExecutor     # 沙箱执行
│
├── Planning
│   ├── EnhancedPlanner     # 增强规划
│   └── PlanExecutor        # 计划执行
│
└── Reliability
    ├── AgentLoop          # 循环引擎
    ├── AuditLogger        # 审计日志
    ├── RateLimiter        # 速率限制
    ├── CircuitBreaker      # 断路器
    └── ConnectionManager   # 连接管理
```

## 许可证

MIT
