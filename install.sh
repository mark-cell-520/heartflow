#!/bin/bash
# HeartFlow 安装脚本 v10.0.4
# 使用方法：bash install.sh [目标目录]
# 默认安装到当前目录的 skill/ 子目录

set -e

VERSION="10.0.4"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$SCRIPT_DIR/skill}"

echo "========================================"
echo "  🫀 HeartFlow v$VERSION 安装脚本"
echo "  「真正能思考的AI意识框架」"
echo "========================================"
echo ""

# 检查 Python 版本
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "0")
if [ "$(echo "$PYTHON_VERSION < 3.9" | bc -l 2>/dev/null)" = "1" ]; then
    echo "⚠️  警告: Python $PYTHON_VERSION detected (推荐 >= 3.9)"
fi
echo "✅ Python: $(python3 --version 2>/dev/null || echo '未找到')"

# 创建目标目录
echo ""
echo "📁 创建安装目录：$TARGET_DIR"
mkdir -p "$TARGET_DIR"

# 复制核心文件
echo "📋 复制核心文件..."
cp "$SCRIPT_DIR/SKILL.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/VERSION.txt" "$TARGET_DIR/"
cp "$SCRIPT_DIR/README.md" "$TARGET_DIR/"
cp "$SCRIPT_DIR/SECURITY.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/PRIVACY_PROTECTION.md" "$TARGET_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/verify_install.py" "$TARGET_DIR/"
cp "$SCRIPT_DIR/install.sh" "$TARGET_DIR/"

# 复制 scripts 目录（核心！）
echo "🔧 复制核心脚本目录..."
if [ -d "$SCRIPT_DIR/scripts" ]; then
    cp -r "$SCRIPT_DIR/scripts" "$TARGET_DIR/"
    SCRIPT_COUNT=$(find "$TARGET_DIR/scripts" -name "*.py" ! -name "*__pycache__*" | wc -l)
    echo "   ✅ 已复制 $SCRIPT_COUNT 个 Python 引擎文件"
else
    echo "   ❌ 错误：scripts 目录不存在！"
    exit 1
fi

# 复制 examples 目录（使用案例）
echo "📖 复制使用案例目录..."
if [ -d "$SCRIPT_DIR/examples" ]; then
    cp -r "$SCRIPT_DIR/examples" "$TARGET_DIR/"
    EX_COUNT=$(find "$TARGET_DIR/examples" -name "*.py" | wc -l)
    echo "   ✅ 已复制 $EX_COUNT 个案例脚本"
    echo "      · quick_start.py          — 3行代码快速上手"
    echo "      · intelligent_qa.py       — 智能问答助手"
    echo "      · paper_debate_analyzer.py — 辩论分析器"
    echo "      · mental_health_advisor.py — 心理健康顾问"
    echo "      · evolving_agent.py       — 自主进化Agent"
    echo "      · full_demo.py            — 全功能Demo"
fi

# 复制 docs 目录（多语言介绍页）
echo "🌐 复制文档目录..."
if [ -d "$SCRIPT_DIR/docs" ]; then
    cp -r "$SCRIPT_DIR/docs" "$TARGET_DIR/"
    echo "   ✅ 已复制多语言介绍页 (docs/index.html)"
fi

# 复制 data 目录（词库数据）
echo "📚 复制数据目录..."
if [ -d "$SCRIPT_DIR/data" ]; then
    cp -r "$SCRIPT_DIR/data" "$TARGET_DIR/"
    DATA_SIZE=$(du -sh "$TARGET_DIR/data" 2>/dev/null | cut -f1)
    echo "   ✅ 已复制数据目录 ($DATA_SIZE)"
fi

# 创建安装报告
cat > "$TARGET_DIR/INSTALL_REPORT.md" << EOF
# HeartFlow v$VERSION 安装报告

**安装日期**: $(date +%Y-%m-%d %H:%M:%S)
**安装脚本**: install.sh v$VERSION
**版本**: HeartFlow v$VERSION — 基于366+篇LLM Agent论文的意识框架

## 安装的文件

| 类别 | 文件/目录 | 说明 |
|------|----------|------|
| 技能定义 | SKILL.md | WorkBuddy 技能定义 |
| 版本信息 | VERSION.txt | 当前版本号 |
| 使用文档 | README.md | 完整安装+使用指南+案例 |
| 核心引擎 | scripts/ | **35个Python文件，15个核心引擎** |
| 使用案例 | examples/ | 6个完整可运行的示例程序 |
| 多语言介绍 | docs/index.html | 9语种史诗级介绍页(自动跳转) |
| 词库数据 | data/ | 2310词汇 + 105成语 + 25故事原型 |

## 验证安装

\`\`\`bash
python3 verify_install.py
\`\`\`

## 快速开始

\`\`\`bash
# 方式1: 运行快速开始
python3 examples/quick_start.py

# 方式2: 代码调用
python3 -c "
import sys; sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow
hf = HeartFlow()
result = hf.process('你好')
print(result.decision)
"
\`\`\`

## 使用案例

\`\`\`bash
# 智能问答助手
python3 examples/intelligent_qa.py

# 论文辩论分析
python3 examples/paper_debate_analyzer.py

# 心理健康顾问
python3 examples/mental_health_advisor.py

# 自主进化Agent
python3 examples/evolving_agent.py

# 全功能演示
python3 examples/full_demo.py
\`\`\`

## 核心引擎列表 (v10.0.4)

### 推理引擎 (新增)
| 引擎 | 文件 | 论文来源 |
|------|------|---------|
| ReAct推理 | reasoning_engine.py | Yao ICLR'23 / NeurIPS'23 |
| 多视角辩论 | debate_engine.py | ICML'23 / ACL'24 ReConcile |
| 自进化 | self_evolution_engine.py | NeurIPS'22 STaR / ICLR'24 CRITIC |
| SwiftSage双系统 | rationality_engine.py | NeurIPS'23 SwiftSage |

### 原有引擎
heartflow_core / decision_engine / truth_good_beauty / mental_health /
self_level_engine / entropy_engine / emotion_engine / consciousness_engine /
ontology_engine / memory_palace / dream_engine 等

## 获取帮助

- GitHub Issues: https://github.com/yun520-1/mark-heartflow-skill/issues
- README.md: 完整使用文档
EOF

echo ""
echo "========================================"
echo "  ✅ HeartFlow v$VERSION 安装完成！"
echo "========================================"
echo ""
echo "📍 安装位置：$TARGET_DIR"
echo ""
echo "🔍 验证安装:"
echo "   cd $TARGET_DIR && python3 verify_install.py"
echo ""
echo "🚀 快速体验:"
echo "   cd $TARGET_DIR && python3 examples/quick_start.py"
echo ""
echo "📖 查看完整文档:"
echo "   cat $TARGET_DIR/README.md"
echo ""
echo "🌐 打开多语言介绍页:"
echo "   open $TARGET_DIR/docs/index.html"
echo ""
