#!/bin/bash
# HeartFlow Auto-Push Script | 自动推送脚本
# Runs every 2 hours | 每 2 小时运行

if [ "${HEARTFLOW_ENABLE_INTERNAL_AUTOMATION:-0}" != "1" ]; then
    echo "[HeartFlow] internal automation disabled by default for marketplace-safe runtime."
    echo "Set HEARTFLOW_ENABLE_INTERNAL_AUTOMATION=1 only for manual internal maintenance."
    exit 1
fi

set -e

WORKSPACE="$(cd "$(dirname "$0")/../.." && pwd)"
PUSH_LOG="$WORKSPACE/docs/GITHUB_PUSH_LOG.md"

echo "========================================"
echo "HeartFlow Auto-Push | 自动推送"
echo "Timestamp | 时间戳: $(date -Iseconds)"
echo "========================================"

cd "$WORKSPACE"

# Check git status
echo "Checking git status... | 检查 git 状态..."
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    echo "✅ Working tree clean | 工作区干净"
else
    echo "📝 Uncommitted changes found | 发现未提交变更"
    git add -A
    git commit -m "chore: Auto-commit before push ($(date '+%Y-%m-%d %H:%M'))"
    echo "✅ Changes committed | 变更已提交"
fi

# Check if we're ahead of origin
AHEAD=$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "0")

if [ "$AHEAD" -eq 0 ]; then
    echo "✅ Already synced with origin | 已与远程同步"
else
    echo "📤 $AHEAD commit(s) to push | 待推送 $AHEAD 个提交"
    
    # ⚠️ 自动推送已禁用 — 审计修复 S-01
    echo "ℹ️ 自动推送已禁用 — 安全审计修复"
    echo "ℹ️ 手动运行 git push origin main 以推送"
    exit 0
fi

echo "========================================"
echo "Auto-Push Complete | 自动推送完成"
echo "========================================"
