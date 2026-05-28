#!/bin/bash
#
# HeartFlow Agent 安装脚本
#

set -e

echo "========================================"
echo "HeartFlow Agent 安装脚本"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 需要 Node.js 18+"
    echo "请从 https://nodejs.org 安装"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "错误: 需要 Node.js 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"

# 检查 API 密钥
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "警告: 未设置 API 密钥环境变量"
    echo "请设置以下环境变量之一:"
    echo "  export ANTHROPIC_API_KEY=sk-ant-xxxxx"
    echo "  export OPENAI_API_KEY=sk-xxxxx"
    echo ""
fi

# 创建必要目录
echo ""
echo "创建数据目录..."
mkdir -p data/audit
mkdir -p data/sessions
mkdir -p data/projects
mkdir -p data/longterm
mkdir -p data/cross-session
mkdir -p data/experiences
mkdir -p .sandbox

# 创建示例配置
if [ ! -f .heart-agent.json ]; then
    echo ""
    echo "创建示例配置文件..."
    cat > .heart-agent.json << 'EOF'
{
  "apiType": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "temperature": 0.7,
  "maxConcurrency": 5,
  "maxContextMessages": 100,
  "mcpServers": {}
}
EOF
    echo "✓ 已创建 .heart-agent.json"
    echo "  请编辑添加您的 API 密钥"
fi

# 验证安装
echo ""
echo "验证安装..."
cd "$(dirname "$0")/.."

if node --check src/agent-core/heart-agent.js 2>/dev/null; then
    echo "✓ heart-agent.js 语法正确"
else
    echo "✗ heart-agent.js 语法错误"
    exit 1
fi

if node --check src/agent-core/cli.js 2>/dev/null; then
    echo "✓ cli.js 语法正确"
else
    echo "✗ cli.js 语法错误"
    exit 1
fi

# 完成
echo ""
echo "========================================"
echo "安装完成！"
echo "========================================"
echo ""
echo "快速开始:"
echo "  # 设置 API 密钥"
echo "  export ANTHROPIC_API_KEY=sk-ant-xxxxx"
echo ""
echo "  # 运行交互模式"
echo "  node src/agent-core/cli.js"
echo ""
echo "  # 或使用 bin 入口"
echo "  node bin/heart-agent.js"
echo ""
echo "文档: src/agent-core/README.md"
echo ""
